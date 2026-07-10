import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    error: "Data export is not available in the free tier. Upgrade to Pro for export capabilities.",
    code: "EXPORT_NOT_AVAILABLE"
  }, { status: 403 });
}
