import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTeamContextByUserId } from "@/lib/team-context";
import { resolveAuth, checkScope } from "@/lib/api-auth";
import { randomBytes } from "crypto";

function requestId(): string {
  return randomBytes(8).toString("hex");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rid = requestId();
  const headers = { "X-GateCtr-Request-Id": rid };
  const { id } = await params;

  const auth = await resolveAuth(req);
  if ("error" in auth)
    return NextResponse.json(
      { error: auth.error },
      { status: auth.httpStatus, headers },
    );

  const scopeErr = checkScope(auth.scopes, "admin");
  if (scopeErr)
    return NextResponse.json(
      { error: scopeErr.error, required: "admin" },
      { status: 403, headers },
    );

  const ctx = await resolveTeamContextByUserId(auth.userId);
  if (!ctx)
    return NextResponse.json(
      { error: "No active team" },
      { status: 404, headers },
    );

  const key = await prisma.lLMProviderKey.findFirst({
    where: {
      id,
      OR: [{ teamId: ctx.teamId }, { userId: ctx.userId, teamId: null }],
    },
  });
  if (!key)
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });

  const hard = new URL(req.url).searchParams.get("hard") === "true";
  if (hard) {
    await prisma.lLMProviderKey.delete({ where: { id } });
  } else {
    await prisma.lLMProviderKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ success: true }, { headers });
}
