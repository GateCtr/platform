import { ClerkProvider as ClerkNextJSProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { getClerkLocalization } from "@/lib/clerk-localization";

type ClerkProviderProps = React.ComponentProps<typeof ClerkNextJSProvider> & {
  locale?: string;
};

export function ClerkProvider({
  children,
  appearance,
  locale = "en",
  ...props
}: ClerkProviderProps) {
  return (
    <ClerkNextJSProvider
      localization={getClerkLocalization(locale)}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/onboarding"
      afterSignOutUrl="/sign-in"
      appearance={{
        theme: shadcn,
        ...appearance,
      }}
      {...props}
    >
      {children}
    </ClerkNextJSProvider>
  );
}
