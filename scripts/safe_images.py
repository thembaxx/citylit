"""Decode a bounded still photograph and drop metadata when writing a local JPEG."""
import io
import warnings
from PIL import Image


def save_photo(raw, destination):
    if len(raw) > 12 * 1024 * 1024:
        raise ValueError("Image exceeds the byte budget")
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw)) as original:
            if original.width * original.height > 12_000_000:
                raise ValueError("Image exceeds the pixel budget")
            if original.format not in ("JPEG", "PNG", "WEBP") or getattr(original, "n_frames", 1) != 1:
                raise ValueError("Only still JPEG, PNG and WebP photographs are accepted")
            original.thumbnail((1200, 1200))
            original.convert("RGB").save(destination, format="JPEG", quality=83, optimize=True)
