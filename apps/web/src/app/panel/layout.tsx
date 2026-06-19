import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/panel/sidebar";
import { MobileHeader } from "@/components/panel/mobile-header";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get("access_token")) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
