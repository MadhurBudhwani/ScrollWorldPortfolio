"""Cut white-card sprite sheets into aligned, transparent WebP frames.

Run:  python scripts/slice-sheet.py

Two things here are worth more than the slicing itself:

  * Every sheet in one run shares a single output box and a single anchor, so
    frames from different sheets can be played one after another without the
    character jumping. Cutting each sheet on its own is what makes a character
    appear to hop when an idle hands over to a talk.

  * The grid is found from the ink, not by dividing the sheet evenly. Generated
    sheets rarely have exact gutters, and an even split shaves a hand off the
    frames at the ends.

White is removed by flooding in from the edges only. The shoe soles and the
paper in his bag are pale too, but they are enclosed, so the flood never
reaches them.
"""

import os
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANIM = os.path.join(HERE, "assets", "worlds", "anim")

SHEETS = [
    ("idle-sheet.webp", "idle", 8, 2),
    ("speak-sheet.webp", "speak", 8, 2),
]
TOL = 232      # at or above this on every channel counts as card white
PAD = 12       # breathing room around the widest and tallest frame
GUTTER = 6     # how far past a detected band to look for stray pixels


def runs(density):
    out, start = [], -1
    for i, v in enumerate(density):
        if v > 0:
            if start < 0:
                start = i
        elif start >= 0:
            out.append((start, i - 1))
            start = -1
    if start >= 0:
        out.append((start, len(density) - 1))
    return out


def real_bands(bands):
    """Drop specks: a band under a third of the widest is not a frame."""
    if not bands:
        return bands
    widest = max(b - a for a, b in bands)
    return [b for b in bands if b[1] - b[0] > widest / 3]


def even_bands(size, count):
    step = size / count
    return [(round(i * step), round((i + 1) * step) - 1) for i in range(count)]


def measure(path, cols, rows):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()

    ink_cols = [0] * w
    ink_rows = [0] * h
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 40 and (r < TOL or g < TOL or b < TOL):
                ink_cols[x] += 1
                ink_rows[y] += 1

    col_bands = real_bands(runs(ink_cols))
    row_bands = real_bands(runs(ink_rows))
    if len(col_bands) != cols:
        col_bands = even_bands(w, cols)
    if len(row_bands) != rows:
        row_bands = even_bands(h, rows)

    cells = []
    for r0, r1 in row_bands:
        for c0, c1 in col_bands:
            x0, x1, y0, y1 = w, -1, h, -1
            for y in range(max(0, r0 - GUTTER), min(h, r1 + GUTTER + 1)):
                for x in range(max(0, c0 - GUTTER), min(w, c1 + GUTTER + 1)):
                    r, g, b, a = px[x, y]
                    if a > 40 and (r < TOL or g < TOL or b < TOL):
                        x0 = min(x0, x); x1 = max(x1, x)
                        y0 = min(y0, y); y1 = max(y1, y)
            if x1 < 0:
                raise SystemExit("empty cell in " + os.path.basename(path))
            cells.append({
                "w": x1 - x0 + 1, "h": y1 - y0 + 1,
                "cx": (x0 + x1) / 2.0, "foot": y1,
            })
    return im, cells


