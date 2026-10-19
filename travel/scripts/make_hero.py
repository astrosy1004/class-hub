"""K-뷰티 패스포트 대표 이미지 생성

- assets/hero.png: 홈 화면 배너 (글자 없음, 글자는 화면에서 언어별로 얹음)
- assets/og-image.png: 링크 공유 미리보기(카카오톡 · SNS) 1200×630

실행: python scripts/make_hero.py assets   (Pillow 와 Windows 글꼴 필요)
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path(sys.argv[1])
S = 2  # 2배로 그린 뒤 줄여서 경계를 부드럽게
W, H = 1200, 630
FONTS = Path("C:/Windows/Fonts")


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size * S)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def bezier(p0, p1, p2, p3, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = mt**3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t**3 * p3[0]
        y = mt**3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t**3 * p3[1]
        pts.append((x * S, y * S))
    return pts


def draw_scene(with_text):
    img = Image.new("RGB", (W * S, H * S))
    d = ImageDraw.Draw(img)

    # 하늘 그라데이션
    top, bottom = hexrgb("#ec6f6c"), hexrgb("#f9c8b2")
    for y in range(H * S):
        d.line([(0, y), (W * S, y)], fill=lerp(top, bottom, y / (H * S)))

    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)

    # 해
    ld.ellipse([(930 - 70) * S, (170 - 70) * S, (930 + 70) * S, (170 + 70) * S], fill=(253, 226, 210, 150))

    # 산 능선
    ridge = bezier((0, 430), (180, 320), (360, 330), (520, 400)) + bezier((520, 400), (700, 330), (900, 340), (1200, 380))[1:]
    ld.polygon(ridge + [(W * S, H * S), (0, H * S)], fill=(199, 95, 99, 140))

    city = (138, 59, 73, 225)
    # 남산타워 (오른쪽)
    tx = 860
    ld.rectangle([(tx - 4) * S, 150 * S, (tx + 4) * S, 300 * S], fill=city)
    ld.rounded_rectangle([(tx - 20) * S, 205 * S, (tx + 20) * S, 225 * S], radius=6 * S, fill=city)
    ld.polygon([((tx - 32) * S, 420 * S), ((tx - 8) * S, 290 * S), ((tx + 8) * S, 290 * S), ((tx + 32) * S, 420 * S)], fill=city)

    # 빌딩 (오른쪽 위주, 왼쪽은 낮게)
    towers = [
        (560, 90), (600, 130), (640, 100), (690, 170), (740, 120), (790, 150),
        (910, 140), (955, 190), (1000, 120), (1045, 175), (1095, 110), (1140, 160),
        (20, 70), (70, 100), (120, 60),
    ]
    base = 520
    for x, h in towers:
        ld.rounded_rectangle([x * S, (base - h) * S, (x + 38) * S, base * S], radius=3 * S, fill=city)
        for wy in range(base - h + 14, base - 10, 22):  # 창문 불빛
            ld.rectangle([(x + 9) * S, wy * S, (x + 15) * S, (wy + 8) * S], fill=(250, 200, 170, 90))
            ld.rectangle([(x + 23) * S, wy * S, (x + 29) * S, (wy + 8) * S], fill=(250, 200, 170, 90))

    # 강과 다리
    ld.rectangle([0, base * S, W * S, H * S], fill=(233, 135, 127, 200))
    ld.line([(300 * S, (base + 18) * S), (1100 * S, (base + 18) * S)], fill=city, width=5 * S)
    for px in range(320, 1100, 90):
        ld.line([(px * S, (base + 18) * S), (px * S, (base + 40) * S)], fill=city, width=4 * S)
    for i in range(6):  # 물결 반짝임
        y = base + 55 + i * 9
        ld.line([((200 + i * 130) * S, y * S), ((260 + i * 130) * S, y * S)], fill=(255, 225, 215, 120), width=2 * S)

    # 벚꽃 (양쪽 아래)
    blossoms = [
        (40, 560, 70), (130, 600, 60), (230, 585, 48), (10, 480, 44), (95, 500, 38), (300, 615, 40),
        (1150, 560, 72), (1060, 600, 58), (1190, 470, 46), (975, 615, 42), (1110, 500, 34),
    ]
    petals = Image.new("RGBA", img.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(petals)
    for x, y, r in blossoms:
        pd.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=(249, 198, 207, 255))
        r2 = r * 0.55
        cx, cy = x + r * 0.3, y - r * 0.3
        pd.ellipse([(cx - r2) * S, (cy - r2) * S, (cx + r2) * S, (cy + r2) * S], fill=(253, 225, 230, 255))
    # 흩날리는 꽃잎
    for x, y, r in [(380, 120, 7), (470, 210, 5), (1010, 90, 6), (720, 60, 5), (560, 250, 4), (1150, 260, 6)]:
        pd.ellipse([(x - r) * S, (y - r * 0.7) * S, (x + r) * S, (y + r * 0.7) * S], fill=(255, 228, 233, 230))

    img = Image.alpha_composite(img.convert("RGBA"), layer)
    img = Image.alpha_composite(img, petals)

    if with_text:
        # 글자 뒤 은은한 그림자
        shade = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shade)
        sd.ellipse([-120 * S, -60 * S, 760 * S, 470 * S], fill=(120, 30, 45, 70))
        shade = shade.filter(ImageFilter.GaussianBlur(60 * S))
        img = Image.alpha_composite(img, shade)

        td = ImageDraw.Draw(img)
        white = (255, 255, 255, 255)
        td.text((70 * S, 64 * S), "K-Beauty", font=font("georgia.ttf", 92), fill=white)
        td.text((70 * S, 160 * S), "Passport", font=font("georgia.ttf", 92), fill=white)
        td.text((476 * S, 150 * S), "✿", font=font("seguisym.ttf", 40), fill=(255, 224, 230, 255))
        td.text((74 * S, 276 * S), "Explore Korea's beauty", font=font("georgiai.ttf", 30), fill=(255, 240, 236, 255))
        td.text((74 * S, 322 * S), "외국인 여행객을 위한 K-뷰티 지도 · 다국어 예약", font=font("malgunbd.ttf", 24), fill=(255, 240, 236, 255))

        # 카테고리 알약
        chips = [("Dermatology", "#ec5b63"), ("Pharmacy", "#3aa57a"), ("Spa", "#9a6ad8"), ("Beauty Shop", "#e7588a"), ("Plastic Surgery", "#4f7fe8")]
        f = font("seguisb.ttf", 17)
        x, y = 74, 376
        for label, color in chips:
            tw = td.textlength(label, font=f) / S
            wpx = tw + 44
            if x + wpx > 800:
                x, y = 74, y + 50
            td.rounded_rectangle([x * S, y * S, (x + wpx) * S, (y + 38) * S], radius=19 * S, fill=(255, 255, 255, 235))
            td.ellipse([(x + 14) * S, (y + 13) * S, (x + 26) * S, (y + 25) * S], fill=hexrgb(color))
            td.text(((x + 34) * S, (y + 7) * S), label, font=f, fill=(60, 35, 40, 255))
            x += wpx + 10

        # 언어 표시
        td.rounded_rectangle([1000 * S, 40 * S, 1160 * S, 80 * S], radius=20 * S, fill=(214, 96, 100, 255), outline=(255, 255, 255, 255), width=2 * S)
        td.text((1018 * S, 47 * S), "KO · EN · 中 · 日", font=font("malgunbd.ttf", 18), fill=white)

    return img.resize((W, H), Image.LANCZOS).convert("RGB")


draw_scene(False).save(OUT / "hero.png", optimize=True)
draw_scene(True).save(OUT / "og-image.png", optimize=True)
print("ok")
