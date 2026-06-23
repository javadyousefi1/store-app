import { Suspense } from "react";
import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StoreHeader />
      <main id="main-content" className="min-h-0 flex-1 md:min-h-svh">
        {children}
      </main>
      <StoreFooter />
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </div>
  );
}
