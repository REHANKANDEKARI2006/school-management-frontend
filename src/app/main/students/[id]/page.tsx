"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import RouteGuard from "@/components/auth/RouteGuard";
import { StudentDetails } from "@/components/campus-connect/student-details";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ADMIN_GROUP, TEACHING_STAFF_GROUP } from "@/config/roles";
import { useToast } from "@/hooks/use-toast";
import { type Student } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3 } from "lucide-react";

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;
  const canManage = roleId ? ADMIN_GROUP.includes(roleId) || roleId === 15 : false;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/students/${id}`);
      const data = res.data.data;

      // Map backend fields to frontend Student type
      const mappedStudent: Student = {
        id: String(data.student_id),
        name: `${data.stu_first_name} ${data.stu_last_name}`,
        email: data.email,
        class: `${data.class_name || "N/A"} - ${data.section_name || "N/A"}`,
        class_id: String(data.class_id),
        avatar: data.profile_url,
        fallback: data.stu_first_name?.[0] + data.stu_last_name?.[0],
        status: data.user_status_id === 1 ? "Active" : data.user_status_id === 2 ? "Suspended" : "Withdrawn",
        address: data.address,
        bloodGroup: data.blood_group,
        fatherName: data.father_name,
        motherName: data.mother_name,
        primaryContact: data.primary_contact,
        parentEmail: data.parent_email,
        dob: data.date_of_birth,
        date: data.joined_date,
      };

      setStudent(mappedStudent);
    } catch (error) {
      console.error("Failed to fetch student details:", error);
      toast({
        title: "Error",
        description: "Failed to load student profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleGenerateIdCard = async (s: Student) => {
    try {
      toast({ title: "Generating ID Card", description: "Please wait..." });
      const res = await axios.get(`/api/documents/id-card/${s.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ID_Card_${s.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate ID Card", variant: "destructive" });
    }
  };

  const handleGenerateBonafide = async (s: Student) => {
    try {
      toast({ title: "Generating Bonafide", description: "Please wait..." });
      const res = await axios.get(`/api/documents/bonafide/${s.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bonafide_${s.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate Bonafide", variant: "destructive" });
    }
  };

  const handleGenerateAchievement = async (s: Student) => {
    try {
      toast({ title: "Generating Achievement Certificate", description: "Please wait..." });
      const res = await axios.get(`/api/documents/general-certificate/${s.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Achievement_${s.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate Achievement Certificate", variant: "destructive" });
    }
  };

  const handleGenerateLeavingCertificate = async (s: Student) => {
    try {
      toast({ title: "Generating Leaving Certificate", description: "Please wait..." });
      const res = await axios.get(`/api/documents/leaving-certificate/${s.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Leaving_Certificate_${s.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate Leaving Certificate", variant: "destructive" });
    }
  };

  if (loading) return <PageSkeleton rows={15} />;
  if (!student) return <div className="p-8 text-center text-slate-500 font-bold">Student not found</div>;

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ...TEACHING_STAFF_GROUP]}>
      <div className="space-y-4 animate-in fade-in duration-500 pb-10">
        
        {/* ACTION BAR */}
        <div className="flex items-center justify-between px-8 pt-4">
           <Button 
             variant="ghost" 
             size="sm" 
             className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all gap-2"
             onClick={() => router.back()}
           >
             <ArrowLeft size={14} /> Back to Class
           </Button>
           
           <Button 
             size="sm" 
             className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest h-9 rounded-lg px-4 shadow-sm hover:shadow-md transition-all gap-2"
             onClick={() => router.push(`/main/students/edit/${id}`)}
           >
             <Edit3 size={14} /> Edit Particulars
           </Button>
        </div>

        <StudentDetails 
          student={student}
          onGenerateIdCard={handleGenerateIdCard}
          onGenerateBonafide={handleGenerateBonafide}
          onGenerateLeavingCertificate={handleGenerateLeavingCertificate}
          onGenerateAchievement={handleGenerateAchievement}
          canGenerateIdCard={canManage}
          canGenerateBonafide={canManage}
        />
      </div>
    </RouteGuard>
  );
}
