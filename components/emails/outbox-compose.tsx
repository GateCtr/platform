/**
 * OutboxEmail — template for emails composed and sent from the GateCtr inbox.
 *
 * Design references: Linear, Stripe, Notion direct emails.
 * - Clean white card, no heavy branding
 * - Proper typography: 15px body, 24px line-height, zinc palette
 * - Minimal footer: sender identity only
 *
 * Security: bodyHtml is rendered via React Email's Html component which
 * handles the HTML safely in the email context. The content is generated
 * server-side by textToHtml() which only produces safe tags.
 */
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import { EmailHeaderSimple } from "./email-logo";
import {
  emailCanvas,
  emailCard,
  emailColors,
  EMAIL_PRIMARY,
} from "./email-theme";

interface OutboxEmailProps {
  subject: string;
  /**
   * HTML body generated server-side by textToHtml() in compose-dialog.tsx.
   * Only contains safe tags: <p>, <br>, <blockquote>, <a href>.
   * All user input is HTML-entity-escaped before tag insertion.
   */
  bodyHtml: string;
  fromName?: string;
  toName?: string;
  locale?: "en" | "fr";
}

/**
 * Render the body HTML as React Email paragraphs.
 * Parses the simplified HTML produced by textToHtml() into React nodes
 * to avoid dangerouslySetInnerHTML entirely.
 */
function renderBody(html: string): React.ReactNode {
  // Split on paragraph tags — textToHtml() only produces <p>...</p> and <blockquote>...</blockquote>
  const paragraphs = html
    .replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, "\n[QUOTE]$1[/QUOTE]\n")
    .split(/<\/?p>/)
    .map((s) => s.trim())
    .filter(Boolean);

  return paragraphs.map((chunk, i) => {
    if (chunk.startsWith("[QUOTE]")) {
      const content = chunk.replace("[QUOTE]", "").replace("[/QUOTE]", "");
      return (
        <Text
          key={i}
          style={{
            borderLeft: `3px solid ${emailColors.border}`,
            paddingLeft: "16px",
            margin: "16px 0",
            color: emailColors.textMuted,
            fontSize: "14px",
            lineHeight: "22px",
          }}
        >
          {content.replace(/<br\s*\/?>/g, "\n")}
        </Text>
      );
    }
    // Replace <br> with newlines, strip remaining tags
    const text = chunk.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "");
    return (
      <Text
        key={i}
        style={{
          color: emailColors.textSecondary,
          fontSize: "15px",
          lineHeight: "26px",
          margin: "0 0 16px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {text}
      </Text>
    );
  });
}

export default function OutboxEmail({
  subject,
  bodyHtml,
  fromName = "GateCtr",
  locale = "en",
}: OutboxEmailProps) {
  const replyEmail = process.env.INBOX_FROM_EMAIL ?? "hello@gatectr.com";

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{subject}</Preview>

      <Body style={emailCanvas}>
        <Container style={emailCard}>
          {/* ── Header ── */}
          <EmailHeaderSimple />

          {/* ── Subject line ── */}
          <Section style={{ padding: "32px 48px 0" }}>
            <Text
              style={{
                color: emailColors.text,
                fontSize: "18px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: "26px",
                margin: "0 0 24px",
              }}
            >
              {subject}
            </Text>
          </Section>

          {/* ── Body — rendered as React nodes, no dangerouslySetInnerHTML ── */}
          <Section style={{ padding: "0 48px 40px" }}>
            {renderBody(bodyHtml)}
          </Section>

          {/* ── Footer ── */}
          <Hr
            style={{ borderColor: emailColors.borderSubtle, margin: "0 48px" }}
          />
          <Section style={{ padding: "20px 48px 28px" }}>
            <Text
              style={{
                color: emailColors.textCaption,
                fontSize: "12px",
                lineHeight: "18px",
                margin: "0",
              }}
            >
              <span style={{ fontWeight: 600, color: emailColors.textMuted }}>
                {fromName}
              </span>
              {"  ·  "}
              <Link
                href={`mailto:${replyEmail}`}
                style={{ color: emailColors.textMuted, textDecoration: "none" }}
              >
                {replyEmail}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
