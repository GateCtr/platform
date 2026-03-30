import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

/** Clerk `errors[].code` values we surface with dedicated copy. */
const AUTH_ERROR_KEYS = new Set([
  "form_identifier_not_found",
  "form_password_incorrect",
  "form_param_format_invalid",
  "form_password_length_too_short",
  "form_password_pwned",
  "form_code_incorrect",
  "form_param_nil",
  "session_exists",
  "oauth_access_denied",
  "user_locked",
  "captcha_invalid",
  "captcha_missing_token",
]);

export function clerkErrorToTranslationKey(err: unknown): string {
  const code = extractClerkErrorCode(err);
  if (code && AUTH_ERROR_KEYS.has(code)) {
    return code;
  }
  return "generic";
}

export function extractClerkErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  if (isClerkAPIResponseError(err)) {
    return err.errors?.[0]?.code;
  }
  const o = err as { errors?: Array<{ code?: string }> };
  return o.errors?.[0]?.code;
}

export function extractClerkErrorMessage(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const o = err as { errors?: Array<{ message?: string }> };
  return o.errors?.[0]?.message;
}
