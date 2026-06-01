"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page has been consolidated. Staff credential management is now
// part of the Faculty page (/main/faculty).
export default function StaffManagementRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/main/faculty");
  }, [router]);
  return null;
}
