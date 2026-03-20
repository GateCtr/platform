import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components";

interface UserSuspendedEmailProps {
  email: string;
  name?: string;
  locale?: "en" | "fr";
}

export default function UserSuspendedEmail({ email, name, locale = "en" }: UserSuspendedEmailProps) {
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
            <Section style={infoBox}>
              <Text style={infoText}>{c.info}</Text>
            </Section>
            <Text style={text}>{c.appeal}</Text>
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
  preview: "Your GateCtr account has been temporarily suspended.",
  hi: "Hi", hiDefault: "Hi,",
  headline: "Your account has been suspended.",
  body: "Your GateCtr account has been temporarily suspended. You cannot sign in or make API requests during this period.",
  info: "This suspension is temporary. Our team will review your account and contact you within 48 hours.",
  appeal: "If you believe this is a mistake, you can appeal by contacting our support team.",
  contact: "Need help?",
  supportLink: "Contact support",
  tagline: "One gateway. Every LLM.",
  unsub: "Unsubscribe",
};

const contentFr = {
  preview: "Votre compte GateCtr a été temporairement suspendu.",
  hi: "Bonjour", hiDefault: "Bonjour,",
  headline: "Votre compte a été suspendu.",
  body: "Votre compte GateCtr a été temporairement suspendu. Vous ne pouvez pas vous connecter ni effectuer de requêtes API pendant cette période.",
  info: "Cette suspension est temporaire. Notre équipe examinera votre compte et vous contactera dans les 48 heures.",
  appeal: "Si vous pensez qu'il s'agit d'une erreur, vous pouvez faire appel en contactant notre équipe support.",
  contact: "Besoin d'aide ?",
  supportLink: "Contacter le support",
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
const infoBox = { backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "16px 20px", margin: "0 0 24px" };
const infoText = { color: "#92400e", fontSize: "14px", lineHeight: "1.6", margin: "0" };
const hint = { color: "#718096", fontSize: "13px", margin: "0" };
const link = { color: "#1B4F82", textDecoration: "underline" };
const footer = { borderTop: "1px solid #e6ebf1", padding: "24px 40px", textAlign: "center" as const };
const footerText = { color: "#a0aec0", fontSize: "12px", lineHeight: "1.6", margin: "0 0 4px" };
const footerLink = { color: "#a0aec0", textDecoration: "underline" };
