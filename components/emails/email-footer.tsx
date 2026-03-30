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
} from "./email-theme";

interface EmailFooterProps {
  locale: EmailLocale;
  email: string;
  showUnsubscribe?: boolean;
  variant?: "default" | "card";
}

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
