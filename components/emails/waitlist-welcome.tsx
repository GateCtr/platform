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
import { EmailFooter } from "./email-footer";
import { EmailHeaderCard } from "./email-logo";
import { EmailFeatureList } from "./email-primitives";
import {
  EMAIL_ACCENT,
  EMAIL_PRIMARY,
  emailCanvas,
  emailCardProminent,
  emailGreeting,
  emailLabelUppercase,
  emailParagraph,
  emailSectionContentCompact,
  emailTitleLarge,
} from "./email-theme";

interface WaitlistWelcomeEmailProps {
  name?: string;
  position: number;
  email: string;
  locale?: EmailLocale;
}

export default function WaitlistWelcomeEmail({
  name,
  position,
  email,
  locale = "en",
}: WaitlistWelcomeEmailProps) {
  const m = getEmailMessages(locale);
  const t = m.waitlistWelcome;
  const mf = m.marketing.features;
  const wl = m.marketing.waitlistWelcome;

  const preview = emailFmt(t.preview, { position: String(position) });
  const headline = emailFmt(t.headline, { position: String(position) });
  const greeting = name ? emailFmt(t.greetingNamed, { name }) : t.greeting;
  const body = emailFmt(t.body, { email });

  const featureItems = [
    mf.budgetFirewall,
    mf.contextOptimizer,
    mf.modelRouter,
    mf.usageDashboard,
  ];

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

            <Section style={positionBox}>
              <Text style={positionLabel}>{wl.positionLabel}</Text>
              <Text style={positionNumber}>#{position}</Text>
            </Section>

            <Text style={{ ...emailLabelUppercase, marginTop: "32px" }}>
              {wl.featuresHeading}
            </Text>

            <EmailFeatureList items={featureItems} />
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

const positionBox: CSSProperties = {
  background: `linear-gradient(135deg, ${EMAIL_PRIMARY} 0%, ${EMAIL_ACCENT} 100%)`,
  borderRadius: "8px",
  padding: "32px 24px",
  textAlign: "center",
  margin: "8px 0 0",
};

const positionLabel: CSSProperties = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  margin: "0 0 12px",
};

const positionNumber: CSSProperties = {
  color: "#ffffff",
  fontSize: "52px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: "1",
  margin: "0",
};
