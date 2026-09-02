const paletteCache = new Map<string, string>();

export function getCachedHeroBackdropColor(imageUrl: string): string | undefined {
  return paletteCache.get(imageUrl);
}

export function setCachedHeroBackdropColor(imageUrl: string, topColor: string): void {
  paletteCache.set(imageUrl, topColor);
}

export function hasCachedHeroBackdropColor(imageUrl: string): boolean {
  return paletteCache.has(imageUrl);
}
