import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { resolveTeamContextByUserId } from "@/lib/team-context";
import { resolveAuth, checkScope } from "@/lib/api-auth";
import { randomBytes } from "crypto";

const VALID_PROVIDERS = ["openai", "anthropic", "mistral", "gemini"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

function requestId(): string {
  return randomBytes(8).toString("hex");
}

export async function GET(req: NextRequest) {
  const rid = requestId();
  const headers = { "X-GateCtr-Request-Id": rid };

  const auth = await resolveAuth(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.httpStatus, headers });

  const scopeErr = checkScope(auth.scopes, "read");
  if (scopeErr)
    return NextResponse.json({ error: scopeErr.error, required: "read" }, { status: 403, headers });

  const ctx = await resolveTeamContextByUserId(auth.userId);
  if (!ctx)
    return NextResponse.json({ error: "No active team" }, { status: 404, headers });

  const keys = await prisma.lLMProviderKey.findMany({
    where: { isActive: true, OR: [{ teamId: ctx.teamId }, { userId: ctx.userId, teamId: null }] },
    select: { id: true, provider: true, name: true, isActive: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(keys, { headers });
}

export async function POST(req: NextRequest) {
  const rid = requestId();
  const headers = { "X-GateCtr-Request-Id": rid };

  const auth = await resolveAuth(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.httpStatus, headers });

  const scopeErr = checkScope(auth.scopes, "admin");
  if (scopeErr)
    return NextResponse.json({ error: scopeErr.error, required: "admin" }, { status: 403, headers });

  const ctx = await resolveTeamContextByUserId(auth.userId);
  if (!ctx)
    return NextResponse.json({ error: "No active team" }, { status: 404, headers });

  const body = (await req.json()) as { provider?: string; apiKey?: string; name?: string };

  if (!body.provider || !VALID_PROVIDERS.includes(body.provider as Provider))
    return NextResponse.json({ error: "invalid_provider", allowed: VALID_PROVIDERS }, { status: 400, headers });
  if (!body.apiKey)
    return NextResponse.json({ error: "apiKey is required" }, { status: 400, headers });

  const name = body.name ?? "Default";
  const existing = await prisma.lLMProviderKey.findFirst({ where: { teamId: ctx.teamId, provider: body.provider, name } });
  if (existing)
    return NextResponse.json({ error: "conflict", message: `A key named "${name}" already exists for ${body.provider}` }, { status: 409, headers });

  const encryptedApiKey = encrypt(body.apiKey);
  const providerKey = await prisma.lLMProviderKey.create({
    data: { userId: ctx.userId, teamId: ctx.teamId, provider: body.provider, name, encryptedApiKey },
    select: { id: true, provider: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(providerKey, { status: 201, headers });
}
