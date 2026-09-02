const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
] as const;

const STORAGE_KEY = "aux_utm_params";

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export const resolveUtmParams = (search?: string): UtmParams => {
  if (typeof window === "undefined") return {};

  const fromUrl: UtmParams = {};
  const params = new URLSearchParams(
    search ?? window.location?.search ?? "",
  );
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) fromUrl[key] = value;
  }

  if (Object.keys(fromUrl).length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      // ignore
    }
    return fromUrl;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParams;
  } catch {
    return {};
  }
};

export const getPersistedUtmsForAnalytics = (): Record<string, string> => {
  const utms = resolveUtmParams();
  return Object.fromEntries(
    Object.entries(utms).filter(([, value]) => typeof value === "string"),
  ) as Record<string, string>;
};
