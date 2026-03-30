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

interface BillingCancellationEmailProps {
  email: string;
  planName: string;
  accessUntil: Date;
  locale?: EmailLocale;
}

export default function BillingCancellationEmail({
  email,
  planName,
  accessUntil,
  locale = "en",
}: BillingCancellationEmailProps) {
  const t = getEmailMessages(locale).billingCancellation;

  const dateStr = accessUntil.toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );
  const billingUrl = emailAppLocaleUrl(locale, "/billing");

  return (
    <Html lang={locale}>
      <Head />
      <Preview>
        {emailFmt(t.preview, { plan: planName, date: dateStr })}
      </Preview>
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />
          <Section style={emailSectionContent}>
            <Heading as="h1" style={emailTitle}>
              {t.headline}
            </Heading>
            <Text style={emailParagraph}>
              {emailFmt(t.body, { plan: planName })}
            </Text>
            <Section style={accessBox}>
              <Text style={accessLabel}>{t.accessLabel}</Text>
              <Text style={accessDate}>{dateStr}</Text>
            </Section>
            <Text style={emailParagraph}>{t.resumeHint}</Text>
            <EmailPrimaryCta href={billingUrl}>{t.cta}</EmailPrimaryCta>
            <Text style={emailCaption}>{t.hint}</Text>
          </Section>
          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}

const accessBox: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  borderRadius: "8px",
  border: `1px solid ${emailColors.borderSubtle}`,
  padding: "20px 22px",
  margin: "0 0 24px",
};

const accessLabel: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const accessDate: CSSProperties = {
  color: emailColors.text,
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  margin: "0",
};
