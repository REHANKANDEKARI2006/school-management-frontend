"use client";

import { UserManagementTable } from "@/components/campus-connect/user-management-table";
import RouteGuard from "@/components/auth/RouteGuard";
import { ROLE } from "@/config/roles";

export default function StaffManagementPage() {
  return (
    <RouteGuard allowedRoles={[ROLE.MASTER_ADMIN, ROLE.INSTITUTE_ADMIN]}>
      <div className="p-6 space-y-8">
        <UserManagementTable 
          role_code="TEACHER" 
          title="Teaching Staff" 
          description="Manage teachers and educational instructors."
        />
        
        <UserManagementTable 
          role_code="OFFICE_STAFF" 
          title="Non-Teaching Staff" 
          description="Manage administrative and support staff members."
        />
      </div>
    </RouteGuard>
  );
}
