import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WaitlistWelcomeEmailProps {
  name?: string;
  position: number;
  email: string;
}

export default function WaitlistWelcomeEmail({
  name,
  position,
  email,
}: WaitlistWelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Position #${position} on the GateCtr waitlist. We'll email you when your spot opens.`}</Preview>
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
            <Text style={h1}>You&apos;re in. Position #{position}.</Text>
            <Text style={subtext}>
              We&apos;ll email <strong>{email}</strong> when your spot opens.
              No spam. One email.
            </Text>

            {/* Position badge */}
            <Section style={positionBox}>
              <Text style={positionLabel}>YOUR POSITION</Text>
              <Text style={positionNumber}>#{position}</Text>
            </Section>

            <Hr style={dividerLight} />

            {/* Features */}
            <Text style={featuresHeading}>What&apos;s waiting for you</Text>

            <Section style={featureRow}>
              <Text style={featureIcon}>💰</Text>
              <Text style={featureTitle}>Budget Firewall</Text>
              <Text style={featureDesc}>Hard caps. Soft alerts. No surprise invoices.</Text>
            </Section>

            <Section style={featureRow}>
              <Text style={featureIcon}>⚡</Text>
              <Text style={featureTitle}>Context Optimizer</Text>
              <Text style={featureDesc}>-40% tokens. Same output quality.</Text>
            </Section>

            <Section style={featureRow}>
              <Text style={featureIcon}>🎯</Text>
              <Text style={featureTitle}>Model Router</Text>
              <Text style={featureDesc}>GateCtr picks the right LLM. You pay less.</Text>
            </Section>

            <Section style={featureRow}>
              <Text style={featureIcon}>📊</Text>
              <Text style={featureTitle}>Usage Dashboard</Text>
              <Text style={featureDesc}>Every token. Every cost. Real-time.</Text>
            </Section>
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

const positionBox: React.CSSProperties = {
  background: "linear-gradient(135deg, #1B4F82 0%, #00B4C8 100%)",
  borderRadius: "10px",
  padding: "28px",
  textAlign: "center",
  margin: "0 0 0",
};

const positionLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  margin: "0 0 8px",
};

const positionNumber: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "56px",
  fontWeight: "800",
  lineHeight: "1",
  margin: "0",
};

const featuresHeading: React.CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  margin: "0 0 16px",
};

const featureRow: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "14px 16px",
  marginBottom: "8px",
};

const featureIcon: React.CSSProperties = {
  fontSize: "18px",
  margin: "0 0 4px",
  lineHeight: "1",
};

const featureTitle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 2px",
};

const featureDesc: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.5",
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
