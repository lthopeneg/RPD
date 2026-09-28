"""Normalize generated 4x4 boss sheets into CSS friendly 128px cells."""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "src" / "images"
SOURCE_DIR = ROOT / "art_sources" / "images"
SHEETS = {
    "boss_stage25_land.png": ("boss-stage25-sprite.png", False, 4, 4),
    "boss_stage30_flying.png": ("boss-stage30-sprite.png", True, 4, 4),
    "boss_stage33_human.png": ("boss-stage33-sprite.png", False, 4, 4),
    "boss_stage34_land.png": ("boss-stage34-sprite.png", False, 4, 4),
    "boss_stage35_flying.png": ("boss-stage35-sprite.png", True, 4, 4),
    # The final boss sources are pose sheets, rather than the regular 4x4 walk format.
    "final_boss_phase1_human.png": ("final-boss-phase1-sprite.png", False, 4, 3),
    "final_boss_phase2_land.png": ("final-boss-phase2-sprite.png", False, 3, 3),
    "final_boss_phase3_flying.png": ("final-boss-phase3-sprite.png", True, 3, 3),
}


def find_cuts(alpha: np.ndarray) -> list[int]:
    projection = (alpha > 32).sum(axis=0)
    cuts = [0]
    for nominal in (384, 768, 1152):
        left, right = nominal - 70, nominal + 71
        smoothed = np.convolve(projection, np.ones(7), mode="same")
        cuts.append(left + int(np.argmin(smoothed[left:right])))
    return cuts + [alpha.shape[1]]


def largest_component_bbox(mask: np.ndarray) -> tuple[int, int, int, int] | None:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    best: list[tuple[int, int]] = []
    for y, x in zip(*np.where(mask & ~seen)):
        if seen[y, x]:
            continue
        queue = deque([(int(y), int(x))])
        seen[y, x] = True
        component: list[tuple[int, int]] = []
        while queue:
            cy, cx = queue.popleft()
            component.append((cy, cx))
            for ny in range(max(0, cy - 1), min(height, cy + 2)):
                for nx in range(max(0, cx - 1), min(width, cx + 2)):
                    if mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
        if len(component) > len(best):
            best = component
    if not best:
        return None
    ys, xs = zip(*best)
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def normalize(
    source_name: str,
    output_name: str,
    flying: bool,
    source_columns: int,
    source_rows: int,
) -> None:
    source = Image.open(SOURCE_DIR / source_name).convert("RGBA")
    alpha = np.asarray(source.getchannel("A"))
    output = Image.new("RGBA", (512, 512))
    for row in range(4):
        source_row = min(row, source_rows - 1)
        y0 = round(source_row * source.height / source_rows)
        y1 = round((source_row + 1) * source.height / source_rows)
        cuts = (
            find_cuts(alpha[y0:y1])
            if source_columns == 4
            else [round(column * source.width / source_columns) for column in range(source_columns + 1)]
        )
        for column in range(4):
            source_column = column if source_columns == 4 else (0, 1, 2, 1)[column]
            x0, x1 = cuts[source_column], cuts[source_column + 1]
            cell = source.crop((x0, y0, x1, y1))
            cell_alpha = np.asarray(cell.getchannel("A"))
            bbox = largest_component_bbox(cell_alpha > 32)
            if bbox is None:
                continue
            sprite = cell.crop(bbox)
            max_width, max_height = 118, 118
            scale = min(max_width / sprite.width, max_height / sprite.height)
            size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
            sprite = sprite.resize(size, Image.Resampling.LANCZOS)
            px = column * 128 + (128 - sprite.width) // 2
            py = row * 128 + ((128 - sprite.height) // 2 if flying else 123 - sprite.height)
            output.alpha_composite(sprite, (px, py))
    output.save(IMAGE_DIR / output_name, optimize=True)


if __name__ == "__main__":
    for source_name, (output_name, flying, columns, rows) in SHEETS.items():
        normalize(source_name, output_name, flying, columns, rows)
        print(f"created {output_name}")
