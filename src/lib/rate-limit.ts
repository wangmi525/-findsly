const rateLimiter: Record<string, { count: number; resetAt: number }> = {};

export function checkRateLimit(userId: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const key = userId;
  if (!rateLimiter[key] || now > rateLimiter[key].resetAt) {
    rateLimiter[key] = { count: 1, resetAt: now + windowMs };
    return true;
  }
  rateLimiter[key].count++;
  return rateLimiter[key].count <= limit;
}

export function getRateLimitInfo(userId: string) {
  const key = userId;
  const entry = rateLimiter[key];
  if (!entry) return { remaining: 30, resetAt: Date.now() + 60000 };
  return { remaining: Math.max(0, 30 - entry.count), resetAt: entry.resetAt };
}
