# CV security cleanup

The panel is a local administrative tool. Run it with Node.js 22.12 or newer. It binds to `127.0.0.1:3000`; publish the portfolio separately from administrative APIs. An HTTPS reverse proxy on the same host may use an explicit `PANEL_ORIGIN` setting. Do not forward arbitrary hosts to the panel.

## Fixed issues

- Admin sessions previously used a predictable repository-path-derived signing secret. Missing configuration now generates a random startup secret. Configured secrets must have at least 32 bytes, and changing the password invalidates existing sessions.
- Case-sensitive authentication checks previously differed from Express routing. Routes now use case-sensitive matching, with normalized protection checks. Login attempts are limited.
- Broad CORS and unrestricted listening were removed. Requests validate Host, Origin and Fetch Metadata; mutations require a custom header sent by the panel client.
- Outlook composition could read an arbitrary path supplied in company data. Reads now stay inside `emails/outreach`, require a text file and resolve symlinks. PDF attachment paths also resolve symlinks before checking containment.
- The page reader previously checked only a hostname string. It now checks resolved addresses, pins the connection, validates each redirect and bounds time and response size.
- Indeed email settings reject line breaks before editing the environment file. Login redirects use an internal route allowlist.
- Dynamic HTML passes through locally bundled DOMPurify. Generated controls use data attributes and a fixed action dispatcher instead of executable event strings. Links opened by the panel require HTTP(S).
- Removed the obsolete image server, destructive browser cleanup controls, tracked browser cache and an old configuration dump. Removed unused cloud-storage and CORS packages. Updated dependency resolutions, including the WhatsApp Puppeteer override.

## Verification and limits

On 2026-09-29, the lockfile dependency audit reported zero known vulnerabilities. Changed JavaScript and inline scripts were parsed, and Git whitespace checks passed. No application, browser automation or tests were run at the owner's request. Browser compatibility after the Puppeteer major upgrade still needs operational verification before use.

The two local copies were consolidated with the newer resume changes. Older branch additions that restored unsafe browser controls or the obsolete image server were superseded rather than reintroduced; dependency branch changes were superseded by newer patched resolutions.

Old public Git history contains WhatsApp browser-session artifacts. Removing branches and current files does not erase that history or revoke sessions. Review and revoke the affected linked devices in WhatsApp; historical cleanup requires a separate coordinated history rewrite. This change does not claim the repository has no possible vulnerabilities.

For a blank session secret, restarting the panel invalidates sessions. Third-party API clients must send `X-CV-Request: 1` on mutations. The dependency install intentionally disables lifecycle scripts, so browser binaries are not downloaded automatically.
