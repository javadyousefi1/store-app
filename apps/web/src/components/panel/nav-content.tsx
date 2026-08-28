"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  BookOpenText,
  BookText,
  Boxes,
  ChevronDown,
  Clapperboard,
  GalleryHorizontalEnd,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Newspaper,
  Package,
  Settings2,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useLogout } from "@/hooks/use-auth";

type LinkItem = {
  type: "link";
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type GroupItem = {
  type: "group";
  key: string;
  label: string;
  icon: LucideIcon;
  children: LinkItem[];
};

type NavItem = LinkItem | GroupItem;

const navItems: NavItem[] = [
  {
    type: "link",
    href: "/panel",
    label: "داشبورد",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    type: "group",
    key: "catalog",
    label: "کاتالوگ",
    icon: Boxes,
    children: [
      { type: "link", href: "/panel/products", label: "محصولات", icon: Package },
      { type: "link", href: "/panel/categories", label: "دسته‌بندی‌ها", icon: Tag },
      {
        type: "link",
        href: "/panel/attribute-options",
        label: "ویژگی‌ها",
        icon: Settings2,
      },
    ],
  },
  {
    type: "group",
    key: "sales",
    label: "فروش",
    icon: ShoppingCart,
    children: [
      { type: "link", href: "/panel/orders", label: "سفارشات", icon: ShoppingCart },
      { type: "link", href: "/panel/coupons", label: "کدهای تخفیف", icon: Ticket },
    ],
  },
  {
    type: "group",
    key: "storefront",
    label: "محتوای صفحه اصلی",
    icon: Megaphone,
    children: [
      {
        type: "link",
        href: "/panel/sliders",
        label: "اسلایدر لندینگ",
        icon: GalleryHorizontalEnd,
      },
      {
        type: "link",
        href: "/panel/stories",
        label: "استوری‌ها",
        icon: Clapperboard,
      },
    ],
  },
  {
    type: "group",
    key: "blog",
    label: "مجله",
    icon: Newspaper,
    children: [
      { type: "link", href: "/panel/articles", label: "مقالات", icon: BookText },
      {
        type: "link",
        href: "/panel/article-categories",
        label: "دسته‌بندی مقالات",
        icon: BookOpenText,
      },
    ],
  },
  { type: "link", href: "/panel/users", label: "کاربران", icon: Users },
  {
    type: "link",
    href: "/panel/settings",
    label: "تنظیمات",
    icon: SlidersHorizontal,
  },
];

function isLinkActive(pathname: string, item: LinkItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function NavContent() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  async function handleLogout() {
    await logout.mutateAsync();
    toast.success("خروج موفق");
    router.push("/admin/login");
  }

  return (
    <>
      <SidebarHeader className="px-5 py-4">
        <h1 className="font-bold text-lg text-primary">پنل مدیریت</h1>
        <p className="text-xs text-muted-foreground mt-0.5">فروشگاه آنلاین</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) =>
              item.type === "link" ? (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isLinkActive(pathname, item)}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <NavGroup key={item.key} group={item} pathname={pathname} />
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          <LogOut className="w-4 h-4" />
          خروج از حساب
        </Button>
      </SidebarFooter>
    </>
  );
}

function NavGroup({
  group,
  pathname,
}: {
  group: GroupItem;
  pathname: string;
}) {
  const hasActiveChild = group.children.some((child) =>
    isLinkActive(pathname, child),
  );

  return (
    <Collapsible defaultOpen={hasActiveChild} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <group.icon />
            <span>{group.label}</span>
            <ChevronDown className="mr-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.children.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  isActive={isLinkActive(pathname, child)}
                  render={<Link href={child.href} />}
                >
                  <child.icon />
                  <span>{child.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
