"""Trim and optimize generated world-map art for the mobile game bundle."""

from pathlib import Path

from PIL import Image


ASSET_DIR = Path("public/assets/images/world")
ASSETS = (
    "dajare-ship.png",
    "island-moji.png",
    "island-kanji.png",
    "island-kotoba.png",
    "island-yomi.png",
    "island-kaki.png",
)
CANVAS_SIZE = 512
CONTENT_SIZE = 496


def optimize(path: Path) -> None:
    with Image.open(path) as source:
        rgba = source.convert("RGBA")

    bounds = rgba.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"{path} has no visible pixels")

    cropped = rgba.crop(bounds)
    cropped.thumbnail((CONTENT_SIZE, CONTENT_SIZE), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    offset = ((CANVAS_SIZE - cropped.width) // 2, (CANVAS_SIZE - cropped.height) // 2)
    canvas.alpha_composite(cropped, offset)

    indexed = canvas.quantize(
        colors=256,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.NONE,
    )
    indexed.save(path, format="PNG", optimize=True)
    print(f"{path}: {path.stat().st_size // 1024} KiB")


for asset_name in ASSETS:
    optimize(ASSET_DIR / asset_name)
