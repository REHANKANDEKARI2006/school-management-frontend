"use client";

import { UserManagementTable } from "@/components/campus-connect/user-management-table";
import RouteGuard from "@/components/auth/RouteGuard";
import { ROLE } from "@/config/roles";

export default function AdminsManagementPage() {
  return (
    <RouteGuard allowedRoles={[ROLE.MASTER_ADMIN]}>
      <div className="p-6">
        <UserManagementTable 
          role_code="INSTITUTE_ADMIN" 
          title="Admin Accounts" 
          description="Manage school administrators who have authority over teachers and staff."
        />
      </div>
    </RouteGuard>
  );
}
