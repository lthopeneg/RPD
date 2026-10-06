from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art_sources"
OUTPUT = ROOT / "src" / "images"
CELL = 128


def split_frames(path: Path, count: int) -> list[Image.Image]:
    sheet = Image.open(path).convert("RGBA")
    bounds = [round(index * sheet.width / count) for index in range(count + 1)]
    return [
        sheet.crop((bounds[index], 0, bounds[index + 1], sheet.height))
        for index in range(count)
    ]


def remove_detached_edge_fragments(frame: Image.Image) -> Image.Image:
    """Remove only small disconnected pieces clipped in from adjacent frames."""
    alpha = frame.getchannel("A")
    visible = {
        (x, y)
        for y in range(frame.height)
        for x in range(frame.width)
        if alpha.getpixel((x, y)) >= 8
    }
    components: list[set[tuple[int, int]]] = []
    while visible:
        seed = visible.pop()
        component = {seed}
        pending = [seed]
        while pending:
            x, y = pending.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    neighbor = (x + dx, y + dy)
                    if neighbor in visible:
                        visible.remove(neighbor)
                        component.add(neighbor)
                        pending.append(neighbor)
        components.append(component)

    if not components:
        return frame
    main_component = max(components, key=len)
    cleaned = frame.copy()
    for component in components:
        touches_side = any(x == 0 or x == frame.width - 1 for x, _ in component)
        if component is not main_component and touches_side:
            for x, y in component:
                cleaned.putpixel((x, y), (0, 0, 0, 0))
    return cleaned


def clear_side_sheet_overlap(frames: list[Image.Image]) -> list[Image.Image]:
    # The second approved side pose contains a narrow tail of frame 1 at x=0.
    # It is connected by a one-pixel antialiasing line, so component cleanup alone
    # cannot distinguish it from the actual pose.
    cleaned = [frame.copy() for frame in frames]
    if len(cleaned) > 1:
        for x in range(min(16, cleaned[1].width)):
            for y in range(cleaned[1].height):
                cleaned[1].putpixel((x, y), (0, 0, 0, 0))
    return cleaned


def normalize_row(frames: list[Image.Image]) -> list[Image.Image]:
    frames = [remove_detached_edge_fragments(frame) for frame in frames]
    boxes = []
    for frame in frames:
        alpha = frame.getchannel("A").point(lambda value: 255 if value >= 8 else 0)
        boxes.append(alpha.getbbox())
    valid = [box for box in boxes if box is not None]
    left = min(box[0] for box in valid)
    top = min(box[1] for box in valid)
    right = max(box[2] for box in valid)
    bottom = max(box[3] for box in valid)

    normalized = []
    for frame in frames:
        figure = frame.crop((left, top, right, bottom))
        scale = min(122 / figure.width, 122 / figure.height)
        size = (round(figure.width * scale), round(figure.height * scale))
        figure = figure.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CELL, CELL))
        canvas.alpha_composite(figure, ((CELL - figure.width) // 2, CELL - figure.height - 3))
        normalized.append(canvas)
    return normalized


def main() -> None:
    front = normalize_row(split_frames(
        SOURCE / "boss_stage25_morgaron_forest_front_walk_5frame.png", 5,
    ))
    back = normalize_row(split_frames(
        SOURCE / "boss_stage25_morgaron_forest_back_walk_5frame.png", 5,
    ))
    side = normalize_row(clear_side_sheet_overlap(split_frames(
        SOURCE / "boss_stage25_morgaron_forest_side_walk_4frame.png", 4,
    )))
    side.append(side[-1].copy())

    sheet = Image.new("RGBA", (CELL * 5, CELL * 3))
    for row, frames in enumerate((front, back, side)):
        for column, frame in enumerate(frames):
            sheet.alpha_composite(frame, (column * CELL, row * CELL))
    sheet.save(OUTPUT / "boss-stage25-sprite.png", optimize=True)

    portrait = Image.open(
        SOURCE / "boss_stage25_morgaron_forest_portrait_v2.png",
    ).convert("RGBA")
    portrait.thumbnail((512, 512), Image.Resampling.LANCZOS)
    portrait.save(OUTPUT / "boss-stage25-morgaron-portrait.png", optimize=True)


if __name__ == "__main__":
    main()
