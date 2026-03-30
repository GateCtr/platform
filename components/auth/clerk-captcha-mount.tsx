/**
 * Placeholder for Clerk Smart CAPTCHA (Cloudflare Turnstile).
 * Must exist in the DOM when signUp.password / signIn.password / signIn.create run
 * if Bot protection is enabled — including during useSignUp/useSignIn init (loading UI).
 *
 * @see https://clerk.com/docs/guides/development/custom-flows/authentication/bot-sign-up-protection
 */
export function ClerkCaptchaMount() {
  return (
    <div
      id="clerk-captcha"
      className="min-h-[2px] w-full shrink-0"
      data-cl-theme="auto"
      data-cl-size="flexible"
      aria-hidden
    />
  );
}
