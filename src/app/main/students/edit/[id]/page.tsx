"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import RouteGuard from "@/components/auth/RouteGuard";
import { StudentForm, type Student as StudentFormData } from "@/components/campus-connect/student-form";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ADMIN_GROUP, TEACHING_STAFF_GROUP } from "@/config/roles";
import { useToast } from "@/hooks/use-toast";
import { type Student } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StudentEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [bloodGroups, setBloodGroups] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentRes, bloodRes] = await Promise.all([
        axios.get(`/api/students/${id}`),
        axios.get("/api/blood-groups")
      ]);
      
      const data = studentRes.data.data;
      setBloodGroups(bloodRes.data.data);

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
        description: "Failed to load student particulars",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleSubmit = async (values: StudentFormData) => {
    try {
      // Find bg_id from the name
      const bgMatch = bloodGroups.find(bg => bg.blood_group === values.bloodGroup);
      const bgId = bgMatch ? bgMatch.bg_id : 1;

      // Map frontend form values back to backend expectations
      const backendValues = {
        stu_first_name: values.name.split(" ")[0],
        stu_last_name: values.name.split(" ").slice(1).join(" "),
        address: values.address,
        date_of_birth: values.dob,
        bg_id: bgId,
        user_status_id: values.status === "Active" ? 1 : values.status === "Suspended" ? 2 : 3,
        fatherName: values.fatherName,
        motherName: values.motherName,
        primaryContact: values.primaryContact,
        parentEmail: values.parentEmail,
        class_id: values.class_id,
        profile_url: values.avatar,
      };

      await axios.put(`/api/students/${id}`, backendValues);
      toast({ title: "Success", description: "Student update completed successfully" });
      router.push(`/main/students/${id}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update student particulars", variant: "destructive" });
    }
  };

  if (loading) return <PageSkeleton rows={15} />;
  if (!student) return <div className="p-8 text-center text-slate-500 font-bold">Student record not found</div>;

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ...TEACHING_STAFF_GROUP]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10 pt-4">
        
        <div className="flex items-center justify-between">
           <Button 
             variant="ghost" 
             size="sm" 
             className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all gap-2"
             onClick={() => router.back()}
           >
             <ArrowLeft size={14} /> Revert Changes
           </Button>
           
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest bg-blue-50 px-2 py-0.5 rounded">Editing Record</span>
           </div>
        </div>

        <Card className="rounded-[20px] border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
           <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-6 px-8 flex flex-row items-center gap-4">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                <UserCircle2 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-800 tracking-tight">Modify Particulars</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Student ID: #STU-{student.id.padStart(4, "0")}</CardDescription>
              </div>
           </CardHeader>
           <CardContent className="p-8">
              <StudentForm 
                student={student}
                onSubmit={handleSubmit}
              />
           </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
