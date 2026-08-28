"use client";

import { Sidebar as UISidebar } from "@/components/ui/sidebar";
import { NavContent } from "./nav-content";

export function PanelSidebar() {
  return (
    <UISidebar side="right" collapsible="offcanvas">
      <NavContent />
    </UISidebar>
  );
}
