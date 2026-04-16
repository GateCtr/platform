import { Link, Section, Text } from "@react-email/components";
import {
  emailFmt,
  getEmailMessages,
  type EmailLocale,
} from "@/lib/email-messages";
import {
  emailAppUrl,
  emailMarketingBase,
  emailMarketingLocaleUrl,
} from "@/lib/email-urls";
import {
  emailFooter,
  emailFooterBrand,
  emailFooterCompact,
  emailFooterLegal,
  emailFooterLink,
  emailFooterLinks,
  emailFooterTransactional,
  emailColors,
} from "./email-theme";

interface EmailFooterProps {
  locale: EmailLocale;
  email: string;
  showUnsubscribe?: boolean;
  variant?: "default" | "card";
}

/**
 * EmailFooter — footer complet pour les emails transactionnels envoyés aux utilisateurs.
 * Inclut branding, copyright, liens légaux, lien de désinscription.
 * Usage : welcome, billing, onboarding, admin actions.
 */
export function EmailFooter({
  locale,
  email,
  showUnsubscribe = true,
  variant = "default",
}: EmailFooterProps) {
  const t = getEmailMessages(locale);
  const year = String(new Date().getFullYear());

  const privacyUrl = emailMarketingLocaleUrl(locale, "/privacy");
  const termsUrl = emailMarketingLocaleUrl(locale, "/terms");
  const unsubscribeHref = `${emailAppUrl("/unsubscribe")}?email=${encodeURIComponent(email)}`;

  const wrapStyle = variant === "card" ? emailFooterCompact : emailFooter;

  return (
    <Section style={wrapStyle}>
      <Text style={emailFooterBrand}>
        <span style={{ fontWeight: 600, color: "#52525b" }}>
          {t.brand.productName}
        </span>
        <span style={{ color: "#a1a1aa" }}> · </span>
        <span style={{ color: "#71717a" }}>{t.brand.tagline}</span>
      </Text>

      <Text style={emailFooterLegal}>
        {emailFmt(t.layout.copyright, { year })}
      </Text>

      <Text style={emailFooterLinks}>
        <Link href={emailMarketingBase()} style={emailFooterLink}>
          {t.layout.websiteLabel}
        </Link>
        <span style={{ color: "#d4d4d8" }}> · </span>
        <Link href={privacyUrl} style={emailFooterLink}>
          {t.layout.privacyLabel}
        </Link>
        <span style={{ color: "#d4d4d8" }}> · </span>
        <Link href={termsUrl} style={emailFooterLink}>
          {t.layout.termsLabel}
        </Link>
        {showUnsubscribe && (
          <>
            <span style={{ color: "#d4d4d8" }}> · </span>
            <Link href={unsubscribeHref} style={emailFooterLink}>
              {t.layout.unsubscribe}
            </Link>
          </>
        )}
      </Text>

      <Text style={emailFooterTransactional}>
        {emailFmt(t.layout.footerTransactional, {
          support: t.layout.supportEmail,
        })}
      </Text>
    </Section>
  );
}

/**
 * EmailFooterMinimal — footer épuré pour les emails directs (inbox/outbox admin).
 * Juste l'identité de l'expéditeur + adresse de réponse. Pas de légal, pas de désinscription.
 * Usage : réponses aux clients, emails composés depuis l'inbox admin.
 */
export function EmailFooterMinimal({
  fromName = "GateCtr",
  replyEmail,
}: {
  fromName?: string;
  replyEmail?: string;
}) {
  const email =
    replyEmail ?? process.env.INBOX_FROM_EMAIL ?? "hello@gatectr.com";

  return (
    <Section
      style={{
        borderTop: `1px solid ${emailColors.borderSubtle}`,
        padding: "20px 48px 28px",
      }}
    >
      <Text
        style={{
          color: emailColors.textCaption,
          fontSize: "12px",
          lineHeight: "18px",
          margin: "0",
        }}
      >
        <span style={{ fontWeight: 600, color: emailColors.textMuted }}>
          {fromName}
        </span>
        <span style={{ color: "#d4d4d8" }}> · </span>
        <Link
          href={`mailto:${email}`}
          style={{ color: emailColors.textMuted, textDecoration: "none" }}
        >
          {email}
        </Link>
      </Text>
    </Section>
  );
}

/**
 * EmailFooterMarketing — footer pour les campagnes et annonces (launch, outreach).
 * Inclut branding complet + lien de désinscription obligatoire.
 * Usage : launch announcement, mass email, outreach sequences.
 */
export function EmailFooterMarketing({
  locale,
  email,
}: {
  locale: EmailLocale;
  email: string;
}) {
  const t = getEmailMessages(locale);
  const year = String(new Date().getFullYear());
  const privacyUrl = emailMarketingLocaleUrl(locale, "/privacy");
  const unsubscribeHref = `${emailAppUrl("/unsubscribe")}?email=${encodeURIComponent(email)}`;

  return (
    <Section style={emailFooter}>
      <Text style={emailFooterBrand}>
        <span style={{ fontWeight: 600, color: "#52525b" }}>
          {t.brand.productName}
        </span>
        <span style={{ color: "#a1a1aa" }}> · </span>
        <span style={{ color: "#71717a" }}>{t.brand.tagline}</span>
      </Text>

      <Text style={emailFooterLegal}>
        {emailFmt(t.layout.copyright, { year })}
      </Text>

      <Text style={emailFooterLinks}>
        <Link href={emailMarketingBase()} style={emailFooterLink}>
          {t.layout.websiteLabel}
        </Link>
        <span style={{ color: "#d4d4d8" }}> · </span>
        <Link href={privacyUrl} style={emailFooterLink}>
          {t.layout.privacyLabel}
        </Link>
        <span style={{ color: "#d4d4d8" }}> · </span>
        <Link href={unsubscribeHref} style={emailFooterLink}>
          {t.layout.unsubscribe}
        </Link>
      </Text>
    </Section>
  );
}
