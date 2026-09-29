'use strict';

const fs = require('node:fs');
const path = require('node:path');
const dns = require('node:dns').promises;
const http = require('node:http');
const https = require('node:https');
const ipaddr = require('ipaddr.js');

function installRequestGuards(app, port) {
    const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);
    if (process.env.PANEL_ORIGIN) {
        const origin = new URL(process.env.PANEL_ORIGIN);
        if (origin.protocol !== 'https:' || origin.username || origin.password || origin.origin !== process.env.PANEL_ORIGIN) {
            throw new Error('PANEL_ORIGIN must be an HTTPS origin without a path');
        }
        origins.add(origin.origin);
    }
    const hosts = new Set([...origins].map(origin => new URL(origin).host));
    app.disable('x-powered-by');
    app.enable('case sensitive routing');
    app.use((req, res, next) => {
        // Host checks block DNS rebinding; the listener is also loopback-only.
        if (!hosts.has((req.headers.host || '').toLowerCase())) {
            return res.status(403).json({ error: 'Host is not allowed' });
        }
        const requestOrigin = req.headers.origin;
        if ((requestOrigin && !origins.has(requestOrigin)) || req.headers['sec-fetch-site'] === 'cross-site') {
            return res.status(403).json({ error: 'Cross-origin requests are not allowed' });
        }
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['x-cv-request'] !== '1') {
            return res.status(403).json({ error: 'Missing request verification header' });
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'no-referrer');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Cache-Control', 'no-store');
        next();
    });
}

// A bounded, process-local limit avoids an attacker growing an IP-keyed map.
let loginWindow = 0;
let loginAttempts = 0;
function loginRateLimit(req, res, next) {
    const now = Date.now();
    if (now >= loginWindow) {
        loginWindow = now + 15 * 60 * 1000;
        loginAttempts = 0;
    }
    if (++loginAttempts > 20) {
        res.setHeader('Retry-After', String(Math.ceil((loginWindow - now) / 1000)));
        return res.status(429).json({ error: 'Too many login attempts; try again later' });
    }
    next();
}

function resolveContainedFile(root, input, extension) {
    if (typeof input !== 'string' || !input.trim() || input.includes('\0')) return null;
    try {
        const realRoot = fs.realpathSync(root);
        const file = fs.realpathSync(path.resolve(root, input));
        const relative = path.relative(realRoot, file);
        if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
        if (extension && path.extname(file).toLowerCase() !== extension) return null;
        return fs.statSync(file).isFile() ? file : null;
    } catch {
        return null;
    }
}

async function fetchPublicText(input, remainingRedirects = 3, deadline = Date.now() + 15000) {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) {
        throw new Error('Only public HTTP(S) pages on standard ports are allowed');
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Page request timed out');
    let timer;
    let addresses;
    try {
        addresses = await Promise.race([
            dns.lookup(hostname, { all: true, verbatim: true }),
            new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error('DNS lookup timed out')), remaining); })
        ]);
    } finally {
        clearTimeout(timer);
    }
    if (!addresses.length || addresses.some(({ address }) => ipaddr.process(address).range() !== 'unicast')) {
        throw new Error('Private or reserved network destinations are not allowed');
    }
    // Pin the validated address to this connection, including every redirect hop.
    const pinned = addresses[0];
    const result = await new Promise((resolve, reject) => {
        const transport = url.protocol === 'https:' ? https : http;
        const request = transport.get(url, {
            agent: false,
            signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())),
            lookup: (name, options, callback) => options.all
                ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family),
            headers: { 'User-Agent': 'CV-Contact-Reader', 'Accept': 'text/html, text/plain', 'Accept-Encoding': 'identity' }
        }, response => {
            const status = response.statusCode;
            if ([301, 302, 303, 307, 308].includes(status)) {
                const location = response.headers.location;
                response.destroy();
                return resolve({ location });
            }
            if (status < 200 || status >= 300 || !/^text\/(html|plain)(?:;|$)/i.test(response.headers['content-type'] || '')) {
                response.destroy();
                return reject(new Error('Destination did not return a text page'));
            }
            const chunks = [];
            let length = 0;
            response.on('data', chunk => {
                length += chunk.length;
                if (length > 2 * 1024 * 1024) {
                    response.destroy(new Error('Page exceeds the 2 MiB limit'));
                    return;
                }
                chunks.push(chunk);
            });
            response.on('error', reject);
            response.on('end', () => resolve({ text: Buffer.concat(chunks).toString('utf8') }));
        });
        request.on('error', reject);
    });
    if (Object.hasOwn(result, 'location')) {
        if (!result.location || remainingRedirects <= 0) throw new Error('Invalid or excessive redirects');
        return fetchPublicText(new URL(result.location, url).href, remainingRedirects - 1, deadline);
    }
    return result.text;
}

module.exports = { installRequestGuards, loginRateLimit, resolveContainedFile, fetchPublicText };
