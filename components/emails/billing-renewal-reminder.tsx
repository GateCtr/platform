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

interface BillingRenewalReminderEmailProps {
  email: string;
  renewalDate: Date;
  amount: number;
  currency?: string;
  locale?: EmailLocale;
}

export default function BillingRenewalReminderEmail({
  email,
  renewalDate,
  amount,
  currency = "usd",
  locale = "en",
}: BillingRenewalReminderEmailProps) {
  const t = getEmailMessages(locale).billingRenewalReminder;

  const formattedDate = new Intl.DateTimeFormat(
    locale === "fr" ? "fr-FR" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
  ).format(renewalDate);

  const formattedAmount = new Intl.NumberFormat(
    locale === "fr" ? "fr-FR" : "en-US",
    { style: "currency", currency: currency.toUpperCase() },
  ).format(amount / 100);

  const billingUrl = emailAppLocaleUrl(locale, "/billing");

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{emailFmt(t.preview, { date: formattedDate })}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />
          <Section style={emailSectionContent}>
            <Heading as="h1" style={emailTitle}>
              {t.headline}
            </Heading>
            <Text style={emailParagraph}>
              {emailFmt(t.body, {
                date: formattedDate,
                amount: formattedAmount,
              })}
            </Text>
            <Section style={infoBox}>
              <Text style={infoRow}>
                <span style={infoLabel}>{t.dateLabel}</span> {formattedDate}
              </Text>
              <Text style={{ ...infoRow, margin: "0" }}>
                <span style={infoLabel}>{t.amountLabel}</span> {formattedAmount}
              </Text>
            </Section>
            <EmailPrimaryCta href={billingUrl}>{t.cta}</EmailPrimaryCta>
            <Text style={emailCaption}>{t.hint}</Text>
          </Section>
          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}

const infoBox: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  borderRadius: "8px",
  border: `1px solid ${emailColors.borderSubtle}`,
  padding: "20px 22px",
  margin: "0 0 8px",
};

const infoRow: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 10px",
};

const infoLabel: CSSProperties = {
  color: emailColors.textMuted,
  fontWeight: 600,
};
