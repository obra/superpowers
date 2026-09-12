"""Accepted narration shared by rendering and assembly."""

import json
from pathlib import Path


def normalized_text(text):
    return " ".join((text or "").split())


def accepted_narration(narration_dir, scenes):
    """Return accepted WAVs for narrated non-movie scenes, or explain the gap."""
    required = [scene for scene in scenes
                if scene.get("kind", "frames") != "movie"
                and normalized_text(scene.get("narration"))]
    if not required:
        return {}
    manifest_path = narration_dir / "manifest.json"
    if not manifest_path.is_file():
        raise ValueError(f"missing narration manifest: {manifest_path}")
    try:
        entries = json.loads(manifest_path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise ValueError(f"invalid narration manifest: {error}") from error
    by_id = {entry.get("id"): entry for entry in entries if isinstance(entry, dict)}
    accepted = {}
    for scene in required:
        sid = scene["id"]
        entry = by_id.get(sid)
        if entry is None:
            raise ValueError(f"scene {sid}: missing accepted narration entry")
        if entry.get("text") != normalized_text(scene.get("narration")):
            raise ValueError(f"scene {sid}: accepted narration text changed")
        wav_name = entry.get("wav")
        if not isinstance(wav_name, str) or not wav_name or Path(wav_name).is_absolute():
            raise ValueError(f"scene {sid}: invalid accepted narration WAV")
        wav = narration_dir / wav_name
        if not wav.is_file():
            raise ValueError(f"scene {sid}: missing accepted narration WAV: {wav}")
        accepted[sid] = wav
    return accepted
