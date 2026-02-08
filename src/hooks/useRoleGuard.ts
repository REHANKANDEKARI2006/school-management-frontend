"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRoleGuard(allowedRoles: number[]) {
  const router = useRouter();

  useEffect(() => {
    const role = Number(localStorage.getItem("role_id"));

    if (!role || !allowedRoles.includes(role)) {
      router.replace("/main/dashboard");
    }
  }, [allowedRoles, router]);
}
