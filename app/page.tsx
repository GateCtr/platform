import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { CookieBanner } from "@/components/cookie-banner";
import HomeContent from "./[locale]/page";

// Fallback root page: when next-intl's middleware rewrite cannot run
// (e.g. Replit dev without Clerk keys), this renders the English home page
// directly at "/" so the URL never changes to "/en".
export default async function RootPage() {
  setRequestLocale("en");
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <HomeContent params={Promise.resolve({ locale: "en" })} />
      <CookieBanner />
    </NextIntlClientProvider>
  );
}
