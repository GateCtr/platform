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
import { getEmailMessages, type EmailLocale } from "@/lib/email-messages";
import { emailAppLocaleUrl } from "@/lib/email-urls";
import { EmailFooter } from "./email-footer";
import { EmailHeaderSimple } from "./email-logo";
import { EmailPrimaryCta } from "./email-primitives";
import {
  emailCanvas,
  emailCaption,
  emailCard,
  emailColors,
  emailParagraph,
  emailSectionContent,
  emailTitle,
} from "./email-theme";

interface BillingDowngradeEmailProps {
  email: string;
  lostFeatures: string[];
  locale?: EmailLocale;
}

export default function BillingDowngradeEmail({
  email,
  lostFeatures,
  locale = "en",
}: BillingDowngradeEmailProps) {
  const t = getEmailMessages(locale).billingDowngrade;
  const billingUrl = emailAppLocaleUrl(locale, "/billing");

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />
          <Section style={emailSectionContent}>
            <Heading as="h1" style={emailTitle}>
              {t.headline}
            </Heading>
            <Text style={emailParagraph}>{t.body}</Text>
            {lostFeatures.length > 0 && (
              <Section style={featureBox}>
                <Text style={featureTitle}>{t.lostLabel}</Text>
                {lostFeatures.map((f) => (
                  <Text key={f} style={featureItem}>
                    — {f}
                  </Text>
                ))}
              </Section>
            )}
            <EmailPrimaryCta href={billingUrl}>{t.cta}</EmailPrimaryCta>
            <Text style={emailCaption}>{t.hint}</Text>
          </Section>
          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}

const featureBox: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  borderRadius: "8px",
  border: `1px solid ${emailColors.borderSubtle}`,
  padding: "20px 22px",
  margin: "0 0 8px",
};

const featureTitle: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: "0 0 12px",
};

const featureItem: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 6px",
};
