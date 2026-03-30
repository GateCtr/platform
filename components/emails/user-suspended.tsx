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
import {
  emailCanvas,
  emailCard,
  emailColors,
  emailGreeting,
  emailParagraph,
  emailSectionContent,
  emailTitle,
} from "./email-theme";

interface UserSuspendedEmailProps {
  email: string;
  name?: string;
  locale?: EmailLocale;
}

export default function UserSuspendedEmail({
  email,
  name,
  locale = "en",
}: UserSuspendedEmailProps) {
  const t = getEmailMessages(locale).userSuspended;
  const supportUrl = emailAppLocaleUrl(locale, "/support");

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
            <Section style={infoBox}>
              <Text style={infoText}>{t.info}</Text>
            </Section>
            <Text style={emailParagraph}>{t.appeal}</Text>
            <Text style={hint}>
              {t.contact}{" "}
              <Link href={supportUrl} style={link}>
                {t.supportLink}
              </Link>
            </Text>
          </Section>
          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}

const infoBox: CSSProperties = {
  backgroundColor: emailColors.warningBg,
  border: `1px solid ${emailColors.warningBorder}`,
  borderRadius: "8px",
  padding: "16px 18px",
  margin: "0 0 24px",
};

const infoText: CSSProperties = {
  color: emailColors.warningText,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

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
