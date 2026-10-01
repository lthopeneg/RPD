"""Build the reviewed stage 5 lich direction sheets for runtime use."""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art_sources" / "images"
OUTPUT_DIR = ROOT / "src" / "images"

FRAME_SIZE = 128
FRAME_COUNT = 4
CONTENT_WIDTH = 118
CONTENT_HEIGHT = 122
BASELINE_Y = 125
MIST_BLEND_START_Y = 88
MIST_BLEND_END_Y = 108
MIST_OFFSETS = (0, 1, 0, -1)
BACK_BODY_BLEND_START_Y = 50
BACK_BODY_BLEND_END_Y = 72
MIST_LAYER_START_Y = 72
MIST_LAYER_END_Y = 94

SHEETS = (
    ("boss_stage05_lich_front_source_4f.png", "boss-stage05-front"),
    ("boss_stage05_lich_back_source_4f.png", "boss-stage05-back"),
    ("boss_stage05_lich_side_source_4f.png", "boss-stage05-side"),
)


def keep_largest_component(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image.convert("RGBA")).copy()
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
    cleaned = Image.fromarray(pixels.astype(np.uint8), "RGBA")
    bbox = cleaned.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Generated lich frame contains no visible sprite")
    return cleaned.crop(bbox)


def extract_frames(path: Path) -> list[Image.Image]:
    sheet = Image.open(path).convert("RGBA")
    if sheet.width % FRAME_COUNT:
        raise ValueError(f"{path.name} width is not divisible by {FRAME_COUNT}")
    source_width = sheet.width // FRAME_COUNT
    return [
        keep_largest_component(
            sheet.crop((index * source_width, 0, (index + 1) * source_width, sheet.height))
        )
        for index in range(FRAME_COUNT)
    ]


def build_sheet(source_name: str, output_stem: str) -> None:
    sprites = extract_frames(SOURCE_DIR / source_name)
    scale = min(
        CONTENT_WIDTH / max(sprite.width for sprite in sprites),
        CONTENT_HEIGHT / max(sprite.height for sprite in sprites),
    )
    frames: list[Image.Image] = []

    for index, sprite in enumerate(sprites):
        width = max(1, round(sprite.width * scale))
        height = max(1, round(sprite.height * scale))
        resized = sprite.resize((width, height), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        frame.alpha_composite(resized, ((FRAME_SIZE - width) // 2, BASELINE_Y - height))
        frames.append(frame)

    # The generated frames vary too much at the trailing mist, which reads as
    # legs opening and closing. Keep one coherent lower silhouette and give it
    # only a subtle horizontal drift. Feather the join into the animated robe.
    stable_mist = frames[0]
    blend_mask = Image.new("L", (FRAME_SIZE, FRAME_SIZE), 0)
    mask_pixels = blend_mask.load()
    for y in range(MIST_BLEND_START_Y, FRAME_SIZE):
        if y >= MIST_BLEND_END_Y:
            opacity = 255
        else:
            opacity = round(
                255 * (y - MIST_BLEND_START_Y) / (MIST_BLEND_END_Y - MIST_BLEND_START_Y)
            )
        for x in range(FRAME_SIZE):
            mask_pixels[x, y] = opacity

    stabilized_frames: list[Image.Image] = []
    for frame, offset_x in zip(frames, MIST_OFFSETS):
        shifted_mist = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        shifted_mist.alpha_composite(stable_mist, (offset_x, 0))
        stabilized_frames.append(Image.composite(shifted_mist, frame, blend_mask))

    if "back" in source_name:
        # Generated rear frames shift the waist and pelvis from side to side.
        # Keep that center mass fixed; movement remains in the hood and upper cape.
        stable_back_body = stabilized_frames[0]
        body_mask = Image.new("L", (FRAME_SIZE, FRAME_SIZE), 0)
        body_mask_pixels = body_mask.load()
        for y in range(BACK_BODY_BLEND_START_Y, FRAME_SIZE):
            if y >= BACK_BODY_BLEND_END_Y:
                opacity = 255
            else:
                opacity = round(
                    255
                    * (y - BACK_BODY_BLEND_START_Y)
                    / (BACK_BODY_BLEND_END_Y - BACK_BODY_BLEND_START_Y)
                )
            for x in range(FRAME_SIZE):
                body_mask_pixels[x, y] = opacity
        stabilized_frames = [
            Image.composite(stable_back_body, frame, body_mask)
            for frame in stabilized_frames
        ]

    sheet = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(stabilized_frames):
        sheet.alpha_composite(frame, (index * FRAME_SIZE, 0))

    # Split the reviewed first frame into a rigid body and a complementary
    # trailing-mist layer. The mist variants are derived from the same pixels,
    # so they cannot change the character's waist or silhouette.
    base_frame = stabilized_frames[0]
    mist_mask = Image.new("L", (FRAME_SIZE, FRAME_SIZE), 0)
    mist_mask_pixels = mist_mask.load()
    for y in range(MIST_LAYER_START_Y, FRAME_SIZE):
        if y >= MIST_LAYER_END_Y:
            opacity = 255
        else:
            opacity = round(
                255 * (y - MIST_LAYER_START_Y) / (MIST_LAYER_END_Y - MIST_LAYER_START_Y)
            )
        for x in range(FRAME_SIZE):
            mist_mask_pixels[x, y] = opacity

    base_pixels = np.asarray(base_frame).copy()
    mask_array = np.asarray(mist_mask, dtype=np.uint16)
    original_alpha = base_pixels[:, :, 3].astype(np.uint16)

    body_pixels = base_pixels.copy()
    body_pixels[:, :, 3] = (original_alpha * (255 - mask_array) // 255).astype(np.uint8)
    body = Image.fromarray(body_pixels.astype(np.uint8), "RGBA")

    mist_pixels = base_pixels.copy()
    mist_pixels[:, :, 3] = (original_alpha * mask_array // 255).astype(np.uint8)
    mist = Image.fromarray(mist_pixels.astype(np.uint8), "RGBA")

    body.save(OUTPUT_DIR / f"{output_stem}-body.png", optimize=True)

    mist_sheet = Image.new(
        "RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0)
    )
    phases = (0.0, 2.0, 0.0, -2.0)
    for frame_index, phase in enumerate(phases):
        warped = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
        for y in range(MIST_LAYER_START_Y, FRAME_SIZE):
            depth = (y - MIST_LAYER_START_Y) / (FRAME_SIZE - MIST_LAYER_START_Y)
            offset_x = round(phase * depth * 2)
            row = mist.crop((0, y, FRAME_SIZE, y + 1))
            warped.alpha_composite(row, (offset_x, y))
        mist_sheet.alpha_composite(warped, (frame_index * FRAME_SIZE, 0))
    mist_sheet.save(OUTPUT_DIR / f"{output_stem}-mist.png", optimize=True)
    print(f"built {output_stem}-body.png and {output_stem}-mist.png")


def main() -> None:
    for source_name, output_stem in SHEETS:
        build_sheet(source_name, output_stem)


if __name__ == "__main__":
    main()
