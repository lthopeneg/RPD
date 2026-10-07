from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "images" / "tier2-skill-vfx-atlas-source.png"
OUT = ROOT / "src" / "images"
NAMES = [
    "combo-skill-sheet.png",
    "frozen-orb-skill-sheet.png",
    "chain-lightning-skill-sheet.png",
    "adrenaline-skill-sheet.png",
    "barrage-skill-sheet.png",
    "bleed-skill-sheet.png",
    "magic-mark-skill-sheet.png",
]
HUE_RANGES = [
    ((112, 190),),
    ((112, 190),),
    ((4, 55),),
    ((48, 116),),
    ((0, 30), (242, 255)),
    ((0, 20), (238, 255)),
    ((180, 238),),
]
ICON_NAMES = [
    "skill-combo.png",
    "skill-frozen-orb.png",
    "skill-chain-lightning.png",
    "skill-adrenaline.png",
    "skill-barrage.png",
]

atlas = Image.open(SOURCE).convert("RGBA")
row_edges = [round(index * atlas.height / 7) for index in range(8)]

for row, name in enumerate(NAMES):
    frames = []
    for column in range(4):
        left = round(column * atlas.width / 4)
        right = round((column + 1) * atlas.width / 4)
        crop = atlas.crop((left, row_edges[row], right, row_edges[row + 1]))
        hsv = crop.convert("HSV")
        source_pixels = crop.load()
        hsv_pixels = hsv.load()
        for y in range(crop.height):
            for x in range(crop.width):
                hue, saturation, value = hsv_pixels[x, y]
                allowed_hue = any(low <= hue <= high for low, high in HUE_RANGES[row])
                near_white = saturation < 58 and value > 145
                if not allowed_hue and not near_white:
                    red, green, blue, alpha = source_pixels[x, y]
                    source_pixels[x, y] = (red, green, blue, 0)
        frame = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        if crop.height > 256:
            crop.thumbnail((256, 256), Image.Resampling.LANCZOS)
        frame.alpha_composite(crop, ((256 - crop.width) // 2, (256 - crop.height) // 2))
        frames.append(frame)
    sheet = Image.new("RGBA", (1024, 256), (0, 0, 0, 0))
    for column, frame in enumerate(frames):
        sheet.alpha_composite(frame, (column * 256, 0))
    sheet.save(OUT / name)
    if row < len(ICON_NAMES):
        icon = frames[2].resize((64, 64), Image.Resampling.LANCZOS)
        icon.save(OUT / ICON_NAMES[row])

print("prepared generated tier-2 VFX sheets")
