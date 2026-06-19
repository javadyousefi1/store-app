import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StoreHeader />
      <main className="flex-1 min-h-svh">{children}</main>
      <StoreFooter />
    </div>
  );
}
