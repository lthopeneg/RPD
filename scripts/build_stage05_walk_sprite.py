"""Build the stage 5 boss 6-frame directional walk sheet."""

from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art_sources" / "images"
OUTPUT = ROOT / "src" / "images" / "boss-stage05-walk.png"
SOURCES = (
    "boss_stage05_down.png",
    "boss_stage05_up.png",
    "boss_stage05_left.png",
)
FRAME_SIZE = 128
FRAME_COUNT = 6


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A").point(lambda value: 255 if value > 32 else 0)
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Empty frame found in stage 5 boss source")
    return bbox


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    """Remove detached generation debris without trimming the connected sprite."""
    pixels = np.asarray(image).copy()
    mask = pixels[:, :, 3] > 16
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    largest: list[tuple[int, int]] = []

    for start_y, start_x in zip(*np.where(mask & ~seen)):
        if seen[start_y, start_x]:
            continue
        queue = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    if mask[next_y, next_x] and not seen[next_y, next_x]:
                        seen[next_y, next_x] = True
                        queue.append((next_y, next_x))
        if len(component) > len(largest):
            largest = component

    keep = np.zeros_like(mask)
    if largest:
        ys, xs = zip(*largest)
        keep[ys, xs] = True
    pixels[~keep] = 0
    return Image.fromarray(pixels, "RGBA")


def main() -> None:
    rows: list[list[Image.Image]] = []
    sprites: list[Image.Image] = []

    for source_name in SOURCES:
        source = Image.open(SOURCE_DIR / source_name).convert("RGBA")
        if source.width % FRAME_COUNT != 0:
            raise ValueError(f"{source_name} width is not divisible by {FRAME_COUNT}")
        source_frame_width = source.width // FRAME_COUNT
        row: list[Image.Image] = []
        for index in range(FRAME_COUNT):
            frame = source.crop((
                index * source_frame_width,
                0,
                (index + 1) * source_frame_width,
                source.height,
            ))
            cleaned_frame = keep_largest_alpha_component(frame)
            sprite = cleaned_frame.crop(alpha_bbox(cleaned_frame))
            row.append(sprite)
            sprites.append(sprite)
        rows.append(row)

    # One scale for every direction prevents visible breathing or size changes.
    scale = min(
        118 / max(sprite.width for sprite in sprites),
        118 / max(sprite.height for sprite in sprites),
    )
    sheet = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE * len(rows)))

    for row_index, row in enumerate(rows):
        for frame_index, sprite in enumerate(row):
            size = (
                max(1, round(sprite.width * scale)),
                max(1, round(sprite.height * scale)),
            )
            resized = sprite.resize(size, Image.Resampling.LANCZOS)
            x = frame_index * FRAME_SIZE + (FRAME_SIZE - resized.width) // 2
            y = row_index * FRAME_SIZE + 123 - resized.height
            sheet.alpha_composite(resized, (x, y))

    sheet.save(OUTPUT, optimize=True)
    print(f"created {OUTPUT.name}: {sheet.width}x{sheet.height}")


if __name__ == "__main__":
    main()
