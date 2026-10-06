from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art_sources"
OUTPUT = ROOT / "src" / "images"
CELL = 128
TARGET_HEIGHT = 116


def build_styled_sheet(path: Path) -> Image.Image:
    source = Image.open(path).convert("RGBA")
    sheet = Image.new("RGBA", (CELL * 6, CELL * 3))
    # The generated side poses drift slightly along the x axis. These small
    # offsets lock the helmet/torso in place without changing the leg motion.
    # Measured from the helmet silhouette: the early poses were 3-6 px farther
    # forward than the middle poses, which made the head visibly lunge.
    side_x_offsets = (-6, -4, -3, 0, 0, 1)

    for row in range(3):
        for column in range(6):
            bounds = (
                round(column * source.width / 6),
                round(row * source.height / 3),
                round((column + 1) * source.width / 6),
                round((row + 1) * source.height / 3),
            )
            frame = source.crop(bounds)
            if row == 1:
                # Front-row boots crossed the generated row boundary and
                # appeared as isolated black crescents above the rear helmet.
                frame.paste((0, 0, 0, 0), (0, 0, frame.width, 14))
            frame = frame.resize((CELL, CELL), Image.Resampling.LANCZOS)
            x_offset = side_x_offsets[column] if row == 2 else 0
            sheet.alpha_composite(frame, (column * CELL + x_offset, row * CELL))
    return sheet


def extract_frames(path: Path, count: int) -> list[Image.Image]:
    sheet = Image.open(path).convert("RGBA")
    source_width = sheet.width // count
    frames: list[Image.Image] = []
    for index in range(count):
        frame = sheet.crop((index * source_width, 0, (index + 1) * source_width, sheet.height))
        alpha = frame.getchannel("A")
        bbox = alpha.point(lambda value: 255 if value >= 8 else 0).getbbox()
        if bbox is None:
            frames.append(Image.new("RGBA", (CELL, CELL)))
            continue
        figure = frame.crop(bbox)
        scale = min(TARGET_HEIGHT / figure.height, 120 / figure.width)
        size = (max(1, round(figure.width * scale)), max(1, round(figure.height * scale)))
        figure = figure.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CELL, CELL))
        canvas.alpha_composite(figure, ((CELL - figure.width) // 2, CELL - figure.height - 3))
        frames.append(canvas)
    return frames


def main() -> None:
    styled_source = SOURCE / "boss_stage20_game_style_6x3.png"
    if styled_source.exists():
        sheet = build_styled_sheet(styled_source)
    else:
        front = extract_frames(SOURCE / "boss_stage20_front_walk_6frame_draft.png", 6)
        back = extract_frames(SOURCE / "boss_stage20_back_walk_6frame_draft.png", 6)
        side = extract_frames(SOURCE / "boss_stage20_side_walk_5frame_draft.png", 5)
        side.append(side[-1].copy())

        sheet = Image.new("RGBA", (CELL * 6, CELL * 3))
        for row, frames in enumerate((front, back, side)):
            for column, frame in enumerate(frames):
                sheet.alpha_composite(frame, (column * CELL, row * CELL))
    sheet.save(OUTPUT / "boss-stage20-sprite.png", optimize=True)

    portrait = Image.open(SOURCE / "boss_stage20_fortress_knight_portrait_source.png").convert("RGBA")
    portrait.thumbnail((512, 512), Image.Resampling.LANCZOS)
    portrait.save(OUTPUT / "boss-stage20-fortress-knight-portrait.png", optimize=True)


if __name__ == "__main__":
    main()
