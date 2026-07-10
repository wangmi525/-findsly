import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Data export is not available. LeadFlow contacts are platform-exclusive for security and compliance. Contacts you manually uploaded via CSV can be exported by contacting support.", code: "EXPORT_DISABLED" }, { status: 403 });
}
