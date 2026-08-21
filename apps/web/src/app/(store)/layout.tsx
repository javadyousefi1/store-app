import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <StoreHeader />
      <main id="main-content" className="min-h-0 flex-1 md:min-h-svh">
        {children}
      </main>
      <StoreFooter />
    </div>
  );
}
