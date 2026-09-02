const PREFIX = '[DiscoverFlow]';

export function discoverLog(
  scope: string,
  step: string,
  data?: Record<string, unknown>,
): void {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.log(PREFIX, scope, step, data);
  } else {
    console.log(PREFIX, scope, step);
  }
}

export function discoverWarn(
  scope: string,
  step: string,
  data?: Record<string, unknown>,
): void {
  if (!__DEV__) return;
  if (data !== undefined) {
    console.warn(PREFIX, scope, step, data);
  } else {
    console.warn(PREFIX, scope, step);
  }
}

export function discoverError(
  scope: string,
  step: string,
  error: unknown,
  data?: Record<string, unknown>,
): void {
  if (!__DEV__) return;
  console.error(PREFIX, scope, step, {
    error: String(error),
    ...data,
  });
}
