import { NextResponse } from "next/server";
import { getApiUsageToday } from "@/lib/api-football/client";

export async function GET() {
  const usage = await getApiUsageToday();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiFootball: usage,
  });
}
