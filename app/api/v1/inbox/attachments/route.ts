/**
 * POST /api/v1/inbox/attachments
 * Uploads an email attachment directly to R2 via the server.
 * Accepts multipart/form-data with a single `file` field.
 *
 * Returns: { key, filename, contentType, size }
 *
 * No CORS issues — the browser sends the file to our Next.js server,
 * which then uploads to R2 using server-side credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { uploadBuffer } from "@/lib/storage";

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB — Resend attachment limit

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 25 MB)" },
      { status: 400 },
    );
  }

  const contentType = file.type || "application/octet-stream";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `inbox/attachments/${clerkId}/${randomBytes(8).toString("hex")}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadBuffer(key, buffer, contentType);
  } catch (err) {
    console.error("[attachments] R2 upload failed:", err);
    return NextResponse.json(
      { error: "Upload to storage failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    key,
    filename: file.name,
    contentType,
    size: file.size,
  });
}
