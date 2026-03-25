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
      allowedRedirectOrigins={[
        "https://app.gatectr.com",
        "https://gatectr.com",
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [process.env.NEXT_PUBLIC_APP_URL]
          : []),
      ]}
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
