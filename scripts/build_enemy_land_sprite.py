"""Build the land enemy sheet from newly generated directional strips."""

from pathlib import Path

from PIL import Image

from build_stage05_walk_sprite import alpha_bbox, keep_largest_alpha_component


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art_sources" / "images"
OUTPUT = ROOT / "src" / "images" / "enemy-land-sprite.png"
SOURCES = (
    "enemy_land_down_new.png",
    "enemy_land_up_new.png",
    "enemy_land_left_new.png",
)
FRAME_COUNT = 4
FRAME_SIZE = 128


def main() -> None:
    rows: list[list[Image.Image]] = []
    sprites: list[Image.Image] = []

    for source_name in SOURCES:
        source = Image.open(SOURCE_DIR / source_name).convert("RGBA")
        row: list[Image.Image] = []
        for column in range(FRAME_COUNT):
            x0 = round(column * source.width / FRAME_COUNT)
            x1 = round((column + 1) * source.width / FRAME_COUNT)
            frame = keep_largest_alpha_component(source.crop((x0, 0, x1, source.height)))
            sprite = frame.crop(alpha_bbox(frame))
            row.append(sprite)
            sprites.append(sprite)
        rows.append(row)

    scale = min(
        118 / max(sprite.width for sprite in sprites),
        118 / max(sprite.height for sprite in sprites),
    )
    output = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE * len(rows)))
    for row_index, row in enumerate(rows):
        for column, sprite in enumerate(row):
            size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
            sprite = sprite.resize(size, Image.Resampling.LANCZOS)
            x = column * FRAME_SIZE + (FRAME_SIZE - sprite.width) // 2
            y = row_index * FRAME_SIZE + 123 - sprite.height
            output.alpha_composite(sprite, (x, y))

    output.save(OUTPUT, optimize=True)
    print(f"created {OUTPUT.name}: {output.size}")


if __name__ == "__main__":
    main()
