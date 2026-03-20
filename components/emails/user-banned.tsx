import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components";

interface UserBannedEmailProps {
  email: string;
  name?: string;
  reason?: string;
  locale?: "en" | "fr";
}

export default function UserBannedEmail({ email, name, reason, locale = "en" }: UserBannedEmailProps) {
  const c = locale === "fr" ? contentFr : contentEn;
  const supportUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://gatectr.com"}/support`;

  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>GateCtr</Heading>
          </Section>
          <Section style={content}>
            <Text style={greeting}>{name ? `${c.hi} ${name},` : c.hiDefault}</Text>
            <Heading style={h1}>{c.headline}</Heading>
            <Text style={text}>{c.body}</Text>
            {reason && (
              <Section style={reasonBox}>
                <Text style={reasonLabel}>{c.reasonLabel}</Text>
                <Text style={reasonText}>{reason}</Text>
              </Section>
            )}
            <Text style={text}>{c.dataNote}</Text>
            <Text style={hint}>
              {c.contact}{" "}
              <Link href={supportUrl} style={link}>{c.supportLink}</Link>
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>GateCtr — {c.tagline}</Text>
            <Text style={footerText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${email}`} style={footerLink}>
                {c.unsub}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const contentEn = {
  preview: "Your GateCtr account has been permanently banned.",
  hi: "Hi", hiDefault: "Hi,",
  headline: "Your account has been banned.",
  body: "Your GateCtr account has been permanently banned. All active sessions have been terminated and API access has been revoked.",
  reasonLabel: "Reason",
  dataNote: "Your data will be retained for 30 days in accordance with our data retention policy, then permanently deleted.",
  contact: "If you believe this decision is incorrect, contact us at",
  supportLink: "support",
  tagline: "One gateway. Every LLM.",
  unsub: "Unsubscribe",
};

const contentFr = {
  preview: "Votre compte GateCtr a été définitivement banni.",
  hi: "Bonjour", hiDefault: "Bonjour,",
  headline: "Votre compte a été banni.",
  body: "Votre compte GateCtr a été définitivement banni. Toutes les sessions actives ont été terminées et l'accès API a été révoqué.",
  reasonLabel: "Motif",
  dataNote: "Vos données seront conservées 30 jours conformément à notre politique de rétention, puis définitivement supprimées.",
  contact: "Si vous pensez que cette décision est incorrecte, contactez-nous à",
  supportLink: "support",
  tagline: "Une passerelle. Tous les LLMs.",
  unsub: "Se désabonner",
};

const main = { backgroundColor: "#f6f9fc", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif' };
const container = { backgroundColor: "#ffffff", margin: "0 auto", maxWidth: "560px", padding: "0 0 48px" };
const header = { padding: "32px 40px", borderBottom: "1px solid #e6ebf1" };
const logo = { color: "#1B4F82", fontSize: "28px", fontWeight: "700", margin: "0" };
const content = { padding: "40px 40px 0" };
const greeting = { color: "#718096", fontSize: "15px", margin: "0 0 8px" };
const h1 = { color: "#1a1a1a", fontSize: "24px", fontWeight: "700", lineHeight: "1.3", margin: "0 0 20px" };
const text = { color: "#4a5568", fontSize: "15px", lineHeight: "1.7", margin: "0 0 24px" };
const reasonBox = { backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "16px 20px", margin: "0 0 24px" };
const reasonLabel = { color: "#991b1b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 6px" };
const reasonText = { color: "#7f1d1d", fontSize: "14px", lineHeight: "1.6", margin: "0" };
const hint = { color: "#718096", fontSize: "13px", margin: "0" };
const link = { color: "#1B4F82", textDecoration: "underline" };
const footer = { borderTop: "1px solid #e6ebf1", padding: "24px 40px", textAlign: "center" as const };
const footerText = { color: "#a0aec0", fontSize: "12px", lineHeight: "1.6", margin: "0 0 4px" };
const footerLink = { color: "#a0aec0", textDecoration: "underline" };
