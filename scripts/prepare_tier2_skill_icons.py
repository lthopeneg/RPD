from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "src" / "images"
SOURCE = Image.open(IMAGES / "tier2-single-skill-icons-source.png").convert("RGBA")

# 얼음술사, 번개술사, 저격수는 사용자가 승인한 기존 단일 아이콘을 유지한다.
NEW_ICON_ORDER = (
    "swordsman",
    "dual_swordsman",
    "magic_swordsman",
    "fire_mage",
    "rifleman",
    "shotgunner",
)


def fit_icon(image: Image.Image) -> Image.Image:
    # 생성 이미지의 거의 보이지 않는 알파 노이즈를 제외하고 실제 본체만 꽉 차게 자른다.
    visible_alpha = image.getchannel("A").point(lambda alpha: 255 if alpha >= 28 else 0)
    bbox = visible_alpha.getbbox()
    if bbox:
        image = image.crop(bbox)
    image.thumbnail((56, 56), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    out.alpha_composite(image, ((64 - image.width) // 2, (64 - image.height) // 2))
    return out


cell_width = SOURCE.width / len(NEW_ICON_ORDER)
for column, unit_id in enumerate(NEW_ICON_ORDER):
    left = round(column * cell_width)
    right = round((column + 1) * cell_width)
    cell = SOURCE.crop((left, 0, right, SOURCE.height))
    fit_icon(cell).save(IMAGES / f"tier2-skill-icon-{unit_id}.png")

# 승인된 얼음·번개 아이콘은 기존 4프레임 시트의 3열을 그대로 복원한다.
for unit_id, sheet_name in (
    ("ice_mage", "frozen-orb-skill-sheet.png"),
    ("lightning_mage", "chain-lightning-skill-sheet.png"),
):
    sheet = Image.open(IMAGES / sheet_name).convert("RGBA")
    frame = sheet.crop((512, 0, 768, 256))
    fit_icon(frame).save(IMAGES / f"tier2-skill-icon-{unit_id}.png")

print("prepared six new single-image icons; restored ice/lightning; kept sniper")
