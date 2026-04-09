import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";
import { IncidentStatus, IncidentImpact } from "@prisma/client";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  status: z.nativeEnum(IncidentStatus).optional(),
  impact: z.nativeEnum(IncidentImpact).optional(),
  services: z.array(z.string()).optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
});

async function requireSystemWrite() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const can = await hasPermission(user.id, "system:write");
  return can ? user : null;
}

// ─── PATCH — update incident ──────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireSystemWrite();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  const data = {
    ...parsed.data,
    resolvedAt:
      parsed.data.resolvedAt === null
        ? null
        : parsed.data.resolvedAt
          ? new Date(parsed.data.resolvedAt)
          : undefined,
    // Auto-set resolvedAt when status becomes RESOLVED
    ...(parsed.data.status === "RESOLVED" && !parsed.data.resolvedAt
      ? { resolvedAt: new Date() }
      : {}),
  };

  const incident = await prisma.incident.update({ where: { id }, data });
  return NextResponse.json({ incident });
}

// ─── DELETE — remove incident ─────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireSystemWrite();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.incident.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
