"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  TrendingUp,
  Award,
  Printer,
  MoreHorizontal,
  X,
  ChevronRight,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ROLE, ADMIN_GROUP, ALL_STAFF_GROUP } from "@/config/roles";

type RoleAccess = "ALL" | number[] | readonly number[];

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: RoleAccess | (() => boolean);
};

const navItems: NavItem[] = [
  {
    href: "/main/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: "ALL",
  },
  {
    href: "/main/my-class",
    label: "My Class",
    icon: ShieldCheck,
    roles: [ROLE.TEACHER, ROLE.CLASS_TEACHER],
  },
  {
    href: "/main/students",
    label: "Students",
    icon: Users,
    roles: [...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER, ROLE.ADMISSION_OFFICER],
  },
  {
    href: "/main/students/promotion",
    label: "Promotion",
    icon: TrendingUp,
    roles: [ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN, ROLE.CLASS_TEACHER],
  },
  {
    href: "/main/bulk-documents",
    label: "Bulk Documents",
    icon: Printer,
    roles: [...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER],
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
    roles: [ROLE.MASTER_ADMIN],
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
    href: "/main/results",
    label: "Results",
    icon: Award,
    roles: "ALL",
  },
];

const settingsItem: NavItem = {
  href: "/main/settings",
  label: "Settings",
  icon: Settings,
  roles: [ROLE.MASTER_ADMIN, ROLE.IT_SUPPORT],
};

// Target preferred 4 primary tab hrefs
const PREFERRED_PRIMARY_HREFS = [
  "/main/dashboard",
  "/main/students",
  "/main/attendance",
  "/main/fees",
];

export function BottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const roleId = useMemo(() => {
    return typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;
  }, []);

  const hasAccess = useCallback(
    (roles: RoleAccess | (() => boolean)) => {
      if (typeof roles === "function") return roles();
      if (roles === "ALL") return true;
      if (!roleId) return false;
      return roles.includes(roleId);
    },
    [roleId]
  );

  // Accessible items list
  const accessibleItems = useMemo(() => {
    const items = navItems.filter((item) => hasAccess(item.roles));
    if (hasAccess(settingsItem.roles)) {
      items.push(settingsItem);
    }
    return items;
  }, [hasAccess]);

  // Primary 4 tabs + More sheet items
  const { primaryItems, moreItems } = useMemo(() => {
    // Try to pick preferred 4
    const preferred = accessibleItems.filter((item) =>
      PREFERRED_PRIMARY_HREFS.includes(item.href)
    );

    let primary: NavItem[] = [];
    if (preferred.length === 4) {
      // Keep exact order: Dashboard, Students, Attendance, Fees
      primary = PREFERRED_PRIMARY_HREFS.map(
        (href) => preferred.find((p) => p.href === href)!
      ).filter(Boolean);
    } else {
      // Fallback: take top 4 accessible items
      primary = accessibleItems.slice(0, 4);
    }

    const primaryHrefs = new Set(primary.map((p) => p.href));
    const more = accessibleItems.filter((item) => !primaryHrefs.has(item.href));

    return { primaryItems: primary, moreItems: more };
  }, [accessibleItems]);

  const getItemLink = (item: NavItem) => {
    if (item.label === "Leaves" && hasAccess(ADMIN_GROUP)) {
      return "/main/leaves/approvals";
    }
    return item.href;
  };

  const isMoreActive = useMemo(() => {
    return moreItems.some((item) => pathname.startsWith(item.href));
  }, [moreItems, pathname]);

  return (
    <>
      {/* FIXED BOTTOM NAVIGATION BAR (MOBILE ONLY) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0F172A] border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] text-slate-400 select-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
          {primaryItems.map((item) => {
            const linkHref = getItemLink(item);
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={linkHref}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 min-h-[44px] rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-white font-semibold bg-indigo-600/20"
                    : "text-slate-400 hover:text-slate-200 active:scale-95"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? "text-indigo-400 scale-110" : ""
                  }`}
                />
                <span className="text-[10px] font-medium tracking-tight truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* MORE BUTTON */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 min-h-[44px] rounded-xl transition-all duration-200 ${
              isMoreOpen || isMoreActive
                ? "text-white font-semibold bg-indigo-600/20"
                : "text-slate-400 hover:text-slate-200 active:scale-95"
            }`}
          >
            <MoreHorizontal
              className={`h-5 w-5 transition-transform duration-200 ${
                isMoreOpen || isMoreActive ? "text-indigo-400 scale-110" : ""
              }`}
            />
            <span className="text-[10px] font-medium tracking-tight truncate">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* MORE NAVIGATION BOTTOM SHEET */}
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#0F172A] text-slate-100 border-t border-slate-800 rounded-t-3xl p-0 max-h-[85vh] flex flex-col focus:outline-none z-50 [&>button]:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* Header Bar */}
          <div className="pt-3 pb-2 px-6 flex flex-col items-center border-b border-slate-800/80 relative shrink-0">
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1 bg-slate-700/80 rounded-full mb-3" />

            <div className="w-full flex items-center justify-between">
              <SheetHeader className="p-0 text-left">
                <SheetTitle className="text-base font-bold text-white tracking-tight">
                  More Navigation
                </SheetTitle>
              </SheetHeader>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Nav Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-2.5 sm:gap-3">
            {moreItems.map((item) => {
              const linkHref = getItemLink(item);
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={linkHref}
                  onClick={() => setIsMoreOpen(false)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 active:scale-95 text-center aspect-square ${
                    isActive
                      ? "bg-indigo-600/25 text-white border-indigo-500/40 shadow-xs font-semibold"
                      : "bg-slate-800/50 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl mb-1.5 ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium tracking-tight line-clamp-2 leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
