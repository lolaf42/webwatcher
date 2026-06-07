#!/usr/bin/env python3
"""Generate minimal WebWatcher PNG icons."""
import struct, zlib, os

def png(size, color=(124, 158, 248)):
    """Create a simple solid-color PNG with a centered eye symbol."""
    w, h = size, size
    r, g, b = color

    # Create pixel data - dark background with accent-colored circle
    bg = (30, 30, 46)
    rows = []
    cx, cy = w // 2, h // 2
    # outer circle radius, inner (pupil) radius
    ro = w * 0.38
    ri = w * 0.18

    for y in range(h):
        row = bytearray()
        for x in range(w):
            dx, dy = x - cx, y - cy
            dist = (dx*dx + dy*dy) ** 0.5
            # eye ring
            if ro - w*0.09 < dist < ro:
                row.extend([r, g, b, 255])
            elif dist < ri:
                row.extend([r, g, b, 255])
            else:
                row.extend([*bg, 255])
        rows.append(b'\x00' + bytes(row))

    raw = b''.join(rows)
    compressed = zlib.compress(raw, 9)

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', ihdr)
        + chunk(b'IDAT', compressed)
        + chunk(b'IEND', b'')
    )

os.makedirs(os.path.dirname(__file__), exist_ok=True)
for size in (48, 96):
    with open(os.path.join(os.path.dirname(__file__), f'icon{size}.png'), 'wb') as f:
        f.write(png(size))
    print(f'icon{size}.png written')
