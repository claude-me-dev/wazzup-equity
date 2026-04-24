import { NextResponse } from "next/server";
import { getDashboardPayload } from "@/lib/dashboard";

export const runtime = "nodejs";
export const revalidate = 20;

export type { DashboardPayload } from "@/lib/dashboard";

export async function GET() {
  try {
    const payload = await getDashboardPayload();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
