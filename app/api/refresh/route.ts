import { NextResponse } from "next/server";
import { getApiUsageToday } from "@/lib/api-football/client";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkRefreshAuth(req: Request): NextResponse | null {
  const token = process.env.ADMIN_REFRESH_TOKEN;
  if (isProduction() && !token) return unauthorized();
  if (token) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${token}`) return unauthorized();
  }
  return null;
}

export async function GET(req: Request) {
  const denied = checkRefreshAuth(req);
  if (denied) return denied;

  const usage = await getApiUsageToday();
  const estimatedCost = 15;
  return NextResponse.json({
    estimatedRequests: estimatedCost,
    currentUsage: usage,
    canRefresh: usage.used + estimatedCost < usage.limit,
  });
}

export async function POST(req: Request) {
  const denied = checkRefreshAuth(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  if (!body.confirm) {
    const usage = await getApiUsageToday();
    return NextResponse.json({
      message: "Confirm refresh required",
      estimatedRequests: 15,
      currentUsage: usage,
    });
  }

  try {
    await execAsync("npm run refresh:morning", { cwd: process.cwd(), timeout: 120000 });
    return NextResponse.json({ ok: true, message: "Morning refresh started" });
  } catch {
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
