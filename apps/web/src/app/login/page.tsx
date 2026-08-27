import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreLoginForm } from "@/components/store/store-login-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <StoreLoginForm />
    </Suspense>
  );
}
