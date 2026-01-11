
"use client";

import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar, SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';

export function Logo({ className, showText = true }: { className?: string, showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <GraduationCap className="h-8 w-8 text-primary" />
      {showText && <span className="text-xl font-bold font-headline tracking-tighter">CampusConnect</span>}
    </div>
  );
}

export function HeaderLogo() {
  const { toggleSidebar, state } = useSidebar();
  return (
    <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-2">
      <Button
        variant="ghost"
        className="h-auto p-1 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center focus-visible:ring-0 focus-visible:ring-offset-0"
        onClick={toggleSidebar}
      >
        <Logo showText={state === 'expanded'}/>
      </Button>
      <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
    </div>
  );
}
