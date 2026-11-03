"""Fetch pinned CC0 ambientCG 1K PBR maps for the CityLit museum hero.

Original CC0 license: https://docs.ambientcg.com/license/
Do not use or store photographs of the museum; these are generic material scans.
Downloads are build-time only, packed into the generated GLB.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from zipfile import ZipFile, is_zipfile
import shutil
import time

ROOT = Path(__file__).resolve().parent
OUT = ROOT / ".museum-pbr"
ASSETS = {
    "bricks": "Bricks090",
    "paving": "PavingStones128",
    "grass": "Grass004",
    "wood": "Wood096",
}
ALLOWED_MAPS = ("Color", "NormalGL", "Roughness")
MAX_ARCHIVE = 18 * 1024 * 1024
for category, asset in ASSETS.items():
    folder = OUT / category
    folder.mkdir(parents=True, exist_ok=True)
    if all(any(mapname.lower() in p.name.lower() for p in folder.glob("*"))
           for mapname in ALLOWED_MAPS):
        print("Cached:", asset)
        continue

    url = "https://ambientcg.com/get?file=" + asset + "_1K-JPG.zip"
    filename = folder / (asset + ".zip")
    for attempt in range(3):
        try:
            request = Request(url, headers={
                "User-Agent": "CityLit-asset-build/1.0 (educational museum rendering)"
            })
            with urlopen(request, timeout=45) as response, open(filename, "wb") as output:
                shutil.copyfileobj(response, output)
            break
        except (OSError, HTTPError) as exc:
            if attempt == 2:
                raise RuntimeError("CC0 asset unavailable: " + asset) from exc
            time.sleep((attempt + 1) * 3)
    if filename.stat().st_size > MAX_ARCHIVE or not is_zipfile(filename):
        raise RuntimeError("Invalid or oversized ambientCG archive for " + asset)
    with ZipFile(filename) as archive:
        for item in archive.infolist():
            if item.is_dir():
                continue
            if not any(name.lower() in item.filename.lower() for name in ALLOWED_MAPS):
                continue
            if not item.filename.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            if item.file_size > 7 * 1024 * 1024:
                raise RuntimeError("Unexpectedly large PBR texture")
            # Explicit destination avoids path traversal from archive filenames.
            path = folder / Path(item.filename).name
            with archive.open(item) as source, open(path, "wb") as output:
                shutil.copyfileobj(source, output)
    filename.unlink()
    for mapname in ALLOWED_MAPS:
        if not any(mapname.lower() in p.name.lower() for p in folder.iterdir()):
            raise RuntimeError("Missing " + mapname + " PBR map for " + asset)
    print("Prepared CC0 scan:", asset)
print("All museum hero material scans available")
