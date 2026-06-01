"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { PageSkeleton } from "@/components/ui/skeletons";
import RouteGuard from "@/components/auth/RouteGuard";
import { ROLE } from "@/config/roles";
import { ClassManagementView } from "@/components/campus-connect/class-management-view";

export default function MyClassPage() {
  const [loading, setLoading] = useState(true);
  const [assignedClassId, setAssignedClassId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/auth/profile");
        const profile = res.data.data;
        if (profile.assigned_class_id) {
          setAssignedClassId(profile.assigned_class_id);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <PageSkeleton rows={15} />;

  if (!assignedClassId) {
    return (
      <RouteGuard allowedRoles={[ROLE.TEACHER, ROLE.CLASS_TEACHER]}>
        <div className="p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-slate-200">?</span>
           </div>
           <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">No Class Assigned</h1>
           <p className="text-slate-400 font-medium max-w-xs mx-auto">You are not currently assigned as an official Class Teacher for any group.</p>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={[ROLE.TEACHER, ROLE.CLASS_TEACHER]}>
      <ClassManagementView classId={assignedClassId} hideBackButton={true} />
    </RouteGuard>
  );
}
