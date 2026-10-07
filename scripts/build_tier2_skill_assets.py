from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "src" / "images"

def canvas(size=64):
    return Image.new("RGBA", (size, size), (0, 0, 0, 0))

def glow(base, radius=5):
    alpha = base.getchannel("A").filter(ImageFilter.GaussianBlur(radius))
    layer = Image.new("RGBA", base.size, (255, 255, 255, 0))
    layer.putalpha(alpha)
    return Image.alpha_composite(layer, base)

def save_icon(name, color, painter):
    im = canvas(48); d = ImageDraw.Draw(im)
    d.ellipse((4, 4, 43, 43), fill=(9, 13, 24, 235), outline=color, width=3)
    painter(d, color)
    glow(im, 3).save(OUT / name)

save_icon("skill-combo.png", (96, 165, 250, 255), lambda d,c: [d.arc((9,8,36,35),205,350,fill=c,width=4), d.arc((14,14,41,41),25,170,fill=(235,245,255,255),width=3)])
save_icon("skill-frozen-orb.png", (56, 189, 248, 255), lambda d,c: [d.ellipse((14,14,34,34),fill=(210,248,255,255),outline=c,width=3), d.line((24,8,24,40),fill=c,width=2), d.line((8,24,40,24),fill=c,width=2)])
save_icon("skill-chain-lightning.png", (250, 204, 21, 255), lambda d,c: d.line((30,7,15,25,27,25,16,41,36,20,25,20,30,7),fill=c,width=4,joint="curve"))
save_icon("skill-adrenaline.png", (74, 222, 128, 255), lambda d,c: d.line((7,27,16,27,20,14,27,37,32,22,41,22),fill=c,width=3))
save_icon("skill-barrage.png", (251, 146, 60, 255), lambda d,c: [d.ellipse((19,19,29,29),fill=(255,245,210,255)), *[d.line((24,24,x,y),fill=c,width=3) for x,y in [(5,9),(24,3),(43,9),(45,28),(37,43),(11,43),(3,28)]]])

orb = canvas(64); d=ImageDraw.Draw(orb)
d.ellipse((13,13,51,51), fill=(80,190,255,80), outline=(205,250,255,255), width=3)
for a,b in [((32,7),(32,57)),((7,32),(57,32)),((14,14),(50,50)),((50,14),(14,50))]: d.line((a,b),fill=(90,210,255,220),width=2)
d.ellipse((24,24,40,40),fill=(235,255,255,245))
glow(orb,6).save(OUT / "frozen-orb-effect.png")

bleed=canvas(48); d=ImageDraw.Draw(bleed)
d.polygon([(24,4),(36,23),(33,37),(24,44),(15,37),(12,23)],fill=(185,20,45,235),outline=(255,100,115,255))
glow(bleed,3).save(OUT / "bleed-effect.png")

mark=canvas(48); d=ImageDraw.Draw(mark)
d.ellipse((8,8,40,40),outline=(190,110,255,255),width=3); d.polygon([(24,5),(29,19),(43,24),(29,29),(24,43),(19,29),(5,24),(19,19)],outline=(240,210,255,255),width=2)
glow(mark,4).save(OUT / "magic-mark-effect.png")

chain=canvas(64); d=ImageDraw.Draw(chain)
d.line((4,42,17,18,26,31,39,8,46,27,60,14),fill=(255,246,130,255),width=3,joint="curve")
d.line((5,45,18,21,27,34,40,11,47,30,61,17),fill=(255,190,25,170),width=6,joint="curve")
glow(chain,5).save(OUT / "chain-lightning-effect.png")

print("built tier-2 skill assets")
