import type { CSSProperties } from "react";
import {
  Body,
  Button,
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
import { EmailFooter } from "./email-footer";
import { EmailHeaderSimple } from "./email-logo";
import {
  emailButtonPrimary,
  emailCanvas,
  emailCaption,
  emailCard,
  emailColors,
  emailParagraph,
  emailSectionContent,
  emailTitle,
} from "./email-theme";

interface BillingReceiptEmailProps {
  email: string;
  amount: number;
  currency?: string;
  invoicePdfUrl?: string | null;
  locale?: EmailLocale;
}

export default function BillingReceiptEmail({
  email,
  amount,
  currency = "usd",
  invoicePdfUrl,
  locale = "en",
}: BillingReceiptEmailProps) {
  const t = getEmailMessages(locale).billingReceipt;
  const formatted = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{emailFmt(t.preview, { amount: formatted })}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />
          <Section style={emailSectionContent}>
            <Heading as="h1" style={emailTitle}>
              {t.headline}
            </Heading>
            <Text style={emailParagraph}>{t.body}</Text>
            <Section style={amountBox}>
              <Text style={amountLabel}>{t.amountLabel}</Text>
              <Text style={amountValue}>{formatted}</Text>
            </Section>
            {invoicePdfUrl && (
              <Section style={{ margin: "0 0 24px" }}>
                <Button href={invoicePdfUrl} style={emailButtonPrimary}>
                  {t.cta}
                </Button>
              </Section>
            )}
            <Text style={emailCaption}>{t.hint}</Text>
          </Section>
          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}

const amountBox: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  borderRadius: "8px",
  border: `1px solid ${emailColors.borderSubtle}`,
  padding: "24px 24px",
  margin: "0 0 24px",
};

const amountLabel: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const amountValue: CSSProperties = {
  color: emailColors.text,
  fontSize: "28px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  margin: "0",
};
