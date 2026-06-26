"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  Settings2,
  ShoppingCart,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLogout } from "@/hooks/use-auth";

const navItems = [
  { href: "/panel", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/panel/orders", label: "سفارشات", icon: ShoppingCart },
  { href: "/panel/products", label: "محصولات", icon: Package },
  { href: "/panel/categories", label: "دسته‌بندی‌ها", icon: Tag },
  { href: "/panel/users", label: "کاربران", icon: Users },
  { href: "/panel/attribute-options", label: "ویژگی‌ها", icon: Settings2 },
  { href: "/panel/settings", label: "تنظیمات", icon: SlidersHorizontal },
];

interface Props {
  onNavigate?: () => void;
}

export function NavContent({ onNavigate }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  async function handleLogout() {
    await logout.mutateAsync();
    toast.success("خروج موفق");
    router.push("/admin/login");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4">
        <h1 className="font-bold text-lg text-primary">پنل مدیریت</h1>
        <p className="text-xs text-muted-foreground mt-0.5">فروشگاه آنلاین</p>
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          <LogOut className="w-4 h-4" />
          خروج از حساب
        </Button>
      </div>
    </div>
  );
}
