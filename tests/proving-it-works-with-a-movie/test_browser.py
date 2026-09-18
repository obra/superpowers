import os
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image
import fixtures


class BrowserToolsRegression(unittest.TestCase):
    def test_explicit_unusable_browser_fails_authoritatively(self):
        module = fixtures.load_script("browser_tools")
        with self.assertRaises(FileNotFoundError):
            module.find_browser("this-browser-does-not-exist")
        if os.name != "nt":
            with tempfile.NamedTemporaryFile() as file:
                with self.assertRaises(FileNotFoundError):
                    module.find_browser(file.name)

    def test_windows_chrome_edge_discovery(self):
        module = fixtures.load_script("browser_tools")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for relative in ("Google/Chrome/Application/chrome.exe", "Microsoft/Edge/Application/msedge.exe"):
                browser = root / relative
                browser.parent.mkdir(parents=True)
                browser.touch()
                with patch.object(module.sys, "platform", "win32"), patch.dict(os.environ, {"LOCALAPPDATA": str(root)}, clear=True), patch.object(module.shutil, "which", return_value=None):
                    self.assertEqual(module.find_browser(None), str(browser.resolve()))
                browser.unlink()
            with patch.object(module.sys, "platform", "win32"), patch.dict(os.environ, {}, clear=True), patch.object(module.shutil, "which", side_effect=lambda name: "C:/Edge/msedge.exe" if name == "msedge.exe" else None):
                self.assertEqual(module.find_browser(None), "C:/Edge/msedge.exe")

    def browser(self, module):
        browser = module.find_browser(os.environ.get("MOVIE_BROWSER"))
        if not browser:
            self.skipTest("Chrome/Edge is required")
        return browser

    def test_render_card_special_path_is_a_real_png(self):
        module = fixtures.load_script("browser_tools")
        browser = self.browser(module)
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory) / "special path O'Brien λ # %"
            work.mkdir()
            html, png = work / "card page.html", work / "card.png"
            html.write_text("<meta charset='utf-8'><style>body{margin:0;background:rgb(255,0,0)}</style><p>λ</p>", encoding="utf-8")
            module.render_card(html, png, browser=browser, width=640, height=360)
            with Image.open(png) as image:
                self.assertEqual(image.size, (640, 360))
                self.assertEqual(image.convert("RGB").getpixel((500, 200)), (255, 0, 0))

    def test_render_card_timeout_preserves_unrelated_process(self):
        module = fixtures.load_script("browser_tools")
        browser = self.browser(module)
        sentinel = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
        try:
            with tempfile.TemporaryDirectory() as directory:
                work = Path(directory)
                html = work / "card.html"
                html.write_text("<p>timeout</p>", encoding="utf-8")
                start = time.monotonic()
                with self.assertRaises(TimeoutError):
                    module.render_card(html, work / "card.png", browser=browser, width=640, height=360, timeout=0)
                self.assertLess(time.monotonic() - start, 10)
                self.assertIsNone(sentinel.poll())
        finally:
            sentinel.terminate()
            sentinel.wait(timeout=10)
