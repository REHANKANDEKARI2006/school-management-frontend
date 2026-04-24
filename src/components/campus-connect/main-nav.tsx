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
  Scroll,
  CalendarDays,
  CalendarOff,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import { ROLE, ADMIN_GROUP, ALL_STAFF_GROUP } from "@/config/roles";

/* =========================
   TYPES (IMPORTANT FIX)
========================= */
type RoleAccess = "ALL" | number[] | readonly number[];

type NavItem = {
  href: string;
  label: string;
  icon: any;
  roles: RoleAccess | (() => boolean);
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
    roles: [...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER, ROLE.ADMISSION_OFFICER],
  },
  {
    href: "/main/faculty",
    label: "Faculty",
    icon: Briefcase,
    roles: ADMIN_GROUP,
  },
  {
    href: "/main/classes",
    label: "Classes",
    icon: School,
    roles: [...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER],
  },
  {
    href: "/main/attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    roles: [...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER, ROLE.STUDENT, ROLE.GUARDIAN],
  },
  {
    href: "/main/fees",
    label: "Fees",
    icon: CreditCard,
    roles: [...ADMIN_GROUP, ROLE.CASHIER, ROLE.ACCOUNTANT],
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
    href: "/main/paper-generator",
    label: "Paper Generator",
    icon: Scroll,
    roles: [...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER],
  },
  {
    href: "/main/events",
    label: "Events",
    icon: CalendarPlus,
    roles: "ALL",
  },
  {
    href: "/main/holidays",
    label: "Holidays",
    icon: CalendarDays,
    roles: ADMIN_GROUP,
  },
  {
    href: "/main/leaves",
    label: "Leaves",
    icon: CalendarOff,
    roles: ALL_STAFF_GROUP,
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
  {
    href: "/main/user-management/admins",
    label: "Manage Admins",
    icon: ShieldCheck,
    roles: [ROLE.MASTER_ADMIN],
  },
  {
    href: "/main/user-management/staff",
    label: "Manage Staff",
    icon: UserCog,
    roles: [ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN],
  },
];

const settingsItem: NavItem = {
  href: "/main/settings",
  label: "Settings",
  icon: Settings,
  roles: [...ADMIN_GROUP, ROLE.IT_SUPPORT],
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

  const hasAccess = (roles: RoleAccess | (() => boolean)) => {
    if (typeof roles === "function") return roles();
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
                <Link 
                  href={item.label === "Leaves" && hasAccess(ADMIN_GROUP) ? "/main/leaves/approvals" : item.href} 
                  onClick={handleLinkClick}
                >
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
