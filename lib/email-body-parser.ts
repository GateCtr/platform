/**
 * Email body parser — converts plain text to structured paragraphs.
 * Used server-side in /api/v1/outbox to prepare email content.
 *
 * Security: no regex on user input, no HTML parsing, just plain text splitting.
 */

export interface OutboxParagraph {
  type: "paragraph" | "quote";
  text: string;
}

/**
 * Parse plain text body into structured paragraphs for email rendering.
 * - Double newlines → separate paragraphs
 * - Lines starting with > → quote blocks
 * - Single newlines within a paragraph → preserved as-is
 *
 * Returns plain text only — no HTML, no regex on user input.
 */
export function parseBodyForEmail(text: string): OutboxParagraph[] {
  // Split on double newlines to get blocks
  const blocks = text.split("\n\n").filter((b) => b.trim());

  return blocks.map((block) => {
    const lines = block.split("\n");

    // Quote block — all lines start with >
    if (lines.every((l) => l.startsWith(">"))) {
      const quoteText = lines.map((l) => l.replace(/^>\s?/, "")).join("\n");
      return { type: "quote" as const, text: quoteText };
    }

    // Regular paragraph — preserve newlines
    return { type: "paragraph" as const, text: block };
  });
}
