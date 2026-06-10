import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/picks": { limit: 10, windowMs: 60_000 },
  "/api/refresh": { limit: 2, windowMs: 3_600_000 },
};

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function middleware(req: NextRequest) {
  if (req.method !== "POST") return NextResponse.next();

  const path = req.nextUrl.pathname;
  const rule = LIMITS[path];
  if (!rule) return NextResponse.next();

  const key = `${clientIp(req)}:${path}`;
  if (allow(key, rule.limit, rule.windowMs)) return NextResponse.next();

  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}

export const config = {
  matcher: ["/api/picks", "/api/refresh"],
};
