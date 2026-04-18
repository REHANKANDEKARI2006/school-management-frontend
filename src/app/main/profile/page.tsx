"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Droplets
} from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    
    // Listen for profile updates
    window.addEventListener("profileUpdated", fetchProfile);
    return () => window.removeEventListener("profileUpdated", fetchProfile);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/auth/profile");
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageSkeleton rows={5} />;
  }

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const isTeacher = profile?.role_id !== 18 && profile?.role_id !== 1 && profile?.role_id !== 2 && profile?.role_id !== 20;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Original Header Structure */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="relative">
          <Avatar className="h-28 w-28 border-4 border-slate-50 shadow-sm">
            <AvatarImage 
              src={profile?.profile_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name}`} 
              className="object-cover"
            />
            <AvatarFallback className="text-3xl font-bold bg-indigo-50 text-indigo-600">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-white shadow-sm">
            <BadgeCheck className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="text-center md:text-left flex-grow">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{profile?.name}</h1>
            <Badge variant="outline" className="w-fit self-center md:self-auto text-[10px] uppercase font-bold tracking-widest border-indigo-100 bg-indigo-50/30 text-indigo-600">
              {profile?.role_id === 1 ? 'Master Admin' : profile?.role_id === 2 ? 'Admin' : 'Personal Profile'}
            </Badge>
          </div>
          <p className="text-slate-500 text-sm font-medium">{profile?.email}</p>
          <div className="mt-4">
            {profile?.role_id !== 18 && (
              <Button 
                  onClick={() => router.push("/main/profile/settings")}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 flex items-center gap-2 shadow-sm"
              >
                  Account Settings
                  <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {profile?.role_id === 18 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold">
                 <ShieldCheck className="h-4 w-4" />
                 View Only Mode
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Location</p>
              <p className="font-bold text-slate-800 line-clamp-1">{profile?.address || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Contact</p>
              <p className="font-bold text-slate-800">{profile?.phone || "No contact info"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Blood Group</p>
              <p className="font-bold text-slate-800">{profile?.blood_group_name || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Professional Profile Section */}
      {isTeacher && (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 py-5">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Teacher Professional Details
            </CardTitle>
            <CardDescription className="text-xs">Your academic specializations and qualifications within the system.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <p className="text-[10px] uppercase font-black tracking-wider">Primary Specialization</p>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{profile?.subject_name || "General Teaching"}</p>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-emerald-600">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="text-xs font-bold">Verified Professional Record</p>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed">
                     Your profile is synchronized with the school's central database. Any changes made here are reflected across all administrative modules.
                   </p>
                </div>
              </div>

              <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 mb-2">
                    <GraduationCap className="h-5 w-5" />
                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Educational Qualifications</h3>
                  </div>
                  <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-50 min-h-[120px]">
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                      {profile?.qualification || "No qualification details provided."}
                    </p>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Academic Profile Section (Base Info) */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 py-5">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <User className="h-5 w-5 text-indigo-600" />
            System Credentials
          </CardTitle>
          <CardDescription className="text-xs">Registered system information and credentials.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Legal Name</p>
                 <p className="font-semibold text-slate-800">{profile?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Registered Email</p>
                <p className="font-semibold text-slate-800 break-all">{profile?.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
