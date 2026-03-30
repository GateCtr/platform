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

interface UserBannedEmailProps {
  email: string;
  name?: string;
  reason?: string;
  locale?: EmailLocale;
}

export default function UserBannedEmail({
  email,
  name,
  reason,
  locale = "en",
}: UserBannedEmailProps) {
  const t = getEmailMessages(locale).userBanned;
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
            {reason && (
              <Section style={reasonBox}>
                <Text style={reasonLabel}>{t.reasonLabel}</Text>
                <Text style={reasonText}>{reason}</Text>
              </Section>
            )}
            <Text style={emailParagraph}>{t.dataNote}</Text>
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

const reasonBox: CSSProperties = {
  backgroundColor: emailColors.dangerBg,
  border: `1px solid ${emailColors.dangerBorder}`,
  borderRadius: "8px",
  padding: "16px 18px",
  margin: "0 0 24px",
};

const reasonLabel: CSSProperties = {
  color: "#991b1b",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: "0 0 8px",
};

const reasonText: CSSProperties = {
  color: "#7f1d1d",
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
