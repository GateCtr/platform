import type { CSSProperties } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import {
  emailFmt,
  getEmailMessages,
  type EmailLocale,
} from "@/lib/email-messages";
import { emailAppLocaleUrl } from "@/lib/email-urls";
import { EmailFooter } from "./email-footer";
import { EmailHeaderCard } from "./email-logo";
import { EmailPrimaryCta } from "./email-primitives";
import {
  EMAIL_ACCENT,
  EMAIL_PRIMARY,
  emailCanvas,
  emailCaption,
  emailCardProminent,
  emailColors,
  emailGreeting,
  emailLabelUppercase,
  emailParagraph,
  emailSectionContentCompact,
  emailTitleLarge,
} from "./email-theme";

interface WaitlistInviteEmailProps {
  name?: string;
  email: string;
  inviteCode: string;
  expiresAt: Date;
  expiryDays: number;
  locale?: EmailLocale;
}

export default function WaitlistInviteEmail({
  name,
  email,
  inviteCode,
  expiryDays,
  locale = "en",
}: WaitlistInviteEmailProps) {
  const t = getEmailMessages(locale).waitlistInvite;
  const layout = getEmailMessages(locale).layout;
  const signupUrl = emailAppLocaleUrl(
    locale,
    `/sign-up?invite=${encodeURIComponent(inviteCode)}`,
  );

  const daysLabel = expiryDays === 1 ? t.day : t.days;
  const preview = emailFmt(t.preview, { days: String(expiryDays) });
  const greeting = name ? emailFmt(t.greetingNamed, { name }) : t.greeting;
  const step1 = emailFmt(t.step1, { email });
  const expiresIn = emailFmt(t.expiresIn, {
    days: String(expiryDays),
    daysLabel,
  });

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCardProminent}>
          <EmailHeaderCard />

          <Section style={emailSectionContentCompact}>
            <Text style={emailGreeting}>{greeting}</Text>
            <Heading as="h1" style={emailTitleLarge}>
              {t.headline}
            </Heading>
            <Text style={emailParagraph}>{t.body}</Text>

            <Section style={inviteBox}>
              <Text style={inviteLabel}>{t.inviteCodeLabel}</Text>
              <Text style={inviteCodeStyle}>{inviteCode}</Text>
            </Section>

            <EmailPrimaryCta href={signupUrl}>{t.cta}</EmailPrimaryCta>

            <Text style={orText}>
              {layout.directLink}{" "}
              <Link href={signupUrl} style={link}>
                {signupUrl}
              </Link>
            </Text>

            <Section style={stepsBox}>
              <Text style={{ ...emailLabelUppercase, marginBottom: "14px" }}>
                {t.stepsHeading}
              </Text>
              <Row style={stepRow}>
                <Column style={stepNum}>
                  <Text style={stepNumText}>1</Text>
                </Column>
                <Column>
                  <Text style={stepText}>{step1}</Text>
                </Column>
              </Row>
              <Row style={stepRow}>
                <Column style={stepNum}>
                  <Text style={stepNumText}>2</Text>
                </Column>
                <Column>
                  <Text style={stepText}>{t.step2}</Text>
                </Column>
              </Row>
              <Row style={stepRow}>
                <Column style={stepNum}>
                  <Text style={stepNumText}>3</Text>
                </Column>
                <Column>
                  <Text style={stepText}>{t.step3}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={expiryBox}>
              <Text style={expiryText}>{expiresIn}</Text>
            </Section>

            <Text style={emailCaption}>{t.hint}</Text>
          </Section>

          <EmailFooter
            locale={locale}
            email={email}
            variant="card"
            showUnsubscribe={false}
          />
        </Container>
      </Body>
    </Html>
  );
}

const inviteBox: CSSProperties = {
  background: `linear-gradient(135deg, ${EMAIL_PRIMARY} 0%, ${EMAIL_ACCENT} 100%)`,
  borderRadius: "8px",
  padding: "28px 24px",
  textAlign: "center",
  margin: "0 0 8px",
};

const inviteLabel: CSSProperties = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  margin: "0 0 12px",
};

const inviteCodeStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 700,
  letterSpacing: "3px",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  margin: "0",
};

const orText: CSSProperties = {
  color: emailColors.textCaption,
  fontSize: "12px",
  textAlign: "center",
  margin: "0 0 28px",
};

const link: CSSProperties = {
  color: EMAIL_ACCENT,
  textDecoration: "none",
  wordBreak: "break-all",
};

const stepsBox: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  borderRadius: "8px",
  border: `1px solid ${emailColors.borderSubtle}`,
  padding: "20px 22px",
  margin: "0 0 20px",
};

const stepRow: CSSProperties = {
  marginBottom: "10px",
};

const stepNum: CSSProperties = {
  width: "28px",
  verticalAlign: "top",
};

const stepNumText: CSSProperties = {
  backgroundColor: "#e4e4e7",
  borderRadius: "999px",
  color: emailColors.textSecondary,
  fontSize: "11px",
  fontWeight: 700,
  width: "22px",
  height: "22px",
  lineHeight: "22px",
  textAlign: "center",
  margin: "2px 0 0",
  display: "inline-block",
};

const stepText: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const expiryBox: CSSProperties = {
  backgroundColor: emailColors.warningBg,
  border: `1px solid ${emailColors.warningBorder}`,
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "0 0 8px",
  textAlign: "center",
};

const expiryText: CSSProperties = {
  color: emailColors.warningText,
  fontSize: "13px",
  fontWeight: 600,
  margin: "0",
};
