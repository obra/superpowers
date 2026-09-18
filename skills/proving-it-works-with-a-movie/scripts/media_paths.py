"""Portable media path preparation for the movie assembly tools."""

import shutil
from pathlib import Path


def stage_frames(source: Path, destination: Path) -> list[Path]:
    files = sorted(source.glob("*.png"))
    if not files:
        raise ValueError(f"no PNG frames in {source}")
    destination.mkdir(parents=True, exist_ok=False)
    result = []
    for index, frame in enumerate(files):
        target = destination / f"frame-{index:08d}.png"
        shutil.copyfile(frame, target)
        result.append(target)
    return result


def ffconcat_entry(path: Path) -> str:
    value = path.resolve().as_posix()
    if "\n" in value or "\r" in value:
        raise ValueError("FFconcat paths cannot contain line breaks")
    return "file '" + value.replace("'", "'\\''") + "'\n"


def sequence_pattern(directory: Path, filename_pattern: str) -> str:
    """Keep FFmpeg's frame placeholder while escaping literal directory percent signs."""
    return directory.as_posix().replace("%", "%%") + "/" + filename_pattern
