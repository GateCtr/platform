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
import { EmailFeatureList, EmailPrimaryCta } from "./email-primitives";
import {
  emailCanvas,
  emailCard,
  emailCaption,
  emailGreeting,
  emailParagraph,
  emailSectionContent,
  emailTitle,
} from "./email-theme";

interface UserWelcomeEmailProps {
  name?: string;
  email: string;
  locale?: EmailLocale;
}

export default function UserWelcomeEmail({
  name,
  email,
  locale = "en",
}: UserWelcomeEmailProps) {
  const t = getEmailMessages(locale).userWelcome;
  const dashboardUrl = emailAppLocaleUrl(locale, "/dashboard");

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCard}>
          <EmailHeaderSimple />

          <Section style={emailSectionContent}>
            <Text style={emailGreeting}>
              {name ? `${t.hi} ${name},` : t.hiDefault}
            </Text>
            <Heading as="h1" style={emailTitle}>
              {t.headline}
            </Heading>
            <Text style={emailParagraph}>{t.body}</Text>

            <EmailPrimaryCta href={dashboardUrl}>{t.cta}</EmailPrimaryCta>

            <EmailFeatureList items={t.items} />

            <Text style={emailCaption}>{t.hint}</Text>
          </Section>

          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}
