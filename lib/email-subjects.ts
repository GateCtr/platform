import {
  emailFmt,
  getEmailMessages,
  type EmailLocale,
} from "@/lib/email-messages";

type SubjectKey =
  keyof (typeof import("@/messages/en/emails.json"))["subjects"];

export function emailSubject(
  locale: EmailLocale,
  key: SubjectKey,
  vars?: Record<string, string | number | undefined>,
): string {
  const raw = getEmailMessages(locale).subjects[key];
  return vars ? emailFmt(raw, vars) : raw;
}
