"""Prepare full-resolution CC0 JPEG scans for the fifteen standalone landmark models.

Sources: scripts/.museum-pbr from the ambientCG CC0 acquisition workflow.
Output: scripts/.stage-pbr (untracked transient asset inputs).
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / ".museum-pbr"
DEST = ROOT / ".stage-pbr"
for category in ("bricks", "paving", "grass", "wood"):
    folder = DEST / category
    folder.mkdir(parents=True, exist_ok=True)
    for channel in ("Color", "NormalGL", "Roughness"):
        matches = sorted(p for p in (SOURCE / category).iterdir()
                         if channel.lower() in p.stem.lower()
                         and p.suffix.lower() in (".jpg", ".jpeg", ".png"))
        if not matches:
            raise RuntimeError("Missing ambientCG CC0 map: " + category + "/" + channel)
        target = folder / (category + "_" + channel + ".jpg")
        with Image.open(matches[0]) as source:
            image = source.convert("RGB")
            image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
            image.save(target, "JPEG", quality=94, optimize=True, subsampling=0)
        if not 1000 <= target.stat().st_size <= 8 * 1024 * 1024:
            raise RuntimeError("Unexpected texture size: " + str(target))
        print(target.relative_to(ROOT), target.stat().st_size, "bytes")
