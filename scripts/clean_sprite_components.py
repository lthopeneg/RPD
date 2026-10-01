"""Remove detached neighboring-frame debris from an existing sprite sheet."""

import argparse
from pathlib import Path

from PIL import Image

from sprite_utils import keep_largest_alpha_component


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("--columns", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    args = parser.parse_args()

    source = Image.open(args.path).convert("RGBA")
    if source.width % args.columns or source.height % args.rows:
        raise ValueError("Sheet dimensions must be divisible by the grid size")

    frame_width = source.width // args.columns
    frame_height = source.height // args.rows
    cleaned = Image.new("RGBA", source.size)

    for row in range(args.rows):
        for column in range(args.columns):
            box = (
                column * frame_width,
                row * frame_height,
                (column + 1) * frame_width,
                (row + 1) * frame_height,
            )
            frame = keep_largest_alpha_component(source.crop(box))
            cleaned.alpha_composite(frame, (box[0], box[1]))

    cleaned.save(args.path, optimize=True)
    print(f"cleaned {args.path}: {args.columns}x{args.rows} frames")


if __name__ == "__main__":
    main()
