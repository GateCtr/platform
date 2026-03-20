import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface OnboardingCompleteEmailProps {
  name?: string;
  email: string;
  workspaceName: string;
  hasProvider: boolean;
  locale?: "en" | "fr";
}

export default function OnboardingCompleteEmail({
  name,
  email,
  workspaceName,
  hasProvider,
  locale = "en",
}: OnboardingCompleteEmailProps) {
  const c = locale === "fr" ? contentFr : contentEn;
  const appBase = process.env.NEXT_PUBLIC_APP_URL || "https://app.gatectr.com";
  const dashboardUrl = `${appBase}${locale === "fr" ? "/fr" : ""}/dashboard`;

  return (
    <Html>
      <Head />
      <Preview>{c.preview(workspaceName)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={logo}>GateCtr</Heading>
          </Section>

          <Section style={contentSection}>
            <Text style={greeting}>
              {name ? `${c.hi} ${name},` : c.hiDefault}
            </Text>
            <Heading style={h1}>{c.headline}</Heading>
            <Text style={text}>{c.body(workspaceName)}</Text>

            <Section style={ctaWrap}>
              <Button href={dashboardUrl} style={button}>
                {c.cta}
              </Button>
            </Section>

            <Hr style={divider} />

            {/* Next steps */}
            <Text style={sectionLabel}>{c.nextStepsLabel}</Text>
            <Section style={stepsSection}>
              {(hasProvider ? c.stepsWithProvider : c.stepsWithoutProvider).map(
                (step, i) => (
                  <Section key={i} style={stepRow}>
                    <Text style={stepNumber}>{i + 1}</Text>
                    <Section style={stepContent}>
                      <Text style={stepTitle}>{step.title}</Text>
                      <Text style={stepDesc}>{step.desc}</Text>
                    </Section>
                  </Section>
                ),
              )}
            </Section>

            <Hr style={divider} />
            <Text style={hint}>{c.hint}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>GateCtr — {c.tagline}</Text>
            <Text style={footerText}>
              <Link href="https://gatectr.com" style={footerLink}>
                gatectr.com
              </Link>
              {" · "}
              <Link
                href={`${appBase}/unsubscribe?email=${email}`}
                style={footerLink}
              >
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
  preview: (ws: string) =>
    `${ws} is ready. Your first request is already optimized.`,
  hi: "Hi",
  hiDefault: "Hi,",
  headline: "Setup complete. GateCtr is live.",
  body: (ws: string) =>
    `Your workspace "${ws}" is configured. Every LLM request now goes through GateCtr — optimized, measured, and under budget control.`,
  cta: "Open dashboard",
  nextStepsLabel: "What's next",
  stepsWithProvider: [
    {
      title: "Make your first API call",
      desc: "Swap your endpoint URL. Keep your existing code. Done.",
    },
    {
      title: "Watch the dashboard",
      desc: "Every token, every cost — real-time.",
    },
    {
      title: "Set up a webhook",
      desc: "Get Slack or Teams alerts when you hit 80% of your budget.",
    },
  ],
  stepsWithoutProvider: [
    {
      title: "Connect a provider",
      desc: "Add your OpenAI, Anthropic, or Mistral key in Settings.",
    },
    {
      title: "Make your first API call",
      desc: "Swap your endpoint URL. Keep your existing code.",
    },
    {
      title: "Watch the dashboard",
      desc: "Every token, every cost — real-time.",
    },
  ],
  hint: "Questions? Reply to this email — we read every one.",
  tagline: "One gateway. Every LLM.",
  unsub: "Unsubscribe",
};

const contentFr = {
  preview: (ws: string) =>
    `${ws} est prêt. Votre première requête est déjà optimisée.`,
  hi: "Bonjour",
  hiDefault: "Bonjour,",
  headline: "Configuration terminée. GateCtr est actif.",
  body: (ws: string) =>
    `Votre espace "${ws}" est configuré. Chaque requête LLM passe désormais par GateCtr — optimisée, mesurée, sous contrôle budgétaire.`,
  cta: "Ouvrir le tableau de bord",
  nextStepsLabel: "Prochaines étapes",
  stepsWithProvider: [
    {
      title: "Faites votre premier appel API",
      desc: "Changez l'URL d'endpoint. Gardez votre code. C'est tout.",
    },
    {
      title: "Observez le dashboard",
      desc: "Chaque token, chaque coût — en temps réel.",
    },
    {
      title: "Configurez un webhook",
      desc: "Recevez des alertes Slack ou Teams à 80% de votre budget.",
    },
  ],
  stepsWithoutProvider: [
    {
      title: "Connectez un provider",
      desc: "Ajoutez votre clé OpenAI, Anthropic ou Mistral dans Paramètres.",
    },
    {
      title: "Faites votre premier appel API",
      desc: "Changez l'URL d'endpoint. Gardez votre code.",
    },
    {
      title: "Observez le dashboard",
      desc: "Chaque token, chaque coût — en temps réel.",
    },
  ],
  hint: "Des questions ? Répondez à cet email — nous lisons tout.",
  tagline: "Une passerelle. Tous les LLMs.",
  unsub: "Se désabonner",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif',
};
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "0 0 48px",
  borderRadius: "8px",
};
const headerSection = {
  padding: "32px 40px",
  borderBottom: "1px solid #e6ebf1",
};
const logo = {
  color: "#1B4F82",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0",
};
const contentSection = { padding: "40px 40px 0" };
const greeting = { color: "#718096", fontSize: "15px", margin: "0 0 8px" };
const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 16px",
};
const text = {
  color: "#4a5568",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 24px",
};
const ctaWrap = { margin: "0 0 32px" };
const button = {
  backgroundColor: "#1B4F82",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};
const divider = { borderColor: "#e6ebf1", margin: "24px 0" };
const sectionLabel = {
  color: "#a0aec0",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 16px",
};
const stepsSection = { margin: "0 0 8px" };
const stepRow = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "16px",
};
const stepNumber = {
  backgroundColor: "#EBF4FF",
  color: "#1B4F82",
  borderRadius: "50%",
  width: "24px",
  height: "24px",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center" as const,
  lineHeight: "24px",
  margin: "0 12px 0 0",
  flexShrink: 0,
};
const stepContent = { flex: 1 };
const stepTitle = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 2px",
};
const stepDesc = {
  color: "#718096",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
};
const hint = { color: "#a0aec0", fontSize: "13px", margin: "0" };
const footer = {
  borderTop: "1px solid #e6ebf1",
  padding: "24px 40px",
  textAlign: "center" as const,
};
const footerText = {
  color: "#a0aec0",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0 0 4px",
};
const footerLink = { color: "#a0aec0", textDecoration: "underline" };
