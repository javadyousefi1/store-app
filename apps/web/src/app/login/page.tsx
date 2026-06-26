import { Suspense } from "react";
import { StoreLoginForm } from "@/components/store/store-login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <StoreLoginForm />
    </Suspense>
  );
}
