"""Build the normalized 4x3 human enemy sheet from its generated source."""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

from sprite_utils import alpha_bbox, keep_largest_alpha_component


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art_sources" / "images"
OUTPUT_DIR = ROOT / "src" / "images"
SHEETS = (
    ("enemy_human_3row_imagegen_v2.png", "enemy-human-sprite.png", True),
)


def remove_edge_black_background(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image.convert("RGBA")).copy()
    rgb = pixels[:, :, :3]
    candidate = rgb.max(axis=2) <= 18
    height, width = candidate.shape
    background = np.zeros_like(candidate, dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        queue.extend(((0, x), (height - 1, x)))
    for y in range(height):
        queue.extend(((y, 0), (y, width - 1)))

    while queue:
        y, x = queue.popleft()
        if background[y, x] or not candidate[y, x]:
            continue
        background[y, x] = True
        if y > 0: queue.append((y - 1, x))
        if y + 1 < height: queue.append((y + 1, x))
        if x > 0: queue.append((y, x - 1))
        if x + 1 < width: queue.append((y, x + 1))

    pixels[background] = 0
    return Image.fromarray(pixels, "RGBA")


def build(source_name: str, output_name: str, has_alpha: bool) -> None:
    source = Image.open(SOURCE_DIR / source_name).convert("RGBA")
    rows: list[list[Image.Image]] = []
    sprites: list[Image.Image] = []

    for row in range(3):
        y0 = round(row * source.height / 3)
        y1 = round((row + 1) * source.height / 3)
        row_sprites: list[Image.Image] = []
        for column in range(4):
            x0 = round(column * source.width / 4)
            x1 = round((column + 1) * source.width / 4)
            frame = source.crop((x0, y0, x1, y1))
            if not has_alpha:
                frame = remove_edge_black_background(frame)
            frame = keep_largest_alpha_component(frame)
            sprite = frame.crop(alpha_bbox(frame))
            row_sprites.append(sprite)
            sprites.append(sprite)
        rows.append(row_sprites)

    scale = min(
        118 / max(sprite.width for sprite in sprites),
        118 / max(sprite.height for sprite in sprites),
    )
    output = Image.new("RGBA", (512, 384))
    for row, row_sprites in enumerate(rows):
        for column, sprite in enumerate(row_sprites):
            size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
            sprite = sprite.resize(size, Image.Resampling.LANCZOS)
            x = column * 128 + (128 - sprite.width) // 2
            y = row * 128 + 123 - sprite.height
            output.alpha_composite(sprite, (x, y))

    output.save(OUTPUT_DIR / output_name, optimize=True)
    print(f"created {output_name}: {output.size}")


if __name__ == "__main__":
    for source_name, output_name, has_alpha in SHEETS:
        build(source_name, output_name, has_alpha)
