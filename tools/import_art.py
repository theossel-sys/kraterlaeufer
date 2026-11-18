#!/usr/bin/env python3
"""Bilder aus Draw Things ins Spiel holen.

    python3 tools/import_art.py            # alle Bilder aus art/incoming/ verarbeiten
    python3 tools/import_art.py --check    # nur zeigen, was fehlt / da ist

Für jedes Bild, das in art/manifest.json steht und in art/incoming/ liegt:
  1. Hintergrund entfernen: Flutfüllung von den Rändern aus, alles ähnlich der Randfarbe wird transparent
     (deshalb in den Prompts „solid pure magenta background“)
  2. auf den Inhalt zuschneiden (mit etwas Rand)
  3. auf die Zielgröße verkleinern: "pixel" = harte Pixel (Box-Filter, Alpha hart, Farben reduziert),
     "smooth" = weich (Lanczos) für Illustrationen
  4. als PNG nach assets/ speichern
Braucht Pillow (pip install pillow).
"""
import json
import os
import sys
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCOMING = os.path.join(ROOT, 'art', 'incoming')
OUT = os.path.join(ROOT, 'assets')


def remove_background(img, tol):
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()
    # Hintergrundfarbe = die Eckfarbe, die am Bildrand am häufigsten vorkommt
    # (bei Gebirgen liegen die unteren Ecken im Motiv – ein Durchschnitt wäre falsch)
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    border = [px[x, 0] for x in range(0, w, 4)] + [px[x, h - 1] for x in range(0, w, 4)] + \
             [px[0, y] for y in range(0, h, 4)] + [px[w - 1, y] for y in range(0, h, 4)]
    dist = lambda a, b: sum(abs(a[i] - b[i]) for i in range(3))
    bg = max(corners, key=lambda c: sum(1 for b in border if dist(b, c) <= tol))[:3]
    near = lambda c: dist(c, bg) <= tol
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        c = px[x, y]
        if not near(c):
            continue
        px[x, y] = (c[0], c[1], c[2], 0)
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # Saum entfernen: magentastichige Pixel direkt neben transparenten werden ebenfalls transparent
    for _ in range(2):
        clear = []
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                c = px[x, y]
                if c[3] and c[0] > c[1] + 50 and c[2] > c[1] + 50 and (
                        px[x - 1, y][3] == 0 or px[x + 1, y][3] == 0 or px[x, y - 1][3] == 0 or px[x, y + 1][3] == 0):
                    clear.append((x, y, c))
        for x, y, c in clear:
            px[x, y] = (c[0], c[1], c[2], 0)
    return img


def make_tileable(img, frac=0.15):
    """Waagerecht nahtlos: die rechte Kante wird über die linke geblendet, dann abgeschnitten."""
    w, h = img.size
    n = max(2, int(w * frac))
    base = img.crop((0, 0, w - n, h))
    tail = img.crop((w - n, 0, w, h))
    for x in range(n):
        a = x / (n - 1)                         # 0 = Ende des Bildes, 1 = Anfang
        col_t = tail.crop((x, 0, x + 1, h))
        col_b = base.crop((x, 0, x + 1, h))
        base.paste(Image.blend(col_t, col_b, a), (x, 0))
    return base


def fit(img, size, mode, pad, tile_x=False):
    box = img.getchannel('A').getbbox()        # nach Transparenz zuschneiden
    if tile_x:
        if box:
            img = img.crop((0, box[1], img.width, box[3]))
        img = make_tileable(img)
        out = img.resize(tuple(size), Image.BOX if mode == 'pixel' else Image.LANCZOS)
        if mode == 'pixel':
            a = out.getchannel('A').point(lambda v: 255 if v > 110 else 0)
            rgb = out.convert('RGB').quantize(colors=32, method=Image.Quantize.MEDIANCUT).convert('RGB')
            out = Image.merge('RGBA', (*rgb.split(), a))
        return out
    if box:
        img = img.crop(box)
    tw, th = size
    s = min((tw - 2 * pad) / img.width, (th - 2 * pad) / img.height)
    nw, nh = max(1, round(img.width * s)), max(1, round(img.height * s))
    if mode == 'pixel':
        small = img.resize((nw, nh), Image.BOX)
        # harte Kanten und begrenzte Farben für den Pixel-Look
        a = small.getchannel('A').point(lambda v: 255 if v > 110 else 0)
        rgb = small.convert('RGB').quantize(colors=24, method=Image.Quantize.MEDIANCUT).convert('RGB')
        small = Image.merge('RGBA', (*rgb.split(), a))
    else:
        small = img.resize((nw, nh), Image.LANCZOS)
    out = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    out.paste(small, ((tw - nw) // 2, (th - nh) // 2), small)
    return out


def main():
    manifest = json.load(open(os.path.join(ROOT, 'art', 'manifest.json'), encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    check = '--check' in sys.argv
    done = missing = 0
    for name, spec in manifest['images'].items():
        src = None
        for ext in ('.png', '.jpg', '.jpeg', '.webp'):
            p = os.path.join(INCOMING, name + ext)
            if os.path.exists(p):
                src = p
                break
        if not src:
            missing += 1
            print(f'  fehlt   {name}')
            continue
        if check:
            print(f'  da      {name}')
            continue
        img = Image.open(src)
        already_cut = img.mode in ('RGBA', 'LA', 'P') and img.convert('RGBA').getpixel((0, 0))[3] == 0
        if spec.get('keep_background') or already_cut:
            img = img.convert('RGBA')        # schon freigestellt (z. B. aus der lokalen Session): nur zuschneiden
        else:
            img = remove_background(img, spec.get("tolerance", 90))
        out = fit(img, tuple(spec['size']), spec.get('mode', 'smooth'), spec.get('pad', 0), spec.get('tile_x', False))
        if spec.get('keep_background'):      # Fotos/Gemälde: als JPEG viel kleiner
            out.convert('RGB').save(os.path.join(OUT, name + '.jpg'), quality=84, optimize=True, progressive=True)
        else:
            out.save(os.path.join(OUT, name + '.png'), optimize=True)
        done += 1
        print(f'  fertig  {name} -> assets/{name}.png {spec["size"][0]}x{spec["size"][1]}')
    print(f'{done} verarbeitet, {missing} fehlen')


if __name__ == '__main__':
    main()
