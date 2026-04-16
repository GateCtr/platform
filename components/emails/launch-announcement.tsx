import type { CSSProperties } from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { getEmailMessages, type EmailLocale } from "@/lib/email-messages";
import { emailMarketingLocaleUrl } from "@/lib/email-urls";
import { EmailFooter } from "./email-footer";
import { EmailHeaderCard } from "./email-logo";
import {
  EMAIL_ACCENT,
  EMAIL_PRIMARY,
  emailCanvas,
  emailCardProminent,
  emailColors,
  emailGreeting,
  emailLabelUppercase,
  emailParagraph,
  emailSectionContentCompact,
  emailTitleLarge,
} from "./email-theme";

interface LaunchAnnouncementEmailProps {
  name?: string;
  email: string;
  locale?: EmailLocale;
}

export default function LaunchAnnouncementEmail({
  name,
  email,
  locale = "en",
}: LaunchAnnouncementEmailProps) {
  const t = getEmailMessages(locale).launchAnnouncement;
  const layout = getEmailMessages(locale).layout;

  const launchUrl = emailMarketingLocaleUrl(locale, "/launch?ref=launch-email");
  const phUrl = "https://www.producthunt.com/posts/gatectr";
  const signupUrl = emailMarketingLocaleUrl(
    locale,
    "/waitlist?ref=launch-email",
  );

  const greeting = name ? `${t.greetingNamed} ${name},` : `${t.greeting},`;

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCardProminent}>
          <EmailHeaderCard />

          <Section style={emailSectionContentCompact}>
            <Text style={emailGreeting}>{greeting}</Text>

            <Heading as="h1" style={emailTitleLarge}>
              {t.headline}
            </Heading>

            <Text style={emailParagraph}>{t.body}</Text>

            <Section style={phBadgeBox}>
              <Text style={phBadgeText}>{t.phBadge}</Text>
            </Section>

            <Section style={ctaRow}>
              <Row>
                <Column style={{ paddingRight: "8px" }}>
                  <Button href={phUrl} style={btnPrimary}>
                    {t.ctaUpvote}
                  </Button>
                </Column>
                <Column>
                  <Button href={signupUrl} style={btnSecondary}>
                    {t.ctaSignup}
                  </Button>
                </Column>
              </Row>
            </Section>

            <Section style={offerBox}>
              <Text style={offerLabel}>{t.offerBadge}</Text>
              <Text style={offerHeadline}>{t.offerHeadline}</Text>
              <Section style={codeBox}>
                <Text style={codeText}>PRODUCTHUNT26</Text>
              </Section>
              <Text style={offerNote}>{t.offerNote}</Text>
            </Section>

            <Text style={{ ...emailLabelUppercase, marginBottom: "16px" }}>
              {t.featuresHeading}
            </Text>

            {(t.features as { title: string; description: string }[]).map(
              (f) => (
                <Section key={f.title} style={featureRow}>
                  <Text style={featureTitle}>✦ {f.title}</Text>
                  <Text style={featureDesc}>{f.description}</Text>
                </Section>
              ),
            )}

            <Section style={makerBox}>
              <Text style={makerText}>{t.makerNote}</Text>
              <Text style={makerSig}>{t.makerSig}</Text>
            </Section>

            <Section style={ctaRow}>
              <Button href={launchUrl} style={btnPrimary}>
                {t.ctaFinal}
              </Button>
            </Section>

            <Text style={footerNote}>{layout.questionsReply}</Text>
          </Section>

          <EmailFooter
            locale={locale}
            email={email}
            variant="card"
            showUnsubscribe
          />
        </Container>
      </Body>
    </Html>
  );
}

const phBadgeBox: CSSProperties = {
  backgroundColor: "#fff7ed",
  border: `1px solid #fed7aa`,
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "24px",
  textAlign: "center",
};

const phBadgeText: CSSProperties = {
  color: "#c2410c",
  fontSize: "14px",
  fontWeight: 700,
  margin: "0",
};

const ctaRow: CSSProperties = {
  margin: "0 0 28px",
};

const btnPrimary: CSSProperties = {
  backgroundColor: EMAIL_PRIMARY,
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
};

const btnSecondary: CSSProperties = {
  backgroundColor: "transparent",
  color: EMAIL_PRIMARY,
  fontSize: "14px",
  fontWeight: 600,
  padding: "11px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  border: `1.5px solid ${EMAIL_PRIMARY}`,
  display: "inline-block",
};

const offerBox: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  border: `1px solid ${emailColors.border}`,
  borderRadius: "10px",
  padding: "20px 24px",
  margin: "0 0 32px",
  textAlign: "center",
};

const offerLabel: CSSProperties = {
  color: EMAIL_ACCENT,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
};

const offerHeadline: CSSProperties = {
  color: emailColors.text,
  fontSize: "16px",
  fontWeight: 700,
  margin: "0 0 14px",
};

const codeBox: CSSProperties = {
  backgroundColor: emailColors.surface,
  border: `2px dashed ${EMAIL_ACCENT}`,
  borderRadius: "8px",
  padding: "10px 20px",
  display: "inline-block",
  margin: "0 auto 12px",
};

const codeText: CSSProperties = {
  color: EMAIL_PRIMARY,
  fontSize: "22px",
  fontWeight: 800,
  letterSpacing: "0.12em",
  margin: "0",
  fontFamily: "monospace",
};

const offerNote: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "12px",
  margin: "0",
};

const featureRow: CSSProperties = {
  marginBottom: "14px",
};

const featureTitle: CSSProperties = {
  color: emailColors.text,
  fontSize: "14px",
  fontWeight: 700,
  margin: "0 0 2px",
};

const featureDesc: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "13px",
  margin: "0",
};

const makerBox: CSSProperties = {
  borderLeft: `3px solid ${EMAIL_ACCENT}`,
  paddingLeft: "16px",
  margin: "28px 0",
};

const makerText: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "14px",
  fontStyle: "italic",
  margin: "0 0 6px",
  lineHeight: "1.6",
};

const makerSig: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "13px",
  fontWeight: 600,
  margin: "0",
};

const footerNote: CSSProperties = {
  color: emailColors.textCaption,
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "24px 0 0",
};
