export const FALLBACK_TOP = '#1a1a1a';
export const GRADIENT_BOTTOM = '#000000';

export function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i += 1) {
    h = (h << 5) - h + url.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

export function clampLuminance(hex: string, maxLuminance = 0.4): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return FALLBACK_TOP;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (luminance <= maxLuminance) return `#${normalized}`;
  const scale = maxLuminance / Math.max(luminance, 0.001);
  const nr = Math.round(Math.min(255, r * scale * 255));
  const ng = Math.round(Math.min(255, g * scale * 255));
  const nb = Math.round(Math.min(255, b * scale * 255));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

export function pickSwatch(result: Record<string, string | undefined>): string {
  const candidate =
    result.muted ??
    result.dominant ??
    result.darkMuted ??
    result.darkVibrant ??
    result.vibrant ??
    result.lightMuted;
  if (!candidate) return FALLBACK_TOP;
  return clampLuminance(candidate.startsWith('#') ? candidate : `#${candidate}`);
}

export type HeroBackdropPalette = {
  topColor: string;
  gradientColors: [string, string, string];
  status: 'idle' | 'loading' | 'ready' | 'fallback';
};

export function toPalette(
  topColor: string,
  status: HeroBackdropPalette['status'],
): HeroBackdropPalette {
  return {
    topColor,
    gradientColors: [topColor, '#0a0a0a', GRADIENT_BOTTOM],
    status,
  };
}
