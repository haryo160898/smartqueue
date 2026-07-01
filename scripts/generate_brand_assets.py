from pathlib import Path
import zlib
import struct

public = Path(__file__).resolve().parent.parent / 'public'
public.mkdir(parents=True, exist_ok=True)

logo_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" role="img" aria-label="BENGKEL RAKA Smart Queue logo">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f4c81" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
  </defs>
  <rect width="320" height="100" rx="24" fill="url(#grad)" />
  <circle cx="60" cy="50" r="28" fill="#fbbf24" />
  <path d="M92 40h48v8h-32v4h28v8h-28v10h32v8h-48z" fill="#ffffff" opacity="0.9" />
  <text x="156" y="44" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="20" fill="#ffffff" font-weight="700">BENGKEL RAKA</text>
  <text x="156" y="70" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#e2e8f0" font-weight="500">Smart Queue</text>
</svg>'''

icon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="BENGKEL RAKA icon">
  <defs>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f4c81" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#iconGrad)" />
  <circle cx="60" cy="60" r="30" fill="#fbbf24" />
  <rect x="50" y="40" width="20" height="40" rx="4" fill="#0f4c81" />
  <rect x="40" y="60" width="40" height="20" rx="4" fill="#0f4c81" />
</svg>'''

placeholder_logo_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" role="img" aria-label="BENGKEL RAKA Smart Queue placeholder logo">
  <rect width="320" height="100" rx="24" fill="#0f4c81" />
  <circle cx="50" cy="50" r="24" fill="#fbbf24" />
  <text x="180" y="58" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="20" fill="#ffffff" font-weight="700">SMART QUEUE</text>
</svg>'''

placeholder_logo_png_path = public / 'placeholder-logo.png'

for path, content in [
    (public / 'logo.svg', logo_svg),
    (public / 'icon.svg', icon_svg),
    (public / 'placeholder-logo.svg', placeholder_logo_svg),
]:
    path.write_text(content, encoding='utf-8')


def write_png(path: Path, width: int, height: int, pixel_fn):
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            raw.extend(pixel_fn(x, y, width, height))
    compressor = zlib.compressobj()
    compressed = compressor.compress(bytes(raw)) + compressor.flush()

    def chunk(chunk_type: bytes, data: bytes) -> bytes:
        return struct.pack('!I', len(data)) + chunk_type + data + struct.pack('!I', zlib.crc32(chunk_type + data) & 0xFFFFFFFF)

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    png.extend(chunk(b'IHDR', struct.pack('!IIBBBBB', width, height, 8, 6, 0, 0, 0)))
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    path.write_bytes(png)


def gradient_bg(x, y, width, height):
    t = y / max(height - 1, 1)
    r = int(15 + (37 - 15) * t)
    g = int(76 + (99 - 76) * t)
    b = int(129 + (235 - 129) * t)
    return (r, g, b, 255)


def logo_pixel(x, y, width, height):
    cx, cy, r = 60, 50, 28
    if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
        return (251, 191, 36, 255)
    return gradient_bg(x, y, width, height)


def icon_pixel(x, y, width, height):
    if (x - 60) ** 2 + (y - 60) ** 2 <= 30 * 30:
        return (251, 191, 36, 255)
    if 56 <= x <= 64 or 56 <= y <= 64:
        return (15, 76, 129, 255)
    return gradient_bg(x, y, width, height)

write_png(public / 'logo.png', 320, 100, logo_pixel)
write_png(public / 'icon-light-32x32.png', 32, 32, icon_pixel)
write_png(public / 'icon-dark-32x32.png', 32, 32, icon_pixel)
write_png(public / 'apple-icon.png', 180, 180, icon_pixel)
print('created brand assets in', public)
