
"use client";

import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar, SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';

export interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ className, iconClassName, textClassName, showText = true }: LogoProps) {
  const hasWidth = className?.match(/\bw-\d+\b/);
  const hasHeight = className?.match(/\bh-\d+\b/);

  let containerClass = className || "";
  let extractedIconClass = "";

  if (showText && (hasWidth || hasHeight)) {
    const classes = containerClass.split(" ");
    const iconClasses: string[] = [];
    const containerClasses: string[] = [];

    classes.forEach((c) => {
      if (/^\b(w|h)-\d+\b$/.test(c)) {
        iconClasses.push(c);
      } else {
        containerClasses.push(c);
      }
    });

    containerClass = containerClasses.join(" ");
    extractedIconClass = iconClasses.join(" ");
  }

  return (
    <div className={cn("inline-flex items-center justify-center gap-2.5 select-none shrink-0", containerClass)}>
      <div className={cn("flex items-center justify-center shrink-0 text-primary", extractedIconClass, iconClassName)}>
        <GraduationCap className={cn("h-8 w-8 text-primary", extractedIconClass ? "h-full w-full" : "")} />
      </div>
      {showText && (
        <span className={cn("text-xl font-bold font-headline tracking-tighter text-slate-900 dark:text-white shrink-0", textClassName)}>
          SchoolOS
        </span>
      )}
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
