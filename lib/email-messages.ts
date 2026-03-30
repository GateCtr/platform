import type en from "@/messages/en/emails.json";
import emailsEn from "@/messages/en/emails.json";
import emailsFr from "@/messages/fr/emails.json";

export type EmailLocale = "en" | "fr";
export type EmailMessages = typeof en;

export function getEmailMessages(locale: EmailLocale): EmailMessages {
  return (locale === "fr" ? emailsFr : emailsEn) as EmailMessages;
}

/** Interpolate `{key}` placeholders (React Email / transactional copy). */
export function emailFmt(
  template: string,
  vars: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v !== undefined && v !== null ? String(v) : `{${key}}`;
  });
}
