"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/campus-connect/logo";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50/50">
      <Logo className="h-16 w-16 mb-4 animate-bounce" />
      <p className="text-slate-500 font-semibold animate-pulse">Redirecting...</p>
    </div>
  );
}
