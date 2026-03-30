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
import {
  emailFmt,
  getEmailMessages,
  type EmailLocale,
} from "@/lib/email-messages";
import { EmailFooter } from "./email-footer";
import { EmailHeaderCard } from "./email-logo";
import { EmailPrimaryCta } from "./email-primitives";
import {
  EMAIL_ACCENT,
  emailCanvas,
  emailCaption,
  emailCardProminent,
  emailColors,
  emailGreeting,
  emailParagraph,
  emailSectionContentCompact,
  emailTitleLarge,
} from "./email-theme";

interface TeamInvitationEmailProps {
  email: string;
  inviteeName?: string;
  inviterName: string;
  teamName: string;
  role: string;
  acceptUrl: string;
  expiryDays?: number;
  locale?: EmailLocale;
}

export default function TeamInvitationEmail({
  email,
  inviteeName,
  inviterName,
  teamName,
  role,
  acceptUrl,
  expiryDays = 7,
  locale = "en",
}: TeamInvitationEmailProps) {
  const t = getEmailMessages(locale).teamInvitation;

  const daysLabel = expiryDays === 1 ? t.day : t.days;
  const preview = emailFmt(t.preview, { inviter: inviterName, team: teamName });
  const greeting = inviteeName
    ? emailFmt(t.greetingNamed, { name: inviteeName })
    : t.greeting;
  const headline = emailFmt(t.headline, { team: teamName });
  const body = emailFmt(t.body, {
    inviter: inviterName,
    team: teamName,
    role,
  });
  const expiry = emailFmt(t.expiry, {
    days: String(expiryDays),
    daysLabel,
  });

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailCanvas}>
        <Container style={emailCardProminent}>
          <EmailHeaderCard />

          <Section style={emailSectionContentCompact}>
            <Text style={emailGreeting}>{greeting}</Text>
            <Heading as="h1" style={emailTitleLarge}>
              {headline}
            </Heading>
            <Text style={emailParagraph}>{body}</Text>

            <EmailPrimaryCta href={acceptUrl}>{t.cta}</EmailPrimaryCta>

            <Text style={orText}>
              {t.directLink}{" "}
              <Link href={acceptUrl} style={link}>
                {acceptUrl}
              </Link>
            </Text>

            <Section style={expiryBox}>
              <Text style={expiryText}>{expiry}</Text>
            </Section>

            <Text style={emailCaption}>{t.hint}</Text>
          </Section>

          <EmailFooter
            locale={locale}
            email={email}
            variant="card"
            showUnsubscribe={false}
          />
        </Container>
      </Body>
    </Html>
  );
}

const orText: CSSProperties = {
  color: emailColors.textCaption,
  fontSize: "12px",
  textAlign: "center",
  margin: "0 0 28px",
};

const link: CSSProperties = {
  color: EMAIL_ACCENT,
  textDecoration: "none",
  wordBreak: "break-all",
};

const expiryBox: CSSProperties = {
  backgroundColor: emailColors.warningBg,
  border: `1px solid ${emailColors.warningBorder}`,
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "0 0 8px",
  textAlign: "center",
};

const expiryText: CSSProperties = {
  color: emailColors.warningText,
  fontSize: "13px",
  fontWeight: 600,
  margin: "0",
};
