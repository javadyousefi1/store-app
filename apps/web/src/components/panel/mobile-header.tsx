"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavContent } from "./nav-content";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-card sticky top-0 z-40">
      <h1 className="font-bold text-base text-primary">پنل مدیریت</h1>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-64 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">منو</SheetTitle>
          <NavContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
