import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

interface WaitlistInviteEmailProps {
  name?: string;
  email: string;
  inviteCode: string;
  expiresAt: Date;
  expiryDays: number;
}

export default function WaitlistInviteEmail({
  name,
  email,
  inviteCode,
  expiryDays,
}: WaitlistInviteEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gatectr.com";
  const signupUrl = `${appUrl}/sign-up?invite=${inviteCode}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{`Your GateCtr spot is open. ${expiryDays} days left.`}</Preview>
      <Body style={main}>
        <Container style={container}>

          {/* ── Logo ── */}
          <Section style={logoSection}>
            <Text style={logoText}>Gate<span style={logoAccent}>Ctr</span></Text>
          </Section>

          <Hr style={divider} />

          {/* ── Body ── */}
          <Section style={body}>
            <Text style={greeting}>Hi{name ? ` ${name}` : ""},</Text>
            <Text style={h1}>Your spot is open.</Text>
            <Text style={subtext}>
              Connect in 5 min. Your API key stays yours.
              GateCtr routes, optimizes, and controls — you just save.
            </Text>

            {/* Invite code box */}
            <Section style={inviteBox}>
              <Text style={inviteLabel}>INVITE CODE</Text>
              <Text style={inviteCodeStyle}>{inviteCode}</Text>
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Button href={signupUrl} style={ctaButton}>
                Create your account
              </Button>
            </Section>

            <Text style={orText}>
              Direct link:{" "}
              <Link href={signupUrl} style={link}>
                {signupUrl}
              </Link>
            </Text>

            <Hr style={dividerLight} />

            {/* Steps */}
            <Section style={stepsBox}>
              <Text style={stepsHeading}>5 min setup</Text>
              <Row style={stepRow}>
                <Column style={stepNum}><Text style={stepNumText}>1</Text></Column>
                <Column><Text style={stepText}>Create your account with <strong>{email}</strong></Text></Column>
              </Row>
              <Row style={stepRow}>
                <Column style={stepNum}><Text style={stepNumText}>2</Text></Column>
                <Column><Text style={stepText}>Add your LLM API keys (OpenAI, Anthropic, Mistral…)</Text></Column>
              </Row>
              <Row style={stepRow}>
                <Column style={stepNum}><Text style={stepNumText}>3</Text></Column>
                <Column><Text style={stepText}>Swap your endpoint URL. That&apos;s it.</Text></Column>
              </Row>
            </Section>

            {/* Expiry */}
            <Section style={expiryBox}>
              <Text style={expiryText}>
                Expires in {expiryDays} {expiryDays === 1 ? "day" : "days"}.
              </Text>
            </Section>

            <Text style={hint}>Questions? Reply to this email.</Text>
          </Section>

          <Hr style={divider} />

          {/* ── Footer ── */}
          <Section style={footer}>
            <Text style={footerText}>GateCtr — One gateway. Every LLM.</Text>
            <Text style={footerText}>
              <Link href="https://gatectr.com" style={footerLink}>gatectr.com</Link>
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
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "32px auto",
  maxWidth: "560px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
};

const logoSection: React.CSSProperties = {
  padding: "28px 40px",
};

const logoText: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#1B4F82",
  margin: "0",
  letterSpacing: "-0.5px",
};

const logoAccent: React.CSSProperties = {
  color: "#00B4C8",
};

const divider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "0",
};

const dividerLight: React.CSSProperties = {
  borderColor: "#f1f5f9",
  margin: "24px 0",
};

const body: React.CSSProperties = {
  padding: "36px 40px 32px",
};

const greeting: React.CSSProperties = {
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

const inviteBox: React.CSSProperties = {
  background: "linear-gradient(135deg, #1B4F82 0%, #00B4C8 100%)",
  borderRadius: "10px",
  padding: "24px",
  textAlign: "center",
  margin: "0 0 24px",
};

const inviteLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  margin: "0 0 10px",
};

const inviteCodeStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "30px",
  fontWeight: "700",
  letterSpacing: "4px",
  fontFamily: '"Courier New", Courier, monospace',
  margin: "0",
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
  margin: "0 0 0",
};

const link: React.CSSProperties = {
  color: "#00B4C8",
  textDecoration: "none",
  wordBreak: "break-all",
};

const stepsBox: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "0 0 20px",
};

const stepsHeading: React.CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  margin: "0 0 14px",
};

const stepRow: React.CSSProperties = {
  marginBottom: "8px",
};

const stepNum: React.CSSProperties = {
  width: "24px",
  verticalAlign: "top",
};

const stepNumText: React.CSSProperties = {
  backgroundColor: "#e2e8f0",
  borderRadius: "50%",
  color: "#475569",
  fontSize: "11px",
  fontWeight: "700",
  width: "20px",
  height: "20px",
  lineHeight: "20px",
  textAlign: "center",
  margin: "2px 0 0",
  display: "inline-block",
};

const stepText: React.CSSProperties = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
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

const hint: React.CSSProperties = {
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
