/**
 * Outreach CRM — Integration Tests (12.9)
 *
 * Tests:
 *  - POST /api/webhooks/resend — valid and invalid signatures
 *  - GET /api/track/open/[trackingId] — GIF response headers and DB update
 *  - GET /api/track/click/[trackingId] — redirect behavior and idempotency
 *
 * Validates: Requirements 7.1, 7.2, 7.4, 8.1, 8.3, 9.1, 9.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const mockUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn().mockResolvedValue({});
const mockTransaction = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    outreachEmailLog: {
      updateMany: mockUpdateMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    outreachProspect: {
      update: mockUpdate,
    },
    $transaction: mockTransaction,
  },
}));

// ─── Mock Resend — use a module-level spy that can be configured per test ─────

vi.mock("resend", () => {
  // webhooksVerify is a stable reference that tests can configure via vi.mocked
  const webhooksVerify = vi.fn();

  function MockResend() {
    return {
      webhooks: { verify: webhooksVerify },
    };
  }
  MockResend.__webhooksVerify = webhooksVerify;

  return { Resend: MockResend };
});

// Helper to get the shared verify mock
async function getVerifyMock() {
  const { Resend } = await import("resend");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (Resend as any).__webhooksVerify as ReturnType<typeof vi.fn>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {},
): NextRequest {
  return new NextRequest(url, {
    method: options.method ?? "GET",
    body: options.body,
    headers: options.headers ?? {},
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/track/open/[trackingId]
// Validates: Requirements 7.1, 7.2, 7.4
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/track/open/[trackingId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("returns a 200 response with Content-Type: image/gif", async () => {
    const { GET } = await import("@/app/api/track/open/[trackingId]/route");
    const req = makeRequest("http://localhost/api/track/open/test-tracking-id");
    const params = Promise.resolve({ trackingId: "test-tracking-id" });

    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/gif");
  });

  it("returns Cache-Control: no-store header", async () => {
    const { GET } = await import("@/app/api/track/open/[trackingId]/route");
    const req = makeRequest("http://localhost/api/track/open/test-id");
    const params = Promise.resolve({ trackingId: "test-id" });

    const response = await GET(req, { params });

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns a valid GIF binary body (starts with GIF89a magic bytes)", async () => {
    const { GET } = await import("@/app/api/track/open/[trackingId]/route");
    const req = makeRequest("http://localhost/api/track/open/test-id");
    const params = Promise.resolve({ trackingId: "test-id" });

    const response = await GET(req, { params });
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // GIF89a magic: 0x47 0x49 0x46 0x38 0x39 0x61
    expect(bytes[0]).toBe(0x47); // G
    expect(bytes[1]).toBe(0x49); // I
    expect(bytes[2]).toBe(0x46); // F
  });

  it("calls prisma.outreachEmailLog.updateMany with trackingId and openedAt: null (idempotent)", async () => {
    const { GET } = await import("@/app/api/track/open/[trackingId]/route");
    const trackingId = "abc-123";
    const req = makeRequest(`http://localhost/api/track/open/${trackingId}`);
    const params = Promise.resolve({ trackingId });

    await GET(req, { params });

    // Give the fire-and-forget a tick to run
    await new Promise((r) => setTimeout(r, 10));

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trackingId, openedAt: null }),
        data: expect.objectContaining({ status: "OPENED" }),
      }),
    );
  });

  it("still returns GIF for an unknown trackingId (no error thrown)", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 }); // 0 rows updated = unknown id
    const { GET } = await import("@/app/api/track/open/[trackingId]/route");
    const req = makeRequest("http://localhost/api/track/open/unknown-id");
    const params = Promise.resolve({ trackingId: "unknown-id" });

    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/gif");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/track/click/[trackingId]
// Validates: Requirements 8.1, 8.3
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/track/click/[trackingId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("redirects to targetUrl when trackingId is found (302)", async () => {
    const targetUrl = "https://gatectr.com/pricing";
    mockFindUnique.mockResolvedValue({ targetUrl, clickedAt: null });

    const { GET } = await import("@/app/api/track/click/[trackingId]/route");
    const req = makeRequest("http://localhost/api/track/click/click-id");
    const params = Promise.resolve({ trackingId: "click-id" });

    const response = await GET(req, { params });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(targetUrl);
  });

  it("redirects to base URL when trackingId is unknown", async () => {
    mockFindUnique.mockResolvedValue(null);
    process.env.NEXT_PUBLIC_APP_URL = "https://app.gatectr.com";

    const { GET } = await import("@/app/api/track/click/[trackingId]/route");
    const req = makeRequest("http://localhost/api/track/click/unknown");
    const params = Promise.resolve({ trackingId: "unknown" });

    const response = await GET(req, { params });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toContain("app.gatectr.com");
  });

  it("updates clickedAt idempotently on first click", async () => {
    const targetUrl = "https://gatectr.com";
    mockFindUnique.mockResolvedValue({ targetUrl, clickedAt: null });

    const { GET } = await import("@/app/api/track/click/[trackingId]/route");
    const req = makeRequest("http://localhost/api/track/click/click-id-2");
    const params = Promise.resolve({ trackingId: "click-id-2" });

    await GET(req, { params });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trackingId: "click-id-2",
          clickedAt: null,
        }),
        data: expect.objectContaining({ status: "CLICKED" }),
      }),
    );
  });

  it("does NOT call updateMany when clickedAt is already set (idempotency)", async () => {
    const targetUrl = "https://gatectr.com";
    mockFindUnique.mockResolvedValue({ targetUrl, clickedAt: new Date() });

    const { GET } = await import("@/app/api/track/click/[trackingId]/route");
    const req = makeRequest("http://localhost/api/track/click/already-clicked");
    const params = Promise.resolve({ trackingId: "already-clicked" });

    await GET(req, { params });

    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("redirects to targetUrl even when already clicked", async () => {
    const targetUrl = "https://gatectr.com/docs";
    mockFindUnique.mockResolvedValue({ targetUrl, clickedAt: new Date() });

    const { GET } = await import("@/app/api/track/click/[trackingId]/route");
    const req = makeRequest(
      "http://localhost/api/track/click/already-clicked-2",
    );
    const params = Promise.resolve({ trackingId: "already-clicked-2" });

    const response = await GET(req, { params });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(targetUrl);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/webhooks/resend
// Validates: Requirements 9.1, 9.4
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test_secret";
    mockTransaction.mockResolvedValue([]);
  });

  it("returns 401 when signature is invalid", async () => {
    const verifyMock = await getVerifyMock();
    verifyMock.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const { POST } = await import("@/app/api/webhooks/resend/route");
    const req = makeRequest("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: JSON.stringify({
        type: "email.delivered",
        data: { email_id: "msg_123" },
      }),
      headers: {
        "svix-id": "msg_id",
        "svix-timestamp": "1234567890",
        "svix-signature": "invalid_sig",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 200 and processes email.delivered event with valid signature", async () => {
    const resendId = "msg_delivered_123";
    const verifyMock = await getVerifyMock();
    verifyMock.mockReturnValue({
      type: "email.delivered",
      data: { email_id: resendId },
    });

    const { POST } = await import("@/app/api/webhooks/resend/route");
    const req = makeRequest("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: JSON.stringify({
        type: "email.delivered",
        data: { email_id: resendId },
      }),
      headers: {
        "svix-id": "msg_id",
        "svix-timestamp": "1234567890",
        "svix-signature": "valid_sig",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.received).toBe(true);
  });

  it("calls prisma.outreachEmailLog.updateMany with DELIVERED status on email.delivered", async () => {
    const resendId = "msg_delivered_456";
    const verifyMock = await getVerifyMock();
    verifyMock.mockReturnValue({
      type: "email.delivered",
      data: { email_id: resendId },
    });

    const { POST } = await import("@/app/api/webhooks/resend/route");
    const req = makeRequest("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: JSON.stringify({
        type: "email.delivered",
        data: { email_id: resendId },
      }),
      headers: {
        "svix-id": "msg_id",
        "svix-timestamp": "1234567890",
        "svix-signature": "valid_sig",
      },
    });

    await POST(req);

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { resendId },
        data: { status: "DELIVERED" },
      }),
    );
  });

  it("returns 200 for email.bounced and updates log + prospect status", async () => {
    const resendId = "msg_bounced_789";
    const logId = "log_id_1";
    const prospectId = "prospect_id_1";

    const verifyMock = await getVerifyMock();
    verifyMock.mockReturnValue({
      type: "email.bounced",
      data: { email_id: resendId },
    });

    // findUnique returns the log record
    mockFindUnique.mockResolvedValue({ id: logId, prospectId });

    const { POST } = await import("@/app/api/webhooks/resend/route");
    const req = makeRequest("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: JSON.stringify({
        type: "email.bounced",
        data: { email_id: resendId },
      }),
      headers: {
        "svix-id": "msg_id",
        "svix-timestamp": "1234567890",
        "svix-signature": "valid_sig",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    // Transaction should have been called to update both log and prospect
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("returns 200 (idempotent) when resendId is not found in email.bounced", async () => {
    const resendId = "msg_not_found";
    const verifyMock = await getVerifyMock();
    verifyMock.mockReturnValue({
      type: "email.bounced",
      data: { email_id: resendId },
    });
    mockFindUnique.mockResolvedValue(null); // not found

    const { POST } = await import("@/app/api/webhooks/resend/route");
    const req = makeRequest("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: JSON.stringify({
        type: "email.bounced",
        data: { email_id: resendId },
      }),
      headers: {
        "svix-id": "msg_id",
        "svix-timestamp": "1234567890",
        "svix-signature": "valid_sig",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 200 for unknown event types (no-op)", async () => {
    const verifyMock = await getVerifyMock();
    verifyMock.mockReturnValue({
      type: "email.opened",
      data: { email_id: "msg_123" },
    });

    const { POST } = await import("@/app/api/webhooks/resend/route");
    const req = makeRequest("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: JSON.stringify({
        type: "email.opened",
        data: { email_id: "msg_123" },
      }),
      headers: {
        "svix-id": "msg_id",
        "svix-timestamp": "1234567890",
        "svix-signature": "valid_sig",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
  });

  it("returns 500 when RESEND_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;

    const { POST } = await import("@/app/api/webhooks/resend/route");
    const req = makeRequest("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: "{}",
    });

    const response = await POST(req);

    expect(response.status).toBe(500);
  });
});
