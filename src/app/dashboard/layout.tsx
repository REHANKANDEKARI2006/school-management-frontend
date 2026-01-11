
"use client";

import type { PropsWithChildren } from "react";
import { SearchProvider } from "@/components/campus-connect/search-provider";
import { SearchInput } from "@/components/campus-connect/search-input";
import { HeaderLogo } from "@/components/campus-connect/logo";
import { MainNav } from "@/components/campus-connect/main-nav";
import { UserNav } from "@/components/campus-connect/user-nav";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { IdCardSettingsProvider } from "@/components/campus-connect/id-card-settings-provider";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SearchProvider>
      <IdCardSettingsProvider>
        <SidebarProvider>
          <div className="min-h-screen w-full flex overflow-hidden">
            <Sidebar collapsible="icon">
              <SidebarHeader className="p-0">
                <HeaderLogo />
              </SidebarHeader>
              <SidebarContent>
                <MainNav />
              </SidebarContent>
              <SidebarFooter>{/* Future footer content can go here */}</SidebarFooter>
            </Sidebar>
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
                <SidebarTrigger className="md:hidden" />
                <SearchInput />
                <UserNav />
              </header>
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </IdCardSettingsProvider>
    </SearchProvider>
  );
}
