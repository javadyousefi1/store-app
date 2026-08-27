import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentCallbackClient } from "./client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// useSearchParams needs a Suspense boundary in Next 16 — see docs.
export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <PaymentCallbackClient />
    </Suspense>
  );
}

function CallbackFallback() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
