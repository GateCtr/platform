"use client";

import { SignUp } from "@clerk/nextjs";

export function SignUpClient() {
  return <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />;
}
