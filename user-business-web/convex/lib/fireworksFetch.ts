const SCALING_MARKERS = [
  "DEPLOYMENT_SCALING_UP",
  "scaled to zero",
  "scaling up",
] as const;

/** ~4 min — 4× H200 scale-from-zero can exceed 90s. */
export const COLD_START_BACKOFF_MS = [
  10_000,
  15_000,
  20_000,
  25_000,
  30_000,
  30_000,
  30_000,
  45_000,
  45_000,
  60_000,
] as const;

function isScalingError(status: number, body: string): boolean {
  if (status === 503) return true;
  const lower = body.toLowerCase();
  return SCALING_MARKERS.some((marker) =>
    lower.includes(marker.toLowerCase()),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchFireworksWithRetry(
  url: string,
  init: RequestInit,
  options?: { backoffMs?: readonly number[] },
): Promise<Response> {
  const backoffMs = options?.backoffMs ?? COLD_START_BACKOFF_MS;
  let lastBody = "";
  let lastStatus = 0;

  for (let attempt = 0; attempt <= backoffMs.length; attempt += 1) {
    const resp = await fetch(url, init);
    if (resp.ok) {
      return resp;
    }

    lastStatus = resp.status;
    lastBody = await resp.text();

    if (!isScalingError(lastStatus, lastBody) || attempt === backoffMs.length) {
      throw new Error(
        isScalingError(lastStatus, lastBody)
          ? "Gemma is starting up on Fireworks. Please try again in a minute."
          : `LLM request failed: ${lastBody.slice(0, 400)}`,
      );
    }

    await sleep(backoffMs[attempt] ?? 20_000);
  }

  throw new Error(
    "Gemma is starting up on Fireworks. Please try again in a minute.",
  );
}
