import os
import zlib
import struct
import math

def create_png(width, height, get_pixel_rgba):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_rgba(x, y, width, height)
            raw_data.extend([int(r), int(b), int(a)])

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(bytes(raw_data), level=9))
        + chunk(b'IEND', b'')
    )
    return png

def render_icon(size):
    radius = size * 0.22
    pad = max(1.0, size * 0.04)
    w, h = size, size

    def pixel_color(x, y, w, h):
        dx = max(pad + radius - x, 0.0, x - (w - 1 - pad - radius))
        dy = max(pad + radius - y, 0.0, y - (h - 1 - pad - radius))
        dist = math.sqrt(dx*dx + dy*dy)
        
        if dx > 0 and dy > 0:
            if dist > radius:
                return (0, 0, 0, 0)
            elif dist > radius - 1.0:
                bg_alpha = (radius - dist)
            else:
                bg_alpha = 1.0
        else:
            if x < pad or x > w - 1 - pad or y < pad or y > h - 1 - pad:
                bg_alpha = 0.0
            else:
                bg_alpha = 1.0

        if bg_alpha <= 0:
            return (0, 0, 0, 0)

        # Gradient: Rich deep Navy/Blue (#1e3a8a) to vibrant Cyan/Sky (#0284c7)
        t = (x + y * 1.1) / (w + h * 1.1)
        r_bg = int(22 + (2 - 22) * t)
        g_bg = int(48 + (132 - 48) * t)
        b_bg = int(140 + (220 - 140) * t)

        # Magnifying glass geometry
        cx = w * 0.44
        cy = h * 0.44
        glass_radius = w * 0.23
        glass_thickness = max(1.2, w * 0.065)

        d_center = math.sqrt((x - cx)**2 + (y - cy)**2)
        diff_radius = abs(d_center - glass_radius)

        # Handle of magnifying glass (45 degrees down-right)
        angle = math.pi / 4.0
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        
        hx1 = cx + (glass_radius + glass_thickness * 0.4) * cos_a
        hy1 = cy + (glass_radius + glass_thickness * 0.4) * sin_a
        hx2 = cx + (w * 0.46) * cos_a
        hy2 = cy + (h * 0.46) * sin_a

        px = hx2 - hx1
        py = hy2 - hy1
        seg_len_sq = px*px + py*py
        u = ((x - hx1) * px + (y - hy1) * py) / seg_len_sq
        u = max(0.0, min(1.0, u))
        proj_x = hx1 + u * px
        proj_y = hy1 + u * py
        d_handle = math.sqrt((x - proj_x)**2 + (y - proj_y)**2)
        handle_thickness = max(1.4, w * 0.075)

        in_glass = d_center < (glass_radius - glass_thickness * 0.8)

        # Antialiased glass ring mask
        ring_mask = 0.0
        if diff_radius <= glass_thickness / 2.0 + 0.6:
            ring_mask = max(0.0, min(1.0, (glass_thickness / 2.0 + 0.6 - diff_radius)))

        # Antialiased handle mask
        handle_mask = 0.0
        if d_handle <= handle_thickness / 2.0 + 0.6:
            handle_mask = max(0.0, min(1.0, (handle_thickness / 2.0 + 0.6 - d_handle)))

        icon_mask = max(ring_mask, handle_mask)

        # Document lines inside glass (representing process / legal doc)
        doc_mask = 0.0
        if in_glass and size >= 32:
            bar_w = w * 0.16
            bar_h = max(1.0, h * 0.035)
            if abs(x - cx) < bar_w / 2.0 and abs(y - (cy - h * 0.05)) < bar_h / 2.0:
                doc_mask = 0.8
            if abs(x - (cx - w*0.02)) < (bar_w * 0.75) / 2.0 and abs(y - (cy + h * 0.05)) < bar_h / 2.0:
                doc_mask = 0.8

        # Lens flare inside lens
        lens_glow = 0.0
        if in_glass:
            flare_dist = math.sqrt((x - (cx - glass_radius * 0.35))**2 + (y - (cy - glass_radius * 0.35))**2)
            lens_glow = max(0.0, 1.0 - flare_dist / (glass_radius * 0.8)) * 0.28

        # Combine colors
        if icon_mask > 0:
            r_icon = 255
            g_icon = 255
            b_icon = 255
            r = int(r_bg * (1 - icon_mask) + r_icon * icon_mask)
            g = int(g_bg * (1 - icon_mask) + g_icon * icon_mask)
            b = int(b_bg * (1 - icon_mask) + b_icon * icon_mask)
            return (r, g, b, int(bg_alpha * 255))
        elif doc_mask > 0:
            r = int(r_bg * (1 - doc_mask) + 220 * doc_mask)
            g = int(g_bg * (1 - doc_mask) + 245 * doc_mask)
            b = int(b_bg * (1 - doc_mask) + 255 * doc_mask)
            return (r, g, b, int(bg_alpha * 255))
        else:
            cdist = math.sqrt((x - cx)**2 + (y - cy)**2) / (w * 0.5)
            glow = max(0.0, 1.0 - cdist) * 0.15 + lens_glow
            r = min(255, int(r_bg + 255 * glow))
            g = min(255, int(g_bg + 255 * glow))
            b = min(255, int(b_bg + 255 * glow))
            return (r, g, b, int(bg_alpha * 255))

    return create_png(size, size, pixel_color)

def main():
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    for size in [16, 32, 48, 128]:
        png_data = render_icon(size)
        path = os.path.join(icons_dir, f'icon-{size}.png')
        with open(path, 'wb') as f:
            f.write(png_data)
        print(f"Generated {path} ({size}x{size})")

if __name__ == '__main__':
    main()
