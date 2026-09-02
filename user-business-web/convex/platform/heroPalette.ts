"use node";

import { v } from "convex/values";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { action } from "../_generated/server";

const FALLBACK_TOP = "#1a1a1a";

function clampLuminance(r: number, g: number, b: number, maxLuminance = 0.4): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const luminance = 0.2126 * rn + 0.7152 * gn + 0.0722 * bn;
  if (luminance <= maxLuminance) {
    return `#${[r, g, b]
      .map((c) => Math.round(c).toString(16).padStart(2, "0"))
      .join("")}`;
  }
  const scale = maxLuminance / Math.max(luminance, 0.001);
  const nr = Math.round(Math.min(255, rn * scale * 255));
  const ng = Math.round(Math.min(255, gn * scale * 255));
  const nb = Math.round(Math.min(255, bn * scale * 255));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

function decodeImage(
  buffer: Buffer,
): { data: Uint8Array; width: number; height: number } | null {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    const decoded = jpeg.decode(buffer, { useTArray: true });
    if (!decoded.data || decoded.width <= 0 || decoded.height <= 0) return null;
    return { data: decoded.data, width: decoded.width, height: decoded.height };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const png = PNG.sync.read(buffer);
    return { data: png.data, width: png.width, height: png.height };
  }

  return null;
}

function extractTopColor(data: Uint8Array, width: number, height: number): string {
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 32));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum < 0.12 || lum > 0.72) continue;
      rSum += r;
      gSum += g;
      bSum += b;
      count += 1;
    }
  }

  if (count === 0) return FALLBACK_TOP;
  return clampLuminance(rSum / count, gSum / count, bSum / count);
}

export const extractHeroBackdropColor = action({
  args: { imageUrl: v.string() },
  returns: v.object({ topColor: v.string() }),
  handler: async (_ctx, args) => {
    try {
      const response = await fetch(args.imageUrl);
      if (!response.ok) {
        return { topColor: FALLBACK_TOP };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const decoded = decodeImage(buffer);
      if (!decoded) {
        return { topColor: FALLBACK_TOP };
      }

      return { topColor: extractTopColor(decoded.data, decoded.width, decoded.height) };
    } catch {
      return { topColor: FALLBACK_TOP };
    }
  },
});
