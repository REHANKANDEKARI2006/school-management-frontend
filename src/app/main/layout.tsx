"use client";

import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SearchProvider } from "@/components/campus-connect/search-provider";
import { SearchInput } from "@/components/campus-connect/search-input";
import { HeaderLogo } from "@/components/campus-connect/logo";
import { MainNav } from "@/components/campus-connect/main-nav";
import { UserNav } from "@/components/campus-connect/user-nav";
import { NotificationBell } from "@/components/campus-connect/notification-bell";
import { SchoolSwitcher } from "@/components/campus-connect/school-switcher";


import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { IdCardSettingsProvider } from "@/components/campus-connect/id-card-settings-provider";
import { FeedbackProvider } from "@/components/campus-connect/feedback-provider";

// 🔐 SESSION IMPORTS
import { useSessionManager } from "@/hooks/useSessionManager";
import SessionPopup from "@/components/session/SessionPopup";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);

  // 🔐 Session control
  const { showPopup, continueSession, logout } = useSessionManager();

  // 🔒 HARD AUTH GUARD (client-side)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setCheckedAuth(true);
  }, [router]);

  // ⛔ Prevent render before auth check
  if (!checkedAuth) {
    return null; // or loader if you want
  }

  return (
    <FeedbackProvider>
      <SearchProvider>
        <IdCardSettingsProvider>
        <SidebarProvider>

          {/* 🔔 SESSION EXPIRY POPUP */}
          {showPopup && (
            <SessionPopup
              onContinue={continueSession}
              onLogout={logout}
            />
          )}

          <div className="min-h-screen w-full flex overflow-hidden">
            {/* SIDEBAR */}
            <Sidebar collapsible="icon">
              <SidebarHeader className="p-0">
                <HeaderLogo />
              </SidebarHeader>

              <SidebarContent>
                <MainNav />
              </SidebarContent>

              <SidebarFooter />
            </Sidebar>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-white px-3 sm:px-6 md:backdrop-blur md:supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger className="shrink-0" />
                {/* Search — takes remaining space on desktop, shows icon on mobile */}
                <SearchInput />
                <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
                   <SchoolSwitcher />
                   <NotificationBell />
                   <UserNav />
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC]">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
        </IdCardSettingsProvider>
      </SearchProvider>
    </FeedbackProvider>
  );
}
