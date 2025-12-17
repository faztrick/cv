/*
  Send a single WhatsApp message via the existing Control Panel WhatsApp integration.

  This script calls your local server endpoints:
    - GET  /api/whatsapp/status
    - POST /api/whatsapp/send
    - POST /api/whatsapp/send-pdf

  Safety:
    - Requires explicit --yes to actually send.
    - Single-recipient only (no bulk / loops).

  Examples:
    node scripts/whatsapp-send-cli.js --number "+9715XXXXXXXX" --message "Hi ..." --yes
    node scripts/whatsapp-send-cli.js --number "+9715XXXXXXXX" --message "CV attached" --pdf "resumes/resume-fasil-software-2025.pdf" --yes
*/

const http = require('http');
const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function requestJson(method, urlPath, body) {
  const payload = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: urlPath,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(payload ? { 'Content-Length': payload.length } : {})
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let json;
        try {
          json = raw ? JSON.parse(raw) : {};
        } catch {
          json = { raw };
        }
        if (res.statusCode && res.statusCode >= 400) {
          const msg = json?.error || json?.message || raw || `HTTP ${res.statusCode}`;
          const err = new Error(msg);
          err.statusCode = res.statusCode;
          err.response = json;
          return reject(err);
        }
        resolve(json);
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const args = parseArgs(process.argv);

  const number = args.number || args.to;
  const message = args.message || args.text;
  const pdf = args.pdf;
  const yes = Boolean(args.yes);

  if (!number || !message) {
    console.error('Missing required args: --number and --message');
    console.error('Example: node scripts/whatsapp-send-cli.js --number "+9715XXXXXXXX" --message "Hi ..." --yes');
    process.exit(1);
  }

  // 1) Check server + WhatsApp status
  let status;
  try {
    status = await requestJson('GET', '/api/whatsapp/status');
  } catch (e) {
    console.error('Cannot reach the local panel server at http://localhost:3000');
    console.error('Start it with: npm run panel  (then open http://localhost:3000/panel and connect WhatsApp)');
    console.error(`Details: ${e.message}`);
    process.exit(1);
  }

  const waStatus = status?.status;
  if (waStatus !== 'CONNECTED' && waStatus !== 'AUTHENTICATED') {
    console.error(`WhatsApp client not ready (status: ${waStatus}).`);
    console.error('Open http://localhost:3000/panel -> WhatsApp tab -> scan QR, then try again.');
    process.exit(1);
  }

  const payload = { number, message };

  if (!yes) {
    console.log('DRY RUN (no message sent). Re-run with --yes to send.');
    console.log('Payload:', payload);
    if (pdf) console.log('PDF:', pdf);
    return;
  }

  // 2) Send
  if (pdf) {
    const absPdf = path.isAbsolute(pdf) ? pdf : path.resolve(process.cwd(), pdf);
    const res = await requestJson('POST', '/api/whatsapp/send-pdf', {
      ...payload,
      pdfPath: absPdf
    });
    console.log('Sent PDF successfully:', res);
  } else {
    const res = await requestJson('POST', '/api/whatsapp/send', payload);
    console.log('Sent message successfully:', res);
  }
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
