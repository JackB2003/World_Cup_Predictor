import { NextResponse } from "next/server";
import { fetchWorldCupData } from "@/lib/data/service";

export async function GET() {
  const data = await fetchWorldCupData();
  return NextResponse.json(data);
}
