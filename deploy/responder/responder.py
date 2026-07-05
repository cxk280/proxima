#!/usr/bin/env python3
"""Proxima probe responder — the tiny box that makes a region's wire-RTT real.

It answers HEAD/GET on port 80 with a bare 200. No GPU, no state, no
inference; its only job is to exist in a Vultr region so the app's server-side
HEAD probe measures a genuine round-trip to that region. Runs on the cheapest
instance Vultr sells."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    server_version = "proxima-probe/1"

    def _respond(self, body=b""):
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if body:
            self.wfile.write(body)

    def do_HEAD(self):
        self._respond()

    def do_GET(self):
        self._respond(b"ok")

    def log_message(self, *_):  # stay quiet; journald would fill up
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 80), Handler).serve_forever()
