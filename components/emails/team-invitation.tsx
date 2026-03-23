import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TeamInvitationEmailProps {
  inviteeName?: string;
  inviterName: string;
  teamName: string;
  role: string;
  acceptUrl: string;
  expiryDays?: number;
  locale?: "en" | "fr";
}

export default function TeamInvitationEmail({
  inviteeName,
  inviterName,
  teamName,
  role,
  acceptUrl,
  expiryDays = 7,
  locale = "en",
}: TeamInvitationEmailProps) {
  const isFr = locale === "fr";

  const preview = isFr
    ? `${inviterName} vous invite à rejoindre ${teamName} sur GateCtr`
    : `${inviterName} invited you to join ${teamName} on GateCtr`;

  const greeting = inviteeName
    ? isFr
      ? `Bonjour ${inviteeName},`
      : `Hi ${inviteeName},`
    : isFr
      ? "Bonjour,"
      : "Hi,";

  const headline = isFr
    ? `Vous avez été invité à rejoindre ${teamName}`
    : `You've been invited to join ${teamName}`;

  const body = isFr
    ? `${inviterName} vous invite à rejoindre l'équipe ${teamName} en tant que ${role}. Connectez-vous en 5 min. Votre clé API reste la vôtre.`
    : `${inviterName} invited you to join the ${teamName} team as ${role}. Connect in 5 min. Your API key stays yours.`;

  const ctaLabel = isFr ? "Accepter l'invitation" : "Accept invitation";

  const expiry = isFr
    ? `Cette invitation expire dans ${expiryDays} ${expiryDays === 1 ? "jour" : "jours"}.`
    : `This invitation expires in ${expiryDays} ${expiryDays === 1 ? "day" : "days"}.`;

  const hint = isFr
    ? "Des questions ? Répondez à cet email."
    : "Questions? Reply to this email.";

  const directLink = isFr ? "Lien direct :" : "Direct link:";

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>
              Gate<span style={logoAccent}>Ctr</span>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Body */}
          <Section style={bodySection}>
            <Text style={greetingStyle}>{greeting}</Text>
            <Text style={h1}>{headline}</Text>
            <Text style={subtext}>{body}</Text>

            {/* CTA */}
            <Section style={ctaSection}>
              <Button href={acceptUrl} style={ctaButton}>
                {ctaLabel}
              </Button>
            </Section>

            <Text style={orText}>
              {directLink}{" "}
              <Link href={acceptUrl} style={link}>
                {acceptUrl}
              </Link>
            </Text>

            <Hr style={dividerLight} />

            {/* Expiry */}
            <Section style={expiryBox}>
              <Text style={expiryText}>{expiry}</Text>
            </Section>

            <Text style={hintStyle}>{hint}</Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>GateCtr — One gateway. Every LLM.</Text>
            <Text style={footerText}>
              <Link href="https://gatectr.com" style={footerLink}>
                gatectr.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f4f7fb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "32px auto",
  maxWidth: "560px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
};

const logoSection: React.CSSProperties = { padding: "28px 40px" };

const logoText: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#1B4F82",
  margin: "0",
  letterSpacing: "-0.5px",
};

const logoAccent: React.CSSProperties = { color: "#00B4C8" };

const divider: React.CSSProperties = { borderColor: "#e2e8f0", margin: "0" };

const dividerLight: React.CSSProperties = {
  borderColor: "#f1f5f9",
  margin: "24px 0",
};

const bodySection: React.CSSProperties = { padding: "36px 40px 32px" };

const greetingStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "15px",
  margin: "0 0 6px",
};

const h1: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "26px",
  fontWeight: "700",
  lineHeight: "1.25",
  margin: "0 0 12px",
};

const subtext: React.CSSProperties = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.65",
  margin: "0 0 28px",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center",
  margin: "0 0 16px",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#1B4F82",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "13px 36px",
  textDecoration: "none",
  display: "inline-block",
};

const orText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  textAlign: "center",
  margin: "0",
};

const link: React.CSSProperties = {
  color: "#00B4C8",
  textDecoration: "none",
  wordBreak: "break-all",
};

const expiryBox: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "6px",
  padding: "11px 16px",
  margin: "0 0 20px",
  textAlign: "center",
};

const expiryText: React.CSSProperties = {
  color: "#92400e",
  fontSize: "13px",
  fontWeight: "600",
  margin: "0",
};

const hintStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  margin: "0",
};

const footer: React.CSSProperties = {
  padding: "20px 40px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0 0 2px",
};

const footerLink: React.CSSProperties = {
  color: "#94a3b8",
  textDecoration: "underline",
};
