type TokenBucket = {
  tokens: number;
  lastRefillMs: number;
};

const buckets = new Map<string, TokenBucket>();

const MAX_TOKENS = 20;
const REFILL_RATE_PER_SEC = 0.5;

function refill(bucket: TokenBucket, now: number) {
  const elapsedSec = (now - bucket.lastRefillMs) / 1000;
  const refillAmount = elapsedSec * REFILL_RATE_PER_SEC;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refillAmount);
  bucket.lastRefillMs = now;
}

export function isRateLimited(identifier: string) {
  const now = Date.now();
  const current = buckets.get(identifier) ?? {
    tokens: MAX_TOKENS,
    lastRefillMs: now,
  };

  refill(current, now);

  if (current.tokens < 1) {
    buckets.set(identifier, current);
    return true;
  }

  current.tokens -= 1;
  buckets.set(identifier, current);
  return false;
}

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
