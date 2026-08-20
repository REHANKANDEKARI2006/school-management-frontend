"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeProcesses } = useGlobalLoaderStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset loader when pathname or searchParams change (i.e. navigation completes)
  useEffect(() => {
    useGlobalLoaderStore.getState().reset();
    setIsNavigating(false);
    setProgress(0);
  }, [pathname, searchParams]);

  // Intercept link clicks to trigger loader
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Find the closest anchor tag
      const target = (event.target as HTMLElement).closest("a");
      if (!target || !target.href) return;

      const url = new URL(target.href);
      const isExternal = url.origin !== window.location.origin;
      const isNewTab = target.target === "_blank";
      const isDownload = target.hasAttribute("download");

      // Don't trigger for external links, new tabs, or downloads
      if (isExternal || isNewTab || isDownload) return;

      // Check if it's actually navigating to a new page (or different search params)
      const currentUrl = window.location.pathname + window.location.search;
      const targetUrl = url.pathname + url.search;

      // Also ignore hash changes on the same page
      if (currentUrl === targetUrl && url.hash) return;

      if (currentUrl !== targetUrl) {
        useGlobalLoaderStore.getState().increment();
        setIsNavigating(true);
        setProgress(0);
      }
    };

    // Use capture phase to ensure we catch it before other handlers might stop propagation
    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  // Auto-progress animation while navigating
  useEffect(() => {
    if (!isNavigating && activeProcesses <= 0) return;

    const showBar = isNavigating || activeProcesses > 0;
    if (!showBar) return;

    // Simulate progress
    setProgress(10);
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(50), 300);
    const timer3 = setTimeout(() => setProgress(70), 600);
    const timer4 = setTimeout(() => setProgress(85), 1200);
    const timer5 = setTimeout(() => setProgress(92), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [isNavigating, activeProcesses]);

  const showBar = isNavigating || activeProcesses > 0;

  if (!showBar) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[2.5px]">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
