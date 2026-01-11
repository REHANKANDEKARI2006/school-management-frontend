
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  School,
  ClipboardCheck,
  Calendar,
  FileText,
  CalendarPlus,
  BookCopy,
  Megaphone,
  Settings,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/students", icon: Users, label: "Students" },
  { href: "/dashboard/faculty", icon: Briefcase, label: "Faculty" },
  { href: "/dashboard/classes", icon: School, label: "Classes" },
  { href: "/dashboard/attendance", icon: ClipboardCheck, label: "Attendance" },
  { href: "/dashboard/fees", icon: CreditCard, label: "Fees" },
  { href: "/dashboard/schedule", icon: Calendar, label: "Schedule" },
  { href: "/dashboard/exams", icon: FileText, label: "Exams" },
  { href: "/dashboard/events", icon: CalendarPlus, label: "Events" },
  { href: "/dashboard/materials", icon: BookCopy, label: "Materials" },
  { href: "/dashboard/notices", icon: Megaphone, label: "Notices" },
];

const settingsItem = { href: "/dashboard/settings", icon: Settings, label: "Settings" };

export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <>
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href)
            }
            className="justify-start"
            tooltip={item.label}
          >
            <Link href={item.href} onClick={handleLinkClick}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
     <SidebarMenu className="mt-auto">
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(settingsItem.href)}
                className="justify-start"
                tooltip={settingsItem.label}
            >
                <Link href={settingsItem.href} onClick={handleLinkClick}>
                    <settingsItem.icon />
                    <span>{settingsItem.label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    </SidebarMenu>
    </>
  );
}
