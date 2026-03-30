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
  emailParagraph,
  emailSectionContent,
  emailTitle,
} from "./email-theme";

interface BillingUpgradeEmailProps {
  email: string;
  planName: string;
  locale?: EmailLocale;
}

export default function BillingUpgradeEmail({
  email,
  planName,
  locale = "en",
}: BillingUpgradeEmailProps) {
  const t = getEmailMessages(locale).billingUpgrade;
  const billingUrl = emailAppLocaleUrl(locale, "/billing");

  const headline = emailFmt(t.headline, { plan: planName });
  const body = emailFmt(t.body, { plan: planName });

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{emailFmt(t.preview, { plan: planName })}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />
          <Section style={emailSectionContent}>
            <Heading as="h1" style={emailTitle}>
              {headline}
            </Heading>
            <Text style={emailParagraph}>{body}</Text>
            <EmailPrimaryCta href={billingUrl}>{t.cta}</EmailPrimaryCta>
            <Text style={emailCaption}>{t.hint}</Text>
          </Section>
          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}
