import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components";

interface UserDeletedEmailProps {
  email: string;
  name?: string;
  locale?: "en" | "fr";
}

export default function UserDeletedEmail({ name, locale = "en" }: UserDeletedEmailProps) {
  const c = locale === "fr" ? contentFr : contentEn;

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
            <Section style={infoBox}>
              <Text style={infoText}>{c.dataNote}</Text>
            </Section>
            <Text style={hint}>
              {c.contact}{" "}
              <Link href="mailto:support@gatectr.com" style={link}>support@gatectr.com</Link>
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>GateCtr — {c.tagline}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const contentEn = {
  preview: "Your GateCtr account has been deleted.",
  hi: "Hi", hiDefault: "Hi,",
  headline: "Your account has been deleted.",
  body: "Your GateCtr account and all associated data have been permanently deleted. All active sessions have been terminated.",
  dataNote: "In accordance with GDPR and our data retention policy, any residual data will be purged within 30 days.",
  contact: "If you did not request this or have questions, contact us at",
  tagline: "One gateway. Every LLM.",
};

const contentFr = {
  preview: "Votre compte GateCtr a été supprimé.",
  hi: "Bonjour", hiDefault: "Bonjour,",
  headline: "Votre compte a été supprimé.",
  body: "Votre compte GateCtr et toutes les données associées ont été définitivement supprimés. Toutes les sessions actives ont été terminées.",
  dataNote: "Conformément au RGPD et à notre politique de rétention, les données résiduelles seront purgées dans les 30 jours.",
  contact: "Si vous n'avez pas demandé cette suppression ou avez des questions, contactez-nous à",
  tagline: "Une passerelle. Tous les LLMs.",
};

const main = { backgroundColor: "#f6f9fc", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif' };
const container = { backgroundColor: "#ffffff", margin: "0 auto", maxWidth: "560px", padding: "0 0 48px" };
const header = { padding: "32px 40px", borderBottom: "1px solid #e6ebf1" };
const logo = { color: "#1B4F82", fontSize: "28px", fontWeight: "700", margin: "0" };
const content = { padding: "40px 40px 0" };
const greeting = { color: "#718096", fontSize: "15px", margin: "0 0 8px" };
const h1 = { color: "#1a1a1a", fontSize: "24px", fontWeight: "700", lineHeight: "1.3", margin: "0 0 20px" };
const text = { color: "#4a5568", fontSize: "15px", lineHeight: "1.7", margin: "0 0 24px" };
const infoBox = { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px 20px", margin: "0 0 24px" };
const infoText = { color: "#4a5568", fontSize: "14px", lineHeight: "1.6", margin: "0" };
const hint = { color: "#718096", fontSize: "13px", margin: "0" };
const link = { color: "#1B4F82", textDecoration: "underline" };
const footer = { borderTop: "1px solid #e6ebf1", padding: "24px 40px", textAlign: "center" as const };
const footerText = { color: "#a0aec0", fontSize: "12px", lineHeight: "1.6", margin: "0 0 4px" };
