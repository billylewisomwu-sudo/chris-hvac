"""Glacier Air app icon - ice-blue snowflake on deep navy."""
import math
from PIL import Image, ImageDraw

BG = (6, 11, 24)
NAVY = (3, 4, 94)
ICE = (56, 189, 248)
ICE_LT = (125, 211, 252)


def branch(d, c, angle, length, width):
    ax, ay = math.cos(angle), math.sin(angle)
    x2, y2 = c + ax * length, c + ay * length
    d.line([(c, c), (x2, y2)], fill=ICE, width=width)
    for frac, twig in ((0.55, 0.22), (0.78, 0.16)):
        bx, by = c + ax * length * frac, c + ay * length * frac
        for sign in (-1, 1):
            ta = angle + sign * math.radians(55)
            d.line([(bx, by),
                    (bx + math.cos(ta) * length * twig,
                     by + math.sin(ta) * length * twig)],
                   fill=ICE_LT, width=max(2, width - 2))


def draw_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = size * (0.12 if maskable else 0.06)
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=size * 0.2, fill=BG)
    c = size / 2
    r = (size / 2 - pad) * 0.82
    d.ellipse([c - r, c - r, c + r, c + r], fill=NAVY)
    length = r * 0.82
    width = max(4, size // 42)
    for k in range(6):
        branch(d, c, math.radians(60 * k - 90), length, width)
    hub = r * 0.1
    d.ellipse([c - hub, c - hub, c + hub, c + hub], fill=ICE_LT)
    return img


draw_icon(192).save("public/icons/icon-192.png")
draw_icon(512).save("public/icons/icon-512.png")
draw_icon(512, maskable=True).save("public/icons/maskable-512.png")
draw_icon(64).save("public/icons/favicon.png")
print("glacier icons written")
