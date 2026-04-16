/**
 * Telegram notification client.
 * Uses the Bot API sendMessage endpoint — no SDK needed.
 *
 * Setup:
 *  1. Create a bot via @BotFather → get TELEGRAM_BOT_TOKEN
 *  2. Start a chat with the bot (or add it to a group)
 *  3. Get the chat ID → set TELEGRAM_CHAT_ID
 *
 * Both env vars are optional — if missing, notifications are silently skipped.
 */

const TELEGRAM_API = "https://api.telegram.org";

export interface TelegramMessage {
  text: string;
  /** Optional — overrides TELEGRAM_CHAT_ID for per-user notifications */
  chatId?: string;
  /** Markdown or HTML parse mode (default: Markdown) */
  parseMode?: "Markdown" | "HTML" | "MarkdownV2";
  /** Disable link previews */
  disableWebPagePreview?: boolean;
}

function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getDefaultChatId(): string | undefined {
  return process.env.TELEGRAM_CHAT_ID;
}

/**
 * Send a Telegram message.
 * Returns true on success, false if not configured or on error.
 */
export async function sendTelegramMessage(
  msg: TelegramMessage,
): Promise<boolean> {
  const token = getBotToken();
  const chatId = msg.chatId ?? getDefaultChatId();

  if (!token || !chatId) {
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg.text,
        parse_mode: msg.parseMode ?? "Markdown",
        disable_web_page_preview: msg.disableWebPagePreview ?? true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[telegram] sendMessage failed:", res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
    return false;
  }
}

// ─── Notification helpers ─────────────────────────────────────────────────────

/** New inbound email received */
export async function notifyInboundEmail(opts: {
  from: string;
  subject: string;
  preview?: string;
  inboxUrl: string;
}) {
  return sendTelegramMessage({
    text: [
      `📬 *New email received*`,
      ``,
      `*From:* ${escapeMarkdown(opts.from)}`,
      `*Subject:* ${escapeMarkdown(opts.subject)}`,
      opts.preview
        ? `*Preview:* ${escapeMarkdown(opts.preview.slice(0, 120))}…`
        : "",
      ``,
      `[Open inbox](${opts.inboxUrl})`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

/** Outbound email delivered */
export async function notifyEmailDelivered(opts: {
  to: string;
  subject: string;
}) {
  return sendTelegramMessage({
    text: [
      `✅ *Email delivered*`,
      ``,
      `*To:* ${escapeMarkdown(opts.to)}`,
      `*Subject:* ${escapeMarkdown(opts.subject)}`,
    ].join("\n"),
  });
}

/** Outbound email opened */
export async function notifyEmailOpened(opts: { to: string; subject: string }) {
  return sendTelegramMessage({
    text: [
      `👁 *Email opened*`,
      ``,
      `*To:* ${escapeMarkdown(opts.to)}`,
      `*Subject:* ${escapeMarkdown(opts.subject)}`,
    ].join("\n"),
  });
}

/** Outbound email bounced */
export async function notifyEmailBounced(opts: {
  to: string;
  subject: string;
  reason?: string;
}) {
  return sendTelegramMessage({
    text: [
      `⚠️ *Email bounced*`,
      ``,
      `*To:* ${escapeMarkdown(opts.to)}`,
      `*Subject:* ${escapeMarkdown(opts.subject)}`,
      opts.reason ? `*Reason:* ${escapeMarkdown(opts.reason)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

/** Budget alert — reused from existing webhook system */
export async function notifyBudgetAlert(opts: {
  projectName: string;
  percent: number;
  tokensUsed: number;
  tokensLimit: number;
  dashboardUrl: string;
}) {
  const emoji = opts.percent >= 100 ? "🚨" : "⚠️";
  return sendTelegramMessage({
    text: [
      `${emoji} *Budget alert — ${opts.percent}% used*`,
      ``,
      `*Project:* ${escapeMarkdown(opts.projectName)}`,
      `*Tokens:* ${opts.tokensUsed.toLocaleString()} / ${opts.tokensLimit.toLocaleString()}`,
      ``,
      `[Adjust limits](${opts.dashboardUrl})`,
    ].join("\n"),
  });
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Escape special Markdown characters for Telegram Markdown v1.
 * Escapes backslash first, then * _ ` [
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/`/g, "\\`")
    .replace(/\[/g, "\\[");
}