def cut_white(im):
    """Flood the card white away from the four edges."""
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    stack = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)]
    stack += [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    while stack:
        x, y = stack.pop()
        i = y * w + x
        if seen[i]:
            continue
        r, g, b, a = px[x, y]
        if a == 0:
            seen[i] = 1
            continue
        if r < TOL or g < TOL or b < TOL:
            continue
        seen[i] = 1
        px[x, y] = (r, g, b, 0)
        if x > 0: stack.append((x - 1, y))
        if x < w - 1: stack.append((x + 1, y))
        if y > 0: stack.append((x, y - 1))
        if y < h - 1: stack.append((x, y + 1))


def luminance(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def peel_rim(im, passes=3, margin=34):
    """Take off the blended edge the flood cannot reach.

    The flood only removes pixels that are card white on every channel. Where
    the ink meets the card the generator left a ramp between the two - measured
    on this art it runs 61 to 235, median 190 - and that ramp survives as a pale
    outline around the character.

    A pixel is only removed when it is markedly brighter than the art directly
    behind it, never on brightness alone. His shoe soles are nearly white and
    sit on the silhouette edge, but the pixels behind them are the same cream,
    so the comparison leaves them where they are.
    """
    w, h = im.size
    px = im.load()
    for _ in range(passes):
        rim = []
        for y in range(h):
            for x in range(w):
                if px[x, y][3] < 20:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= w or ny >= h or px[nx, ny][3] < 20:
                        rim.append((x, y))
                        break
        on_rim = set(rim)
        doomed = []
        for x, y in rim:
            behind = []
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    if px[nx, ny][3] < 20 or (nx, ny) in on_rim:
                        continue
                    behind.append(luminance(px[nx, ny]))
            here = luminance(px[x, y])
            if behind:
                behind.sort()
                if here - behind[len(behind) // 2] > margin:
                    doomed.append((x, y))
            elif here > 200:
                doomed.append((x, y))
        if not doomed:
            break
        for x, y in doomed:
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0)


PORTRAITS = ["priya", "arjun", "nadia"]


def cut_portraits():
    """The three people whose permissions the security card compares.

    They arrive as separate generations, so they agree on style but not on
    crop: one is framed tighter than the next. Left alone they would change
    size as the card is tilted between them, which is the one thing this card
    must not do. They are trimmed to their own ink, brought to a common height
    and set in a common box, bottom aligned.
    """
    loaded = []
    for name in PORTRAITS:
        src = os.path.join(ANIM, "_src-%s.webp" % name)
        if not os.path.exists(src):
            print("skip (missing):", os.path.basename(src))
            continue
        im = Image.open(src).convert("RGBA")
        # Some of these arrive already cut. Running the flood and the peel over
        # one of those would take a pixel off an edge that was already correct,
        # so ask first: an image with real transparency is left alone.
        if im.getchannel("A").getextrema()[0] > 250:
            cut_white(im)
            peel_rim(im)
            cut = "cut from white"
        else:
            cut = "already transparent"
        box = im.getbbox()
        if not box:
            raise SystemExit("nothing left of " + name)
        trimmed = im.crop(box)
        loaded.append((name, trimmed))
        print("%-6s %-20s figure %dx%d"
              % (name, cut, trimmed.width, trimmed.height))

    if not loaded:
        return

    # Match on the head, not on the overall crop. Measured on these three, one
    # of them is framed further back than the others: his head is a quarter
    # smaller in his own picture. Scaling everyone to the same total height
    # would have kept that difference and shrunk his face as the card turned to
    # him, which is exactly the jump this card cannot afford.
    def head_of(t):
        px = t.load()
        w, h = t.size
        band = max(1, int(h * 0.20))
        best_w, best_cx, top = 0, w // 2, None
        for y in range(min(band, h)):
            xs = [x for x in range(w) if px[x, y][3] > 40]
            if not xs:
                continue
            if top is None:
                top = y
            if xs[-1] - xs[0] + 1 > best_w:
                best_w = xs[-1] - xs[0] + 1
                best_cx = (xs[0] + xs[-1]) // 2
        return best_w, best_cx, top or 0

    heads = [head_of(t) for _, t in loaded]
    target = min(hw for hw, _, _ in heads)
    # Head and shoulders, not waist up: in the card these sit in a slot only a
    # few dozen pixels wide, and a waist-up crop leaves the face too small to
    # recognise.
    box_w, box_h = round(target * 2.2), round(target * 2.5)
    print("portrait box: %dx%d  (head width matched at %d)" % (box_w, box_h, target))

    for (name, t), (hw, hcx, htop) in zip(loaded, heads):
        f = target / float(hw)
        s = t.resize((max(1, round(t.width * f)), max(1, round(t.height * f))),
                     Image.LANCZOS)
        card = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 0))
        # Heads the same size, the same width apart and starting at the same
        # line, so only the person changes.
        card.paste(s, (round(box_w / 2.0 - hcx * f), round(box_h * 0.06 - htop * f)), s)
        card.save(os.path.join(ANIM, "who-%s.webp" % name),
                  "WEBP", lossless=True, quality=100, method=6)
        print("  %-6s head %d -> %d (x%.3f)" % (name, hw, target, f))


def main():
    loaded = []
    for name, prefix, cols, rows in SHEETS:
        path = os.path.join(ANIM, name)
        if not os.path.exists(path):
            print("skip (missing):", name)
            continue
        im, cells = measure(path, cols, rows)
        loaded.append((prefix, im, cells))
        spread_h = max(c["h"] for c in cells) - min(c["h"] for c in cells)
        spread_w = max(c["w"] for c in cells) - min(c["w"] for c in cells)
        print("%-6s %2d frames  height %d-%d (spread %d)  width spread %d"
              % (prefix, len(cells),
                 min(c["h"] for c in cells), max(c["h"] for c in cells),
                 spread_h, spread_w))

    if not loaded:
        raise SystemExit("no sheets found")

    # The sheets do not come back at the same scale: the generator draws the
    # character a little larger or smaller each time, and a handover between two
    # sheets that disagree makes him visibly grow. Bring them to a common figure
    # height, always by shrinking the larger one, because enlarging pixel art is
    # the worse of the two.
    def median_height(cells):
        heights = sorted(c["h"] for c in cells)
        return heights[len(heights) // 2]

    target = min(median_height(cells) for _, _, cells in loaded)
    rescaled = []
    for prefix, im, cells in loaded:
        have = median_height(cells)
        factor = target / float(have)
        if abs(factor - 1.0) < 0.01:
            rescaled.append((prefix, im, cells))
            continue
        w, h = im.size
        smaller = im.resize((max(1, round(w * factor)), max(1, round(h * factor))),
                            Image.LANCZOS)
        tmp = os.path.join(ANIM, "_rescaled.png")
        smaller.save(tmp)
        im2, cells2 = measure(tmp, 8, 2)
        os.remove(tmp)
        print("%-6s rescaled %d -> %d (x%.3f) to match the other sheet"
              % (prefix, have, median_height(cells2), factor))
        rescaled.append((prefix, im2, cells2))
    loaded = rescaled

    # One box for every frame of every sheet, so nothing shifts on a handover.
    box_w = max(c["w"] for _, _, cells in loaded for c in cells) + PAD * 2
    box_h = max(c["h"] for _, _, cells in loaded for c in cells) + PAD * 2
    print("shared frame box: %dx%d" % (box_w, box_h))

    for prefix, im, cells in loaded:
        for n, cell in enumerate(cells, 1):
            frame = Image.new("RGBA", (box_w, box_h), (255, 255, 255, 255))
            frame.paste(im,
                        (round(box_w / 2.0 - cell["cx"]),
                         round(box_h - PAD - cell["foot"])),
                        im)
            cut_white(frame)
            peel_rim(frame)
            out = os.path.join(ANIM, "%s-%02d.webp" % (prefix, n))
            # Lossless: this is pixel art, and a lossy pass smears every edge
            # the artist drew one pixel wide.
            frame.save(out, "WEBP", lossless=True, quality=100, method=6)
        print("wrote %s-01..%s-%02d.webp" % (prefix, prefix, len(cells)))


if __name__ == "__main__":
    main()
    cut_portraits()
