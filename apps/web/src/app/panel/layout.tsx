import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PanelSidebar } from "@/components/panel/sidebar";
import { MobileHeader } from "@/components/panel/mobile-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  if (!cookieStore.get("access_token")) redirect("/admin/login");

  return (
    <TooltipProvider delay={100}>
      <SidebarProvider>
        <PanelSidebar />
        <SidebarInset className="min-w-0 bg-muted/20">
          <MobileHeader />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
