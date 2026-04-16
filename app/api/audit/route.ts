import { NextRequest, NextResponse } from "next/server";
import { logAudit, type AuditLogEntry } from "@/lib/audit";

const INTERNAL_SECRET = process.env.INTERNAL_AUDIT_SECRET ?? "dev-audit-secret";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: AuditLogEntry;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await logAudit(body);

  return NextResponse.json({ ok: true });
}
