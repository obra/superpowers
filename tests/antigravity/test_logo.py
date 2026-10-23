"""Check the Antigravity Marketplace logo: a square RGBA PNG at least
128x128 (the Marketplace minimum), at the path the manifest names. When
rsvg-convert is available, also check the committed PNG matches a fresh
render, so the asset can't drift from scripts/render-antigravity-logo.sh.

Converted from tests/antigravity/test-logo.sh (bash wrapper around a
Python heredoc) — see superpowers#dev "tests: convert wrapped-Python bash
tests to plain pytest".
"""
import filecmp
import shutil
import struct
import subprocess
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
LOGO_PATH = REPO_ROOT / "assets" / "antigravity-logo.png"


def test_logo_exists():
    assert LOGO_PATH.is_file(), f"logo missing at {LOGO_PATH}"


def _read_png_header():
    data = LOGO_PATH.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "logo is not a PNG"
    width, height, bit_depth, color_type = struct.unpack(">IIBB", data[16:26])
    return width, height, bit_depth, color_type


def test_logo_is_png():
    _read_png_header()


def test_logo_is_square():
    width, height, _bit_depth, _color_type = _read_png_header()
    assert width == height, f"logo is not square ({width}x{height})"


def test_logo_is_at_least_128px():
    width, height, _bit_depth, _color_type = _read_png_header()
    assert width >= 128, f"logo is smaller than 128x128 ({width}x{height})"


def test_logo_is_rgba():
    _width, _height, _bit_depth, color_type = _read_png_header()
    assert color_type == 6, f"logo is not RGBA (PNG color type {color_type})"


@pytest.mark.skipif(
    shutil.which("rsvg-convert") is None,
    reason="rsvg-convert not on PATH; not checking logo freshness",
)
def test_logo_matches_fresh_render():
    with tempfile.TemporaryDirectory() as tmp:
        rendered = Path(tmp) / "logo.png"
        subprocess.run(
            [
                "bash",
                str(REPO_ROOT / "scripts" / "render-antigravity-logo.sh"),
                "--output",
                str(rendered),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        assert filecmp.cmp(rendered, LOGO_PATH, shallow=False), (
            "assets/antigravity-logo.png is stale; run "
            "scripts/render-antigravity-logo.sh"
        )
