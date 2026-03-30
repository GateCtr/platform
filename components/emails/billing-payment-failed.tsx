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
import { EmailFooter } from "./email-footer";
import { EmailHeaderSimple } from "./email-logo";
import { EmailAlertBanner, EmailDangerCta } from "./email-primitives";
import {
  emailCanvas,
  emailCaption,
  emailCard,
  emailParagraph,
  emailSectionContent,
  emailTitle,
} from "./email-theme";

interface BillingPaymentFailedEmailProps {
  email: string;
  portalUrl: string;
  locale?: EmailLocale;
}

export default function BillingPaymentFailedEmail({
  email,
  portalUrl,
  locale = "en",
}: BillingPaymentFailedEmailProps) {
  const t = getEmailMessages(locale).billingPaymentFailed;

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />
          <Section style={emailSectionContent}>
            <EmailAlertBanner variant="danger">{t.alert}</EmailAlertBanner>
            <Heading as="h1" style={emailTitle}>
              {t.headline}
            </Heading>
            <Text style={emailParagraph}>{t.body}</Text>
            <EmailDangerCta href={portalUrl}>{t.cta}</EmailDangerCta>
            <Text style={emailCaption}>{t.hint}</Text>
          </Section>
          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}
