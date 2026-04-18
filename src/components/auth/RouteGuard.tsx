"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROLE, RoleId } from "@/config/roles";

interface RouteGuardProps {
  allowedRoles: RoleId[] | number[];
  children: React.ReactNode;
}

export default function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const accessToken =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    const roleIdRaw =
      localStorage.getItem("role_id") ||
      sessionStorage.getItem("role_id");

    const roleId = roleIdRaw ? Number(roleIdRaw) : null;

    // ❌ Not logged in
    if (!accessToken || roleId === null) {
      router.replace("/");
      return;
    }

    // ❌ Role not allowed
    if (!allowedRoles.includes(roleId as RoleId)) {
      router.replace("/unauthorized");
    }
  }, [allowedRoles, router]);

  return <>{children}</>;
}
