"""Serve only the compiled public portfolio behind the local HTTPS tunnel."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--directory", type=Path, required=True)
parser.add_argument("--port", type=int, default=18090)
args = parser.parse_args()
root = args.directory.resolve(strict=True)
if not (root / "index.html").is_file():
    raise SystemExit("A compiled portfolio is required")

class PortfolioHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        requested = unquote(urlsplit(self.path).path)
        if "\x00" in requested or "\\" in requested or any(part.startswith(".") for part in requested.split("/") if part):
            self.send_error(404)
            return None
        candidate = (root / requested.lstrip("/")).resolve()
        if not candidate.is_relative_to(root):
            self.send_error(404)
            return None
        aliases = {"/uaecodes.html": "/", "/cv-full.html": "/cv.html", "/project.html": "/#work"}
        if requested in aliases or requested.startswith("/projects/"):
            self.send_response(301)
            self.send_header("Location", aliases.get(requested, "/#work"))
            self.end_headers()
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'")
        self.send_header("Cache-Control", "public, max-age=86400" if urlsplit(self.path).path.startswith("/assets/") else "no-cache")
        super().end_headers()

handler = partial(PortfolioHandler, directory=str(root))
server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
print(f"Portfolio listening on http://127.0.0.1:{args.port}", flush=True)
server.serve_forever()
