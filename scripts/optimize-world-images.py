"""Trim and optimize generated world-map art for the mobile game bundle."""

from pathlib import Path

from PIL import Image, ImageOps


ASSET_DIR = Path("public/assets/images/world")
SOURCE_DIR = Path("art/source/world")
ASSETS = (
    "dajare-ship.png",
    "island-moji.png",
    "island-kanji.png",
    "island-kotoba.png",
    "island-yomi.png",
    "island-kaki.png",
)
BACKGROUNDS = {
    "background-welcome-source.png": "background-welcome.webp",
    "background-ocean-map-source.png": "background-ocean-map.webp",
    "background-island-board-source.png": "background-island-board.webp",
}
CANVAS_SIZE = 512
CONTENT_SIZE = 496
BACKGROUND_SIZE = (810, 1080)


def optimize_cutout(path: Path) -> None:
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


def optimize_background(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source:
        rgb = source.convert("RGB")
    resized = ImageOps.fit(rgb, BACKGROUND_SIZE, method=Image.Resampling.LANCZOS)
    resized.save(output_path, format="WEBP", quality=82, method=6)
    print(f"{output_path}: {output_path.stat().st_size // 1024} KiB")


for asset_name in ASSETS:
    optimize_cutout(ASSET_DIR / asset_name)

for source_name, output_name in BACKGROUNDS.items():
    optimize_background(SOURCE_DIR / source_name, ASSET_DIR / output_name)
