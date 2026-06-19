"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus, School, Building, Phone, Mail, MapPin, User, Calendar } from "lucide-react";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SchoolType {
  institute_id: number;
  name: string;
  short_name: string;
  logo_url: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function SchoolSwitcher() {
  const [roleId, setRoleId] = useState<string | null>(null);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [activeSchool, setActiveSchool] = useState<SchoolType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New school form state
  const [form, setForm] = useState({
    school_name: "",
    organization_name: "",
    school_code: "",
    school_email: "",
    school_phone: "",
    school_address: "",
    principal_name: "",
    academic_year: new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString().slice(-2),
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRoleId(localStorage.getItem("role_id"));
    }
  }, []);

  const fetchData = async () => {
    try {
      // Fetch school list
      const schoolsRes = await axios.get("/api/auth/my-schools");
      if (schoolsRes.data?.success) {
        setSchools(schoolsRes.data.schools);
      }

      // Fetch active profile details
      const profileRes = await axios.get("/api/school-profile");
      if (profileRes.data?.success && profileRes.data.data) {
        const p = profileRes.data.data;
        setActiveSchool({
          institute_id: p.id,
          name: p.school_name,
          short_name: p.affiliation_number, // map code
          logo_url: p.logo_url,
        });
      }
    } catch (err) {
      console.error("Failed to load school switcher details:", err);
    }
  };

  useEffect(() => {
    if (roleId === "1") {
      fetchData();
    }
  }, [roleId]);

  if (roleId !== "1") return null;

  const handleSwitch = async (id: number) => {
    try {
      const res = await axios.post("/api/auth/switch-school", { institute_id: id });
      if (res.data?.success) {
        const token = res.data.accessToken;
        const refreshToken = localStorage.getItem("refreshToken");
        const roleIdVal = localStorage.getItem("role_id");
        const userEmail = localStorage.getItem("user_email");
        const userName = localStorage.getItem("user_name");
        
        localStorage.clear();
        
        localStorage.setItem("accessToken", token);
        localStorage.setItem("isAuthenticated", "true");
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (roleIdVal) localStorage.setItem("role_id", roleIdVal);
        if (userEmail) localStorage.setItem("user_email", userEmail);
        if (userName) localStorage.setItem("user_name", userName);

        window.location.reload();
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to switch school.");
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("school_name", form.school_name);
      formData.append("organization_name", form.organization_name);
      formData.append("school_code", form.school_code);
      formData.append("school_email", form.school_email);
      formData.append("school_phone", form.school_phone);
      formData.append("school_address", form.school_address);
      formData.append("principal_name", form.principal_name);
      formData.append("academic_year", form.academic_year);

      if (logoFile) {
        formData.append("file", logoFile);
      }

      const res = await axios.post("/api/auth/setup-school", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        // Reset form and reload
        setForm({
          school_name: "",
          organization_name: "",
          school_code: "",
          school_email: "",
          school_phone: "",
          school_address: "",
          principal_name: "",
          academic_year: new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString().slice(-2),
        });
        setLogoFile(null);
        setDialogOpen(false);
        alert("School created successfully!");
        
        const token = res.data.accessToken;
        const refreshToken = localStorage.getItem("refreshToken");
        const roleIdVal = localStorage.getItem("role_id");
        const userEmail = localStorage.getItem("user_email");
        const userName = localStorage.getItem("user_name");
        
        localStorage.clear();
        
        localStorage.setItem("accessToken", token);
        localStorage.setItem("isAuthenticated", "true");
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (roleIdVal) localStorage.setItem("role_id", roleIdVal);
        if (userEmail) localStorage.setItem("user_email", userEmail);
        if (userName) localStorage.setItem("user_name", userName);

        window.location.reload();
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to create school.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 px-2.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
          >
            <School size={16} className="text-primary shrink-0" />
            {/* Show school name only on sm+ screens */}
            <span className="hidden sm:inline max-w-[130px] truncate">
              {activeSchool?.name || "Select School"}
            </span>
            <ChevronDown size={14} className="text-slate-400 hidden sm:inline" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[240px] rounded-xl shadow-xl border-slate-100 p-1.5">
          <DropdownMenuLabel className="text-xs font-bold text-slate-400 px-2.5 py-1.5">
            Switch Campus
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100 my-1" />
          
          <div className="max-h-[200px] overflow-y-auto">
            {schools.map((school) => (
              <DropdownMenuItem
                key={school.institute_id}
                onClick={() => handleSwitch(school.institute_id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                  activeSchool?.institute_id === school.institute_id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">
                  {school.logo_url ? (
                    <img
                      src={school.logo_url}
                      alt={school.name}
                      className="h-full w-full rounded-md object-cover"
                    />
                  ) : (
                    school.name.charAt(0)
                  )}
                </div>
                <span className="truncate">{school.name}</span>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="bg-slate-100 my-1" />
          
          <DialogTrigger asChild>
            <DropdownMenuItem className="flex items-center gap-2 px-2.5 py-2 text-sm text-primary font-bold hover:bg-primary/5 rounded-lg cursor-pointer transition-colors">
              <Plus size={16} />
              <span>Create New School</span>
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="sm:max-w-[480px] rounded-2xl shadow-2xl p-6 border-slate-100">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building className="text-primary" />
            Create New School
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateSchool} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="switcher_school_name" className="text-sm font-semibold text-slate-700 ml-0.5">
                School Name
              </Label>
              <Input
                id="switcher_school_name"
                type="text"
                required
                placeholder="e.g. Modern Public School"
                value={form.school_name}
                onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="switcher_org_name" className="text-sm font-semibold text-slate-700 ml-0.5">
                Organization/Trust Name
              </Label>
              <Input
                id="switcher_org_name"
                type="text"
                required
                placeholder="e.g. Modern Education Society"
                value={form.organization_name}
                onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="switcher_school_code" className="text-sm font-semibold text-slate-700 ml-0.5">
                  School Code
                </Label>
                <Input
                  id="switcher_school_code"
                  type="text"
                  required
                  placeholder="e.g. MPS1001"
                  value={form.school_code}
                  onChange={(e) => setForm({ ...form, school_code: e.target.value })}
                  className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="switcher_academic_year" className="text-sm font-semibold text-slate-700 ml-0.5">
                  Academic Year
                </Label>
                <Input
                  id="switcher_academic_year"
                  type="text"
                  required
                  placeholder="e.g. 2026-27"
                  value={form.academic_year}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                  className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="switcher_school_email" className="text-sm font-semibold text-slate-700 ml-0.5">
                  School Email
                </Label>
                <Input
                  id="switcher_school_email"
                  type="email"
                  required
                  placeholder="contact@school.com"
                  value={form.school_email}
                  onChange={(e) => setForm({ ...form, school_email: e.target.value })}
                  className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="switcher_school_phone" className="text-sm font-semibold text-slate-700 ml-0.5">
                  School Phone
                </Label>
                <Input
                  id="switcher_school_phone"
                  type="tel"
                  required
                  placeholder="e.g. +91 9999988888"
                  value={form.school_phone}
                  onChange={(e) => setForm({ ...form, school_phone: e.target.value })}
                  className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="switcher_school_address" className="text-sm font-semibold text-slate-700 ml-0.5">
                School Address
              </Label>
              <Input
                id="switcher_school_address"
                type="text"
                required
                placeholder="Enter full address"
                value={form.school_address}
                onChange={(e) => setForm({ ...form, school_address: e.target.value })}
                className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="switcher_principal_name" className="text-sm font-semibold text-slate-700 ml-0.5">
                Principal Name
              </Label>
              <Input
                id="switcher_principal_name"
                type="text"
                required
                placeholder="Enter Principal's name"
                value={form.principal_name}
                onChange={(e) => setForm({ ...form, principal_name: e.target.value })}
                className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="switcher_logo_file" className="text-sm font-semibold text-slate-700 ml-0.5">
                School Logo (Optional)
              </Label>
              <Input
                id="switcher_logo_file"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setLogoFile(e.target.files[0]);
                  }
                }}
                className="h-10 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-lg flex items-center pr-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="h-10 border-slate-200 text-slate-700 font-semibold rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-sm"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create School"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
