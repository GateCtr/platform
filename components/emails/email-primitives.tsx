import type { ReactNode } from "react";
import { Button, Section, Text } from "@react-email/components";
import type { CSSProperties } from "react";
import {
  EMAIL_PRIMARY,
  emailColors,
  emailButtonPrimary,
  emailButtonDanger,
  emailCtaRow,
} from "./email-theme";

export function EmailPrimaryCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={emailCtaRow}>
      <Button href={href} style={emailButtonPrimary}>
        {children}
      </Button>
    </Section>
  );
}

export function EmailDangerCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={emailCtaRow}>
      <Button href={href} style={emailButtonDanger}>
        {children}
      </Button>
    </Section>
  );
}

interface FeatureLine {
  title: string;
  description: string;
}

export function EmailFeatureList({ items }: { items: FeatureLine[] }) {
  return (
    <Section style={{ margin: "0 0 32px" }}>
      {items.map((item) => (
        <Section key={item.title} style={featureRow}>
          <Text style={featureTitle}>{item.title}</Text>
          <Text style={featureDesc}>{item.description}</Text>
        </Section>
      ))}
    </Section>
  );
}

const featureRow: CSSProperties = {
  borderLeft: `3px solid ${EMAIL_PRIMARY}`,
  paddingLeft: "16px",
  marginBottom: "20px",
};

const featureTitle: CSSProperties = {
  color: emailColors.text,
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  margin: "0 0 4px",
};

const featureDesc: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

export function EmailAlertBanner({
  variant = "warning",
  children,
}: {
  variant?: "warning" | "danger" | "neutral";
  children: ReactNode;
}) {
  const box: CSSProperties =
    variant === "danger"
      ? {
          backgroundColor: emailColors.dangerBg,
          border: `1px solid ${emailColors.dangerBorder}`,
          borderRadius: "6px",
          padding: "14px 16px",
          margin: "0 0 24px",
        }
      : variant === "neutral"
        ? {
            backgroundColor: emailColors.infoBg,
            border: `1px solid ${emailColors.border}`,
            borderRadius: "6px",
            padding: "14px 16px",
            margin: "0 0 24px",
          }
        : {
            backgroundColor: emailColors.warningBg,
            border: `1px solid ${emailColors.warningBorder}`,
            borderRadius: "6px",
            padding: "14px 16px",
            margin: "0 0 24px",
          };

  const textColor =
    variant === "danger"
      ? "#991b1b"
      : variant === "neutral"
        ? emailColors.textSecondary
        : emailColors.warningText;

  return (
    <Section style={box}>
      <Text
        style={{
          color: textColor,
          fontSize: "14px",
          fontWeight: 500,
          margin: "0",
          lineHeight: "22px",
        }}
      >
        {children}
      </Text>
    </Section>
  );
}
