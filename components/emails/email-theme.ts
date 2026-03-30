import type { CSSProperties } from "react";

/** Brand — aligné sur le produit (primary / accent). */
export const EMAIL_PRIMARY = "#1B4F82";
export const EMAIL_ACCENT = "#00B4C8";

/** Palette type « produit » (zinc) — lisibilité maximale dans les clients mail. */
export const emailColors = {
  canvas: "#fafafa",
  surface: "#ffffff",
  border: "#e4e4e7",
  borderSubtle: "#f4f4f5",
  text: "#18181b",
  textSecondary: "#52525b",
  textMuted: "#71717a",
  textCaption: "#a1a1aa",
  danger: "#b91c1c",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  infoBg: "#f4f4f5",
  successBg: "#f0fdf4",
} as const;

/** Fond page (canvas) — comme Stripe / Linear. */
export const emailCanvas: CSSProperties = {
  backgroundColor: emailColors.canvas,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  WebkitFontSmoothing: "antialiased",
};

/** Carte blanche centrée. */
export const emailCard: CSSProperties = {
  backgroundColor: emailColors.surface,
  margin: "40px auto",
  maxWidth: "600px",
  borderRadius: "8px",
  border: `1px solid ${emailColors.border}`,
  overflow: "hidden",
};

/** Variante liste d’attente / invitations : même carte, léger espacement vertical. */
export const emailCardProminent: CSSProperties = {
  ...emailCard,
  margin: "48px auto 40px",
};

/** Zone sous le header (contenu principal). */
export const emailSectionContent: CSSProperties = {
  padding: "40px 48px 48px",
};

export const emailSectionContentCompact: CSSProperties = {
  padding: "32px 40px 40px",
};

/** En-tête marque (logo + séparateur). */
export const emailHeader: CSSProperties = {
  padding: "28px 48px 24px",
  borderBottom: `1px solid ${emailColors.borderSubtle}`,
  backgroundColor: emailColors.surface,
};

export const emailHeaderCompact: CSSProperties = {
  padding: "24px 40px 20px",
  borderBottom: `1px solid ${emailColors.borderSubtle}`,
  backgroundColor: emailColors.surface,
};

export const emailDivider: CSSProperties = {
  borderColor: emailColors.borderSubtle,
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "0",
};

/** Typographie */
export const emailTitle: CSSProperties = {
  color: emailColors.text,
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: "28px",
  margin: "0 0 16px",
};

export const emailTitleLarge: CSSProperties = {
  ...emailTitle,
  fontSize: "24px",
  lineHeight: "32px",
  margin: "0 0 12px",
};

export const emailGreeting: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 8px",
};

export const emailParagraph: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 24px",
};

export const emailCaption: CSSProperties = {
  color: emailColors.textCaption,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "32px 0 0",
};

export const emailLabelUppercase: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: "0 0 12px",
};

/** CTA principal */
export const emailCtaRow: CSSProperties = {
  margin: "8px 0 40px",
};

export const emailButtonPrimary: CSSProperties = {
  backgroundColor: EMAIL_PRIMARY,
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
  border: "none",
};

export const emailButtonDanger: CSSProperties = {
  ...emailButtonPrimary,
  backgroundColor: emailColors.danger,
};

/** Blocs secondaires */
export const emailSurfaceMuted: CSSProperties = {
  backgroundColor: emailColors.infoBg,
  borderRadius: "6px",
  padding: "20px 20px",
  margin: "0 0 24px",
};

export const emailFeatureStack: CSSProperties = {
  margin: "0 0 32px",
};

export const emailFeatureRow: CSSProperties = {
  borderLeft: `3px solid ${EMAIL_PRIMARY}`,
  paddingLeft: "16px",
  marginBottom: "20px",
};

export const emailFeatureTitle: CSSProperties = {
  color: emailColors.text,
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  margin: "0 0 4px",
};

export const emailFeatureDesc: CSSProperties = {
  color: emailColors.textSecondary,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

/** Pied de page */
export const emailFooter: CSSProperties = {
  borderTop: `1px solid ${emailColors.borderSubtle}`,
  padding: "32px 48px 40px",
  backgroundColor: emailColors.surface,
};

export const emailFooterCompact: CSSProperties = {
  borderTop: `1px solid ${emailColors.borderSubtle}`,
  padding: "28px 40px 36px",
  backgroundColor: emailColors.surface,
};

export const emailFooterBrand: CSSProperties = {
  color: emailColors.textMuted,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px",
};

export const emailFooterLegal: CSSProperties = {
  color: emailColors.textCaption,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 12px",
};

export const emailFooterLinks: CSSProperties = {
  color: emailColors.textCaption,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 16px",
};

export const emailFooterTransactional: CSSProperties = {
  color: emailColors.textCaption,
  fontSize: "11px",
  lineHeight: "16px",
  margin: "0",
};

export const emailFooterLink: CSSProperties = {
  color: emailColors.textMuted,
  textDecoration: "underline",
};

/** @deprecated préférer les tokens ci-dessus — alias pour migration */
export const emailMain = emailCanvas;
export const emailContainer = emailCard;
export const emailContainerCard = emailCardProminent;
export const emailContent = emailSectionContent;
export const emailContentCard = emailSectionContentCompact;
export const emailHeaderSimple = emailHeaderCompact;
export const emailHeaderCard = emailHeader;
export const emailH1 = emailTitle;
export const emailH1Large = emailTitleLarge;
export const emailText = emailParagraph;
export const emailHint = emailCaption;
export const emailFooterMuted = emailFooterLegal;
export const emailFooterCard = emailFooterCompact;
