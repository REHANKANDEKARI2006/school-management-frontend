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

/* =========================
   ROLE CONSTANTS
========================= */
const ROLE = {
  MASTER_ADMIN: 1,
  INSTITUTE_ADMIN: 2,
  TEACHER: 3,
  CLASS_TEACHER: 4,
  STUDENT: 18,
  GUARDIAN: 20,
};

/* =========================
   TYPES (IMPORTANT FIX)
========================= */
type RoleAccess = "ALL" | number[];

type NavItem = {
  href: string;
  label: string;
  icon: any;
  roles: RoleAccess;
};

/* =========================
   NAV CONFIG
========================= */
const navItems: NavItem[] = [
  {
    href: "/main/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: "ALL",
  },
  {
    href: "/main/students",
    label: "Students",
    icon: Users,
    roles: [ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN],
  },
  {
    href: "/main/faculty",
    label: "Faculty",
    icon: Briefcase,
    roles: [ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN],
  },
  {
    href: "/main/classes",
    label: "Classes",
    icon: School,
    roles: [
      ROLE.MASTER_ADMIN,
      ROLE.INSTITUTE_ADMIN,
      ROLE.TEACHER,
      ROLE.CLASS_TEACHER,
    ],
  },
  {
    href: "/main/attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    roles: [
      ROLE.MASTER_ADMIN,
      ROLE.INSTITUTE_ADMIN,
      ROLE.TEACHER,
      ROLE.CLASS_TEACHER,
    ],
  },
  {
    href: "/main/fees",
    label: "Fees",
    icon: CreditCard,
    roles: [ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN],
  },
  {
    href: "/main/schedule",
    label: "Schedule",
    icon: Calendar,
    roles: "ALL",
  },
  {
    href: "/main/exams",
    label: "Exams",
    icon: FileText,
    roles: "ALL",
  },
  {
    href: "/main/events",
    label: "Events",
    icon: CalendarPlus,
    roles: "ALL",
  },
  {
    href: "/main/materials",
    label: "Materials",
    icon: BookCopy,
    roles: "ALL",
  },
  {
    href: "/main/notices",
    label: "Notices",
    icon: Megaphone,
    roles: "ALL",
  },
];

const settingsItem: NavItem = {
  href: "/dashboard/settings",
  label: "Settings",
  icon: Settings,
  roles: [ROLE.MASTER_ADMIN],
};

/* =========================
   MAIN NAV COMPONENT
========================= */
export function MainNav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const hasAccess = (roles: RoleAccess) => {
    if (roles === "ALL") return true;
    if (!roleId) return false;
    return roles.includes(roleId);
  };

  return (
    <>
      {/* MAIN MENU */}
      <SidebarMenu>
        {navItems
          .filter((item) => hasAccess(item.roles))
          .map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
                className="justify-start"
              >
                <Link href={item.href} onClick={handleLinkClick}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
      </SidebarMenu>

      {/* SETTINGS (MASTER ADMIN ONLY) */}
      {hasAccess(settingsItem.roles) && (
        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(settingsItem.href)}
              tooltip={settingsItem.label}
              className="justify-start"
            >
              <Link href={settingsItem.href} onClick={handleLinkClick}>
                <settingsItem.icon />
                <span>{settingsItem.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </>
  );
}
