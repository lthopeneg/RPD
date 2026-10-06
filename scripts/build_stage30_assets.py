from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art_sources"
OUTPUT = ROOT / "src" / "images"
CELL = 128
SOURCE_CELL = 362


def split_sheet(path: Path) -> list[list[Image.Image]]:
    sheet = Image.open(path).convert("RGBA")
    if sheet.size != (SOURCE_CELL * 4, SOURCE_CELL * 3):
        raise ValueError(f"unexpected stage 30 sheet size: {sheet.size}")
    return [
        [
            sheet.crop((column * SOURCE_CELL, row * SOURCE_CELL,
                        (column + 1) * SOURCE_CELL, (row + 1) * SOURCE_CELL))
            for column in range(4)
        ]
        for row in range(3)
    ]


def remove_boundary_bleed(frame: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A")
    visible = {
        (x, y)
        for y in range(frame.height)
        for x in range(frame.width)
        if alpha.getpixel((x, y)) >= 10
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
    main = max(components, key=len)
    cleaned = frame.copy()
    for component in components:
        touches_boundary = any(
            x == 0 or y == 0 or x == frame.width - 1 or y == frame.height - 1
            for x, y in component
        )
        if component is not main and touches_boundary:
            for x, y in component:
                cleaned.putpixel((x, y), (0, 0, 0, 0))
    return cleaned


def normalize_row(frames: list[Image.Image]) -> list[Image.Image]:
    cleaned = [remove_boundary_bleed(frame) for frame in frames]
    boxes = [frame.getchannel("A").point(lambda value: 255 if value >= 8 else 0).getbbox()
             for frame in cleaned]
    valid = [box for box in boxes if box is not None]
    union = (
        min(box[0] for box in valid),
        min(box[1] for box in valid),
        max(box[2] for box in valid),
        max(box[3] for box in valid),
    )
    normalized: list[Image.Image] = []
    for frame in cleaned:
        figure = frame.crop(union)
        scale = min(122 / figure.width, 122 / figure.height)
        size = (round(figure.width * scale), round(figure.height * scale))
        figure = figure.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CELL, CELL))
        canvas.alpha_composite(figure, ((CELL - figure.width) // 2, (CELL - figure.height) // 2))
        normalized.append(canvas)
    return normalized


def separate_body_and_orbit(frame: Image.Image) -> tuple[Image.Image, Image.Image]:
    alpha = frame.getchannel("A")
    visible = {
        (x, y)
        for y in range(frame.height)
        for x in range(frame.width)
        if alpha.getpixel((x, y)) >= 32
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

    main = max(components, key=len)
    orbit_components = [component for component in components if component is not main and len(component) >= 15]
    main_mask = Image.new("L", frame.size)
    orbit_mask = Image.new("L", frame.size)
    for x, y in main:
        main_mask.putpixel((x, y), 255)
    for component in orbit_components:
        for x, y in component:
            orbit_mask.putpixel((x, y), 255)
    main_mask = main_mask.filter(ImageFilter.MaxFilter(5))
    orbit_mask = orbit_mask.filter(ImageFilter.MaxFilter(5))
    body = Image.new("RGBA", frame.size)
    orbit = Image.new("RGBA", frame.size)
    body.paste(frame, mask=main_mask)
    orbit.paste(frame, mask=orbit_mask)
    return body, orbit


def main() -> None:
    rows = [normalize_row(row) for row in split_sheet(
        SOURCE / "boss_stage30_astrayon_move_4x3_draft.png",
    )]
    # Front uses the approved fourth pose. Back and side retain their stable
    # first poses. Detached stones are exported as independent orbit layers.
    approved = [rows[0][3], rows[1][0], rows[2][0]]
    layers = [separate_body_and_orbit(frame) for frame in approved]
    # Front/back keep their original detached stones as fixed silhouette details.
    # The side view stays with the separated rigid body because it already reads well.
    body_rows = [
        [approved[0].copy() for _ in range(4)],
        [approved[1].copy() for _ in range(4)],
        [layers[2][0].copy() for _ in range(4)],
    ]
    sheet = Image.new("RGBA", (CELL * 4, CELL * 3))
    for row, frames in enumerate(body_rows):
        for column, frame in enumerate(frames):
            sheet.alpha_composite(frame, (column * CELL, row * CELL))
    sheet.save(OUTPUT / "boss-stage30-sprite.png", optimize=True)

    direction_names = ("down", "up", "side")
    for direction, (_, orbit) in zip(direction_names, layers):
        orbit.save(OUTPUT / f"boss-stage30-orbit-{direction}.png", optimize=True)

    portrait = Image.open(
        SOURCE / "boss_stage30_astrayon_portrait_draft.png",
    ).convert("RGBA")
    portrait.thumbnail((512, 512), Image.Resampling.LANCZOS)
    portrait.save(OUTPUT / "boss-stage30-astrayon-portrait.png", optimize=True)


if __name__ == "__main__":
    main()
