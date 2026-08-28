"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-card sticky top-0 z-40">
      <h1 className="font-bold text-base text-primary">پنل مدیریت</h1>
      <SidebarTrigger className="h-9 w-9" />
    </header>
  );
}
