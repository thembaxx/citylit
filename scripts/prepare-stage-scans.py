"""Preserve the original resolution of the local, CC0 architectural surface scans.

The previous 320 px / JPEG quality 80 conversion erased visible brick, mortar,
stone, wood and grass detail before the GLBs were created. Full-size CC0 images
are already checked into scripts/.museum-pbr; no runtime network fetch.
"""
import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / ".museum-pbr"
DEST = ROOT / ".stage-pbr"
MAX_EDGE = int(os.environ.get("CITYLIT_PBR_MAX_EDGE", "2048"))
if not 256 <= MAX_EDGE <= 8192:
    raise ValueError("CITYLIT_PBR_MAX_EDGE must be 256–8192")

for category in ("bricks", "paving", "grass", "wood"):
    folder = DEST / category
    folder.mkdir(parents=True, exist_ok=True)
    for channel in ("Color", "NormalGL", "Roughness"):
        matches = sorted(
            p for p in (SOURCE / category).iterdir()
            if channel.lower() in p.stem.lower()
            and p.suffix.lower() in (".jpg", ".jpeg", ".png")
        )
        if not matches:
            raise RuntimeError("Missing ambientCG CC0 map: " + category + "/" + channel)
        target = folder / (category + "_" + channel + ".jpg")
        with Image.open(matches[0]) as source:
            image = source.convert("RGB")
            image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
            # Avoid lossy 320px preview-style downsizing; preserve source detail.
            image.save(target, "JPEG", quality=94, optimize=True, subsampling=0)
        if target.stat().st_size < 1000:
            raise RuntimeError("Unexpected empty scan: " + str(target))
        print(target.relative_to(ROOT), target.stat().st_size, "bytes")
