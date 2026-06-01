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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Personal Profile
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Manage your identity and professional information within the institution.
        </p>
      </div>

      {/* Profile Header Card */}
      <section>
        <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative shrink-0">
                <Avatar className="h-24 w-24 md:h-28 md:w-28 border shadow-sm">
                  <AvatarImage 
                    src={profile?.profile_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name}`} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-white shadow-sm">
                  <BadgeCheck className="h-3.5 w-3.5 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1 justify-center md:justify-start">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{profile?.name}</h2>
                    <Badge variant="secondary" className="w-fit self-center md:self-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                      {profile?.role_name?.replace(/_/g, " ") || 'Personal Profile'}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-base font-medium">
                    {profile?.email ? (
                      <a href={`mailto:${profile.email}`} className="hover:underline hover:text-blue-600 transition-colors">
                        {profile.email}
                      </a>
                    ) : (
                      "No email"
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  {profile?.role_id !== 18 && (
                    <Button 
                      onClick={() => router.push("/main/profile/settings")}
                      className="rounded-lg px-6 font-bold flex items-center gap-2 shadow-sm transition-all h-10"
                    >
                      Account Settings
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                  {profile?.role_id === 18 && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      View Only Mode
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Info Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { icon: Phone, label: "Contact Number", value: profile?.phone || "No contact info", color: "text-primary", bg: "bg-primary/10" },
          { icon: Droplets, label: "Blood Group", value: profile?.blood_group_name || "Not specified", color: "text-rose-500", bg: "bg-rose-50" },
        ].map((item, i) => (
          <Card key={i} className="shadow-sm border-slate-100 rounded-xl bg-white hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 ${item.bg} ${item.color} rounded-lg`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {item.label === "Contact Number" && profile?.phone ? (
                    <a href={`tel:${profile.phone}`} className="hover:underline hover:text-blue-600 transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Professional & System Details */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Professional Details (Only for Staff/Teachers) */}
        {isTeacher && (
          <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden bg-white flex flex-col">
            <CardHeader className="p-6 border-b bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Professional Details</CardTitle>
                  <CardDescription className="text-xs">Your academic and educational credentials.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Primary Specialization</p>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-base font-bold text-slate-800">{profile?.subject_name || "General Teaching"}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Academic Qualification</p>
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg min-h-[80px]">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                      {profile?.qualification || "No qualification details provided."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Credentials */}
        <Card className={`shadow-sm border-slate-100 rounded-xl overflow-hidden bg-white flex flex-col ${!isTeacher ? 'md:col-span-2' : ''}`}>
          <CardHeader className="p-6 border-b bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">System Credentials</CardTitle>
                <CardDescription className="text-xs">Security and identity verification details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Identity Verification</p>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg group hover:border-primary/20 hover:bg-white transition-all">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-emerald-500">
                      <BadgeCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{profile?.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Full Name</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Institutional Email</p>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg group hover:border-primary/20 hover:bg-white transition-all">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-primary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 break-all">
                        {profile?.email ? (
                          <a href={`mailto:${profile.email}`} className="hover:underline hover:text-blue-600 transition-colors">
                            {profile.email}
                          </a>
                        ) : (
                          "No email"
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Primary Address</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
