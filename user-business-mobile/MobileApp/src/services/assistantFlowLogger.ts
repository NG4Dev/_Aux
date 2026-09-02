const PREFIX = '[AssistantFlow]';

export function assistantLog(
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

export function assistantWarn(
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

export function assistantError(
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
