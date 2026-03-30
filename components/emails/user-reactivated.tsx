import type { CSSProperties } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
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
  emailCard,
  emailColors,
  emailGreeting,
  emailParagraph,
  emailSectionContent,
  emailTitle,
} from "./email-theme";

interface UserReactivatedEmailProps {
  email: string;
  name?: string;
  locale?: EmailLocale;
}

export default function UserReactivatedEmail({
  email,
  name,
  locale = "en",
}: UserReactivatedEmailProps) {
  const t = getEmailMessages(locale).userReactivated;
  const layout = getEmailMessages(locale).layout;
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
            <Text style={hint}>
              {t.contact}{" "}
              <Link href={`mailto:${layout.supportEmail}`} style={link}>
                {layout.supportEmail}
              </Link>
            </Text>
          </Section>
          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}

const hint: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const link: CSSProperties = {
  color: emailColors.text,
  fontWeight: 600,
  textDecoration: "underline",
};
