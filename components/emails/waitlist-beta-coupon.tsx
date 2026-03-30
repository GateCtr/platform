import type { CSSProperties } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
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

interface WaitlistBetaCouponEmailProps {
  name?: string;
  email: string;
  couponCode: string;
  inviteCode: string;
  position: number;
  locale?: EmailLocale;
}

export default function WaitlistBetaCouponEmail({
  name,
  email,
  couponCode,
  inviteCode,
  position,
  locale = "en",
}: WaitlistBetaCouponEmailProps) {
  const t = getEmailMessages(locale).waitlistBetaCoupon;
  const signupUrl = emailAppLocaleUrl(
    locale,
    `/sign-up?invite=${encodeURIComponent(inviteCode)}`,
  );
  const greeting = name ? emailFmt(t.greetingNamed, { name }) : t.greeting;
  const body = emailFmt(t.body, { position: String(position) });

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
            <Text style={emailParagraph}>{body}</Text>

            <Section style={couponBox}>
              <Text style={couponLabel}>{t.inviteCodeLabel}</Text>
              <Text style={couponCodeStyle}>{inviteCode}</Text>
              <Text style={couponDivider}>{t.couponLabel}</Text>
              <Text style={couponCodeStyle}>{couponCode}</Text>
              <Text style={couponMeta}>{t.couponMeta}</Text>
            </Section>

            <EmailPrimaryCta href={signupUrl}>{t.cta}</EmailPrimaryCta>

            <Section style={detailsBox}>
              <Text style={{ ...emailLabelUppercase, marginBottom: "12px" }}>
                {t.detailsHeading}
              </Text>
              <Text style={detailItem}>✓ {t.detail1}</Text>
              <Text style={detailItem}>✓ {t.detail2}</Text>
              <Text style={detailItem}>✓ {t.detail3}</Text>
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

const couponBox: CSSProperties = {
  background: `linear-gradient(135deg, ${EMAIL_PRIMARY} 0%, ${EMAIL_ACCENT} 100%)`,
  borderRadius: "8px",
  padding: "28px 24px",
  textAlign: "center",
  margin: "0 0 8px",
};

const couponLabel: CSSProperties = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  margin: "0 0 12px",
};

const couponCodeStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: 700,
  letterSpacing: "3px",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  margin: "0 0 10px",
};

const couponDivider: CSSProperties = {
  color: "rgba(255,255,255,0.5)",
  fontSize: "10px",
  letterSpacing: "0.12em",
  fontWeight: 600,
  margin: "14px 0 8px",
  textTransform: "uppercase" as const,
};

const couponMeta: CSSProperties = {
  color: "rgba(255,255,255,0.85)",
  fontSize: "12px",
  fontWeight: 500,
  margin: "0",
};

const detailsBox: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  borderRadius: "8px",
  border: `1px solid ${emailColors.borderSubtle}`,
  padding: "20px 22px",
  margin: "8px 0 20px",
};

const detailItem: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 6px",
};
