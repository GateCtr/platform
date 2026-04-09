import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { invalidateAnnouncementCache } from "@/lib/announcement";
import { z } from "zod";

const schema = z.object({
  enabled: z.boolean(),
  message: z.string().min(1).max(200),
  messageFr: z.string().max(200).optional(),
  cta: z.string().max(50).optional(),
  ctaFr: z.string().max(50).optional(),
  ctaHref: z.string().max(200).optional(),
  variant: z.enum(["info", "warning", "success", "promo"]),
  dismissable: z.boolean(),
});

export async function PUT(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canWrite = await hasPermission(user.id, "system:read");
  if (!canWrite)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { enabled, ...config } = parsed.data;

  await prisma.featureFlag.upsert({
    where: { key: "announcement_bar" },
    create: {
      key: "announcement_bar",
      name: "Announcement Bar",
      description: JSON.stringify(config),
      enabled,
    },
    update: {
      description: JSON.stringify(config),
      enabled,
    },
  });

  await invalidateAnnouncementCache();

  return NextResponse.json({ ok: true });
}
