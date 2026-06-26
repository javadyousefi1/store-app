"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerAuthModalTrigger } from "@/lib/auth-modal-trigger";

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    registerAuthModalTrigger(() => {
      const from = `${window.location.pathname}${window.location.search}`;
      const target =
        from === "/login"
          ? "/login"
          : `/login?from=${encodeURIComponent(from)}`;
      router.push(target);
    });
  }, [router]);

  return <>{children}</>;
}
