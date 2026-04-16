/**
 * GET /api/v1/inbox/attachments/download?key=inbox/attachments/...
 *
 * Streams a private R2 attachment through the Next.js server.
 * No signed URLs — the server fetches from R2 and pipes to the client.
 * This avoids all CORS and signed URL issues with Cloudflare proxy.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { s3 } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const R2_BUCKET = process.env.R2_BUCKET ?? "gatectr";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = req.nextUrl.searchParams.get("key");
  const filename = req.nextUrl.searchParams.get("filename") ?? "attachment";

  if (!key)
    return NextResponse.json({ error: "key required" }, { status: 400 });

  // Security: only allow inbox attachment keys
  if (!key.startsWith("inbox/attachments/")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 403 });
  }

  try {
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );

    if (!obj.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const contentType = obj.ContentType ?? "application/octet-stream";
    const chunks: Uint8Array[] = [];
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[attachments/download] R2 fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 },
    );
  }
}
