"""Shared alpha-channel helpers for sprite build scripts."""

from collections import deque

import numpy as np
from PIL import Image


def alpha_bbox(image: Image.Image, threshold: int = 16) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.convert("RGBA"))[:, :, 3]
    ys, xs = np.where(alpha > threshold)
    if len(xs) == 0:
        raise ValueError("Sprite contains no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def keep_largest_alpha_component(
    image: Image.Image,
    threshold: int = 16,
) -> Image.Image:
    pixels = np.asarray(image.convert("RGBA")).copy()
    mask = pixels[:, :, 3] > threshold
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
    return Image.fromarray(pixels.astype(np.uint8), "RGBA")
