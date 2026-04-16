/**
 * OutboxEmail — template for emails composed and sent from the GateCtr inbox.
 *
 * Receives pre-parsed paragraphs (plain text) — no HTML parsing in this
 * component, eliminating all XSS / ReDoS / sanitization concerns.
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
import { emailCanvas, emailCard, emailColors } from "./email-theme";

export interface OutboxParagraph {
  type: "paragraph" | "quote";
  text: string;
}

interface OutboxEmailProps {
  subject: string;
  /**
   * Pre-parsed paragraphs — plain text only, no HTML.
   * Generated server-side by parseBodyForEmail() in lib/email-body-parser.ts.
   */
  paragraphs: OutboxParagraph[];
  fromName?: string;
  locale?: "en" | "fr";
}

export default function OutboxEmail({
  subject,
  paragraphs,
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
          <EmailHeaderSimple />

          {/* Subject */}
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

          {/* Body — plain text paragraphs, no HTML parsing */}
          <Section style={{ padding: "0 48px 40px" }}>
            {paragraphs.map((p, i) =>
              p.type === "quote" ? (
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
                  {p.text}
                </Text>
              ) : (
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
                  {p.text}
                </Text>
              ),
            )}
          </Section>

          {/* Footer */}
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
