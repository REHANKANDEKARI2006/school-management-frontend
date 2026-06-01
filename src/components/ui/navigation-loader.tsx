"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loader when pathname or searchParams change (i.e. navigation completes)
  useEffect(() => {
    useGlobalLoaderStore.getState().reset();
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
      }
    };

    // Use capture phase to ensure we catch it before other handlers might stop propagation
    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
