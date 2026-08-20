"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/school-os/logo";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50/60 p-6 select-none">
      <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
        <Logo className="h-12 w-12 mb-1" />
        
        <div className="flex items-center justify-center gap-2.5 pt-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Redirecting…
          </p>
        </div>
      </div>
    </div>
  );
}
