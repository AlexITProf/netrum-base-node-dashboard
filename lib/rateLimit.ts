const calls: Record<string, number> = {};
const LIMIT = 30_000;

export function canCall(key: string) {
  const last = calls[key] ?? 0;
  return Date.now() - last >= LIMIT;
}

export function markCalled(key: string) {
  calls[key] = Date.now();
}

export function getRemainingTime(key: string) {
  const last = calls[key] ?? 0;
  const remaining = LIMIT - (Date.now() - last);
  return Math.max(0, remaining);
}

