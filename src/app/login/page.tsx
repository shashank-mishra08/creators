import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Log in",
  // Auth pages carry no search value and shouldn't be indexed.
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <AuthScreen initialMode="login" />;
}
