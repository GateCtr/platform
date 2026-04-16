/**
 * OutboxEmail — template for emails composed and sent from the GateCtr inbox.
 *
 * Design references: Linear, Stripe, Notion direct emails.
 * - Clean white card, no heavy branding
 * - Proper typography: 15px body, 24px line-height, zinc palette
 * - Minimal footer: sender identity only
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
  /** Plain text body from the composer — we render it with proper typography */
  bodyHtml: string;
  fromName?: string;
  toName?: string;
  locale?: "en" | "fr";
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
      <Head>
        <style>{`
          /* Reset for email clients */
          body { margin: 0; padding: 0; }
          * { box-sizing: border-box; }

          /* Body typography */
          .email-body p {
            color: ${emailColors.textSecondary};
            font-size: 15px;
            line-height: 26px;
            margin: 0 0 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          .email-body p:last-child { margin-bottom: 0; }

          /* Links in body */
          .email-body a {
            color: ${EMAIL_PRIMARY};
            text-decoration: underline;
          }

          /* Blockquote — for quoted replies */
          .email-body blockquote {
            border-left: 3px solid ${emailColors.border};
            margin: 16px 0;
            padding: 4px 0 4px 16px;
            color: ${emailColors.textMuted};
            font-size: 14px;
            line-height: 22px;
          }

          /* Code blocks */
          .email-body code {
            background: ${emailColors.infoBg};
            border: 1px solid ${emailColors.border};
            border-radius: 4px;
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 13px;
            padding: 1px 5px;
          }

          /* Horizontal rule */
          .email-body hr {
            border: none;
            border-top: 1px solid ${emailColors.borderSubtle};
            margin: 24px 0;
          }

          /* Lists */
          .email-body ul, .email-body ol {
            color: ${emailColors.textSecondary};
            font-size: 15px;
            line-height: 26px;
            margin: 0 0 16px;
            padding-left: 24px;
          }
          .email-body li { margin-bottom: 4px; }
        `}</style>
      </Head>
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

          {/* ── Body ── */}
          <Section style={{ padding: "0 48px 40px" }}>
            {/*
             * bodyHtml is composed by the admin user themselves via the
             * compose dialog — it is NOT user-supplied external content.
             * The textToHtml() function in compose-dialog.tsx escapes all
             * HTML entities before building the HTML, so only safe tags
             * (<p>, <br>, <blockquote>, <a>) are ever present.
             * This is intentional and safe for this admin-only context.
             */}
            { }
            <div
              className="email-body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
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
