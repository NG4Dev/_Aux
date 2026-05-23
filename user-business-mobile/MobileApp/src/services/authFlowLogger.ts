const PREFIX = '[AuthFlow]';

export function authLog(
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
