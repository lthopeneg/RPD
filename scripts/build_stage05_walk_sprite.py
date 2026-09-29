"""Build the stage 5 boss 6-frame directional walk sheet."""

from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art_sources" / "images"
OUTPUT = ROOT / "src" / "images" / "boss-stage05-walk.png"
ROWS = (
    (
        "poses",
        (
            "boss_stage05_down_right_max.png",
            "boss_stage05_down_right_mid.png",
            "boss_stage05_down_left_mid.png",
            "boss_stage05_down_left_max.png",
            "boss_stage05_down_left_mid.png",
            "boss_stage05_down_right_mid.png",
        ),
    ),
    (
        "poses",
        (
            "boss_stage05_up_right_max.png",
            "boss_stage05_up_right_mid.png",
            "boss_stage05_up_left_mid.png",
            "boss_stage05_up_left_max.png",
            "boss_stage05_up_left_mid.png",
            "boss_stage05_up_right_mid.png",
        ),
    ),
    (
        "poses",
        (
            "boss_stage05_left_right_max.png",
            "boss_stage05_left_right_mid.png",
            "boss_stage05_left_left_mid.png",
            "boss_stage05_left_left_max.png",
            "boss_stage05_left_left_mid.png",
            "boss_stage05_left_right_mid.png",
        ),
    ),
)
FRAME_SIZE = 128
FRAME_COUNT = 6
ROW_TARGET_SIZES = ((112, 118), (112, 118), (118, 108))


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


def extract_sprite(image: Image.Image) -> Image.Image:
    cleaned = keep_largest_alpha_component(image.convert("RGBA"))
    return cleaned.crop(alpha_bbox(cleaned))


def load_pose_row(source_names: tuple[str, ...]) -> list[Image.Image]:
    return [extract_sprite(Image.open(SOURCE_DIR / source_name)) for source_name in source_names]


def load_strip_row(source_name: str) -> list[Image.Image]:
    source = Image.open(SOURCE_DIR / source_name).convert("RGBA")
    if source.width % FRAME_COUNT != 0:
        raise ValueError(f"{source_name} width is not divisible by {FRAME_COUNT}")
    source_frame_width = source.width // FRAME_COUNT
    return [
        extract_sprite(source.crop((
            index * source_frame_width,
            0,
            (index + 1) * source_frame_width,
            source.height,
        )))
        for index in range(FRAME_COUNT)
    ]


def normalize_pose(sprite: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    """Normalize independently generated poses to one fixed silhouette box."""
    normalized = sprite.resize(target_size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE))
    x = (FRAME_SIZE - normalized.width) // 2
    y = 123 - normalized.height
    frame.alpha_composite(normalized, (x, y))
    return frame


def lock_upper_body(row: list[Image.Image]) -> list[Image.Image]:
    """Keep one torso/equipment rendering while retaining each pose's legs."""
    base = row[0]
    mask = Image.new("L", (FRAME_SIZE, FRAME_SIZE))
    pixels = mask.load()
    fade_start, fade_end = 68, 86
    for y in range(FRAME_SIZE):
        value = 255 if y <= fade_start else 0 if y >= fade_end else round(
            255 * (fade_end - y) / (fade_end - fade_start)
        )
        for x in range(FRAME_SIZE):
            pixels[x, y] = value
    return [Image.composite(base, pose, mask) for pose in row]


def emphasize_side_leg_swap(row: list[Image.Image]) -> list[Image.Image]:
    """Use depth shading to show the far leg leading during the second half."""
    adjusted: list[Image.Image] = []
    for frame_index, frame in enumerate(row):
        if frame_index not in (2, 3, 4):
            adjusted.append(frame)
            continue
        pixels = np.asarray(frame).copy()
        for y in range(82, FRAME_SIZE):
            for x in range(FRAME_SIZE):
                if pixels[y, x, 3] == 0:
                    continue
                factor = 0.72 if x < FRAME_SIZE // 2 else 1.12
                pixels[y, x, :3] = np.clip(pixels[y, x, :3] * factor, 0, 255)
        adjusted.append(Image.fromarray(pixels.astype(np.uint8), "RGBA"))
    return adjusted


def main() -> None:
    rows: list[list[Image.Image]] = []
    for source_type, source_value in ROWS:
        row = (
            load_pose_row(source_value)
            if source_type == "poses"
            else load_strip_row(source_value)
        )
        rows.append(row)

    normalized_rows: list[list[Image.Image]] = []
    for row_index, row in enumerate(rows):
        normalized = [normalize_pose(sprite, ROW_TARGET_SIZES[row_index]) for sprite in row]
        locked = lock_upper_body(normalized)
        normalized_rows.append(emphasize_side_leg_swap(locked) if row_index == 2 else locked)

    sheet = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE * len(rows)))

    for row_index, row in enumerate(normalized_rows):
        for frame_index, frame in enumerate(row):
            sheet.alpha_composite(frame, (frame_index * FRAME_SIZE, row_index * FRAME_SIZE))

    sheet.save(OUTPUT, optimize=True)
    print(f"created {OUTPUT.name}: {sheet.width}x{sheet.height}")


if __name__ == "__main__":
    main()
