#!/usr/bin/env python3
"""Laguna Gold — screenshot + smoke test runner (first-hand).

Serves app/ on localhost, opens each ?shot= scene in headless Chromium,
waits for window.__ready, captures the four screenshots the entry needs
(each long side <= 1280, each file <= 256 KiB), and smoke-tests the real
PNG export path. Usage: python3 shots.py [--serve-only]
"""
import http.server
import json
import os
import socketserver
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
SHOTS = ROOT / "screenshots"
PORT = 8932

class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

SCENES = [
    # (shot query, output name, element to capture, viewport, jpeg quality)
    ("cover", "1-cover.jpg", "#cover", (1060, 1060), 80),
    ("editor", "2-editor.jpg", None, (1280, 960), 85),
    ("halftone", "3-cover-halftone.jpg", "#cover", (1060, 1060), 62),
    ("portrait", "4-cover-portrait.jpg", "#cover", (1060, 1320), 80),
]


def serve():
    os.chdir(APP)
    handler = http.server.SimpleHTTPRequestHandler
    httpd = ReuseTCPServer(("127.0.0.1", PORT), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def main():
    from playwright.sync_api import sync_playwright

    SHOTS.mkdir(parents=True, exist_ok=True)
    httpd = serve()
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=os.path.expanduser(
                "~/.cache/ms-playwright/chromium-1148/chrome-linux/chrome"))
            page = browser.new_page(viewport={"width": 1280, "height": 960})
            console_errors = []
            page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: console_errors.append(str(e)))

            for shot, name, selector, viewport, quality in SCENES:
                page.set_viewport_size({"width": viewport[0], "height": viewport[1]})
                page.goto(f"http://127.0.0.1:{PORT}/index.html?shot={shot}")
                page.wait_for_function("window.__ready === true", timeout=30000)
                page.wait_for_timeout(400)
                target = page.locator(selector) if selector else page
                target.screenshot(path=str(SHOTS / name), type="jpeg", quality=quality)
                info = (SHOTS / name).stat()
                print(f"{name}: {info.st_size} bytes")
                assert info.st_size <= 262144, f"{name} over 256 KiB"

            # Smoke test: real export path, no console errors.
            page.set_viewport_size({"width": 1280, "height": 960})
            page.goto(f"http://127.0.0.1:{PORT}/index.html")
            page.wait_for_function("window.__ready === true", timeout=30000)
            blob_size = page.evaluate(
                "() => window.__laguna.exportPNG(1080, 1080).then(b => b.size)"
            )
            print(f"exportPNG 1080x1080 blob: {blob_size} bytes")
            assert blob_size > 50000, "export PNG suspiciously small"
            blob2 = page.evaluate(
                "() => window.__laguna.exportPNG(1920, 1080).then(b => b.size)"
            )
            print(f"exportPNG 1920x1080 blob: {blob2} bytes")
            assert blob2 > 50000, "wide export PNG suspiciously small"
            print(f"console errors: {len(console_errors)}")
            for e in console_errors:
                print("  CONSOLE ERROR:", e)
            assert not console_errors, "console errors present"
            browser.close()
    finally:
        httpd.shutdown()
    print("SMOKE OK")


if __name__ == "__main__":
    main()
