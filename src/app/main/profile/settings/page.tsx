"use client";

import { useEffect, useState, useRef } from "react";
import axios from "@/lib/axios";
import { 
  User, 
  MapPin, 
  Phone,
  Camera,
  Loader2,
  Save,
  Info,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Droplets,
  UploadCloud
} from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfileSettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [qualification, setQualification] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [bgId, setBgId] = useState<string>("");

  // Lists for dropdowns
  const [subjects, setSubjects] = useState<any[]>([]);
  const [bloodGroups, setBloodGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [subRes, bgRes] = await Promise.all([
        axios.get("/api/subjects"),
        axios.get("/api/blood-groups")
      ]);
      if (subRes.data.success) setSubjects(subRes.data.data);
      if (bgRes.data.success) setBloodGroups(bgRes.data.data);
    } catch (error) {
      console.error("Failed to fetch dropdown data", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/auth/profile");
      if (res.data.success) {
        const data = res.data.data;
      console.log("DEBUG: fetchProfile received:", data);
      setProfile(data);
      setFirstName(data.name.split(" ")[0] || "");
      setLastName(data.name.split(" ")[1] || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setProfileUrl(data.profile_url || "");
      setQualification(data.qualification || "");
      setSubjectId(data.subject_id ? String(data.subject_id) : "");
      setBgId(data.bg_id ? String(data.bg_id) : "");
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  const isStudent = profile?.role_id === 18;

  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<any>();
  const imgRef = useRef<HTMLImageElement>(null);

  function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudent) return;

    setSaving(true);
    try {
      const res = await axios.put("/api/auth/update-profile", {
        firstName,
        lastName,
        phone,
        address,
        profileUrl,
        qualification,
        subject_id: subjectId ? parseInt(subjectId) : null,
        bg_id: bgId ? parseInt(bgId) : null
      });
      if (res.data.success) {
        toast({
          title: "Profile Updated",
          description: "Your changes have been saved successfully.",
        });
        
        // Trigger real-time update in other components
        window.dispatchEvent(new Event("profileUpdated"));
        
        fetchProfile();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleConfirmCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");

      try {
        const res = await axios.post("/api/auth/upload-avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data.success) {
          console.log("DEBUG: upload-avatar success, new URL:", res.data.profile_url);
          setProfileUrl(res.data.profile_url);
          setImgSrc("");
          toast({
            title: "Photo Updated",
            description: "Profile picture updated successfully.",
          });
          
          window.dispatchEvent(new Event("profileUpdated"));
          fetchProfile();
        }
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.response?.data?.message || "Error uploading image",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg');
  };

  if (loading) {
    return <PageSkeleton rows={5} />;
  }

  const initials = (profile?.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="relative group">
          {imgSrc ? (
            <div className="flex flex-col items-center gap-4 p-4 border border-dashed border-indigo-200 rounded-xl bg-indigo-50/30">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop profile"
                  src={imgSrc}
                  className="max-h-[300px] w-auto mx-auto rounded-lg shadow-sm"
                  onLoad={(e) => {
                    const { width, height } = e.currentTarget;
                    setCrop(centerAspectCrop(width, height, 1));
                  }}
                />
              </ReactCrop>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  onClick={handleConfirmCrop} 
                  disabled={uploading}
                  className="bg-indigo-600 hover:bg-indigo-700 h-9"
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Photo
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setImgSrc("")} 
                  disabled={uploading}
                  className="h-9"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-slate-100 shadow-sm">
                <AvatarImage 
                  src={profileUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name}`} 
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold bg-indigo-50 text-indigo-600">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!isStudent && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95"
                    title="Change Photo"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-xl font-bold text-slate-900">{profile?.name}</h1>
          <p className="text-sm text-slate-500">{profile?.email}</p>
          <Badge variant="outline" className="mt-2 text-[9px] uppercase font-black tracking-widest border-indigo-100 text-indigo-600">
            {profile?.role_id === 1 ? 'Master Admin' : profile?.role_id === 2 ? 'Admin' : profile?.role_id === 18 ? 'Student' : 'Staff'}
          </Badge>
        </div>
      </div>

      {isStudent && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3 text-amber-900 shadow-sm">
           <Info className="h-5 w-5 text-amber-600 shrink-0" />
           <p className="text-xs font-medium">Students can only view their information. Please contact the administrator to request any profile updates.</p>
        </div>
      )}

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 py-5">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <User className="h-5 w-5 text-indigo-600" />
            Personal Information
          </CardTitle>
          <CardDescription className="text-xs">Update your basic profile details below.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-bold uppercase text-slate-400 tracking-wider">First Name</Label>
                <Input 
                  id="firstName" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isStudent}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-bold uppercase text-slate-400 tracking-wider">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isStudent}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-400 tracking-wider">Registered Email</Label>
              <Input id="email" value={profile?.email} disabled className="h-11 bg-slate-100 border-slate-200 rounded-lg cursor-not-allowed opacity-60 text-slate-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase text-slate-400 tracking-wider">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isStudent}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" 
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold uppercase text-slate-400 tracking-wider">Address</Label>
                <Textarea 
                  id="address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isStudent}
                  className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg py-3 resize-none" 
                  placeholder="Street, City, State, ZIP"
                />
              </div>
            </div>

            {/* Teacher Specific Fields Section */}
            {!isStudent && (
              <div className="pt-6 border-t border-slate-50 space-y-6">
                <div className="flex items-center gap-2 text-indigo-600">
                   <BadgeCheck className="h-4 w-4" />
                   <h3 className="text-sm font-bold uppercase tracking-wider">Professional & Health Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      Specialization (Subject)
                    </Label>
                    <Select value={subjectId} onValueChange={setSubjectId}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-lg">
                        <SelectValue placeholder="Select specialized subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub: any) => (
                          <SelectItem key={sub.subject_id} value={sub.subject_id.toString()}>
                            {sub.subject_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup" className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5" />
                      Blood Group
                    </Label>
                    <Select value={bgId} onValueChange={setBgId}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-lg">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((bg: any) => (
                          <SelectItem key={bg.bg_id} value={bg.bg_id.toString()}>
                            {bg.blood_group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification" className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Educational Qualifications
                  </Label>
                  <Textarea 
                    id="qualification" 
                    value={qualification} 
                    onChange={(e) => setQualification(e.target.value)}
                    className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg py-3 resize-none" 
                    placeholder="E.g. MSc in Mathematics, PhD in Education..."
                  />
                </div>
              </div>
            )}

            {!isStudent && (
              <div className="pt-4 flex justify-end gap-3">
                <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => fetchProfile()}
                    className="rounded-lg h-11 px-6 font-bold"
                >
                    Reset Changes
                </Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-11 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      
      {/* Simple Information Footer */}
      <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
        <BadgeCheck className="h-3 w-3" />
        Official Profile Management System
      </div>
    </div>
  );
}
