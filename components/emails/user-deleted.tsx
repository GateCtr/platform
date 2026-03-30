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

interface UserDeletedEmailProps {
  email: string;
  name?: string;
  locale?: EmailLocale;
}

export default function UserDeletedEmail({
  email,
  name,
  locale = "en",
}: UserDeletedEmailProps) {
  const t = getEmailMessages(locale).userDeleted;
  const layout = getEmailMessages(locale).layout;

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
              <Text style={infoText}>{t.dataNote}</Text>
            </Section>
            <Text style={hint}>
              {t.contact}{" "}
              <Link href={`mailto:${layout.supportEmail}`} style={link}>
                {layout.supportEmail}
              </Link>
            </Text>
          </Section>
          <EmailFooter locale={locale} email={email} showUnsubscribe={false} />
        </Container>
      </Body>
    </Html>
  );
}

const infoBox: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  border: `1px solid ${emailColors.borderSubtle}`,
  borderRadius: "8px",
  padding: "16px 18px",
  margin: "0 0 24px",
};

const infoText: CSSProperties = {
  color: emailColors.textSecondary,
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
