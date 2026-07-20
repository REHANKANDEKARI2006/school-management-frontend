"use client";

import { useParams } from "next/navigation";
import RouteGuard from "@/components/auth/RouteGuard";
import { ClassManagementView } from "@/components/school-os/class-management-view";
import { ADMIN_GROUP, TEACHING_STAFF_GROUP } from "@/config/roles";

export default function ClassDetailsPage() {
  const { id } = useParams();

  if (!id) return null;

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ...TEACHING_STAFF_GROUP]}>
      <ClassManagementView classId={id as string} />
    </RouteGuard>
  );
}
