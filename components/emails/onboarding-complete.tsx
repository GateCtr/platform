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
  Hr,
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
  EMAIL_PRIMARY,
  emailCanvas,
  emailCaption,
  emailCard,
  emailColors,
  emailGreeting,
  emailLabelUppercase,
  emailParagraph,
  emailSectionContent,
  emailTitle,
} from "./email-theme";

interface OnboardingCompleteEmailProps {
  name?: string;
  email: string;
  workspaceName: string;
  hasProvider: boolean;
  locale?: EmailLocale;
}

export default function OnboardingCompleteEmail({
  name,
  email,
  workspaceName,
  hasProvider,
  locale = "en",
}: OnboardingCompleteEmailProps) {
  const t = getEmailMessages(locale).onboardingComplete;
  const dashboardUrl = emailAppLocaleUrl(locale, "/dashboard");

  const preview = emailFmt(t.preview, { workspace: workspaceName });
  const body = emailFmt(t.body, { workspace: workspaceName });
  const steps = hasProvider ? t.stepsWithProvider : t.stepsWithoutProvider;

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
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
            <Text style={emailParagraph}>{body}</Text>

            <EmailPrimaryCta href={dashboardUrl}>{t.cta}</EmailPrimaryCta>

            <Hr style={divider} />

            <Text style={sectionLabel}>{t.nextStepsLabel}</Text>
            <Section style={stepsSection}>
              {steps.map((step, i) => (
                <Section key={i} style={stepRow}>
                  <Text style={stepNumber}>{i + 1}</Text>
                  <Section style={stepContent}>
                    <Text style={stepTitle}>{step.title}</Text>
                    <Text style={stepDesc}>{step.description}</Text>
                  </Section>
                </Section>
              ))}
            </Section>

            <Hr style={divider} />
            <Text style={emailCaption}>{t.hint}</Text>
          </Section>

          <EmailFooter locale={locale} email={email} />
        </Container>
      </Body>
    </Html>
  );
}

const divider: CSSProperties = {
  borderColor: emailColors.borderSubtle,
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "32px 0",
};

const sectionLabel: CSSProperties = {
  ...emailLabelUppercase,
  marginBottom: "20px",
};

const stepsSection: CSSProperties = { margin: "0 0 8px" };

const stepRow: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "20px",
};

const stepNumber: CSSProperties = {
  backgroundColor: "#eff6ff",
  color: EMAIL_PRIMARY,
  borderRadius: "999px",
  width: "26px",
  height: "26px",
  fontSize: "12px",
  fontWeight: 700,
  textAlign: "center",
  lineHeight: "26px",
  margin: "0 14px 0 0",
  flexShrink: 0,
};

const stepContent: CSSProperties = { flex: 1 };

const stepTitle: CSSProperties = {
  color: emailColors.text,
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  margin: "0 0 4px",
};

const stepDesc: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};
