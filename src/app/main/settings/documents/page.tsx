"use client";

import React, { useEffect, useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { 
  Loader2, 
  UploadCloud, 
  Save, 
  Layout, 
  FileCheck, 
  ChevronRight,
  User,
  GraduationCap,
  CreditCard,
  Palette,
  Settings as SettingsIcon,
  CheckCircle2
} from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";
import axios from "@/lib/axios";
import { toast } from "sonner";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DocumentEditor } from "@/components/campus-connect/id-card-editor";
import type { DocumentType } from "@/components/campus-connect/id-card-editor/types";


const schoolProfileSchema = z.object({
  school_name: z.string().min(1, "School Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  affiliation_number: z.string().optional(),
  principal_name: z.string().optional(),
  primary_color: z.string().optional(),
  academic_year: z.string().optional(),
  logo_url: z.string().optional(),
  signature_url: z.string().optional(),
  selected_id_card_template: z.string().optional(),
  selected_bonafide_template: z.string().optional(),
  selected_mark_sheet_template: z.string().optional(),
  selected_general_certificate_template: z.string().optional(),
  secondary_logo_url: z.string().optional(),
  stamp_url: z.string().optional(),
  header_layout_type: z.enum(["LEFT", "CENTER", "DUAL"]).default("LEFT"),
  footer_text: z.string().optional(),
  show_watermark: z.boolean().default(false),
  school_type: z.string().optional(),
  accreditation_line: z.string().optional(),
  website_url: z.string().optional(),
  header_bg_color: z.string().optional(),
  header_text_color: z.string().optional(),
  separator_style: z.string().optional(),
  separator_color: z.string().optional(),
  separator_thickness: z.number().optional(),
  footer_bg_color: z.string().optional(),
  footer_text_color: z.string().optional(),
  footer_left_text: z.string().optional(),
  footer_right_text: z.string().optional(),
  page_number_format: z.string().optional(),
  show_generation_date: z.boolean().default(true),
  cashier_signature_url: z.string().optional(),
  document_config: z.record(z.any()).optional(),
  id_card_config: z.any().optional(),
  bonafide_config: z.any().optional(),
  achievement_config: z.any().optional(),
});

type FormData = z.infer<typeof schoolProfileSchema>;

export default function DocumentSettingsPage() {
  const [activeEditor, setActiveEditor] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [logoUploading, setLogoUploading] = useState(false);
  const [secondaryLogoUploading, setSecondaryLogoUploading] = useState(false);
  const [stampUploading, setStampUploading] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const secondaryLogoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: {
      school_name: "",
      address: "",
      phone: "",
      email: "",
      affiliation_number: "",
      principal_name: "",
      primary_color: "#437ef1",
      academic_year: "",
      logo_url: "",
      signature_url: "",
      selected_id_card_template: "template1",
      selected_bonafide_template: "template1",
      selected_mark_sheet_template: "template1",
      selected_general_certificate_template: "template1",
      secondary_logo_url: "",
      stamp_url: "",
      header_layout_type: "LEFT",
      footer_text: "",
      show_watermark: false,
      document_config: {},
      id_card_config: {},
      bonafide_config: {},
      achievement_config: {}
    },
  });

  useEffect(() => {
    checkAccess();
    fetchProfile();
  }, []);

  const checkAccess = () => {
    const roleId = Number(localStorage.getItem("role_id"));
    const allowedRoles = [1, 2, 10, 11, 16, 17, 21];
    if (!allowedRoles.includes(roleId)) {
      toast.error("You do not have permission to access Document Branding settings.");
      window.location.href = "/main/dashboard";
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/school-profile");
      if (res.data.success && res.data.data) {
        form.reset(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching school profile:", error);
      toast.error("Failed to load school profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      const res = await axios.put("/api/school-profile", data);
      if (res.data.success) {
        toast.success("Branding configuration updated successfully");
        if (res.data.data) form.reset(res.data.data);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'secondary_logo' | 'stamp' | 'signature') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    let setUploading: (v: boolean) => void;
    let endpoint: string;
    let fieldName: keyof FormData;

    switch (type) {
      case 'logo': setUploading = setLogoUploading; endpoint = "/api/school-profile/upload-logo"; fieldName = "logo_url"; break;
      case 'secondary_logo': setUploading = setSecondaryLogoUploading; endpoint = "/api/school-profile/upload-secondary-logo"; fieldName = "secondary_logo_url"; break;
      case 'stamp': setUploading = setStampUploading; endpoint = "/api/school-profile/upload-stamp"; fieldName = "stamp_url"; break;
      case 'signature': setUploading = setSignatureUploading; endpoint = "/api/school-profile/upload-signature"; fieldName = "signature_url"; break;
    }

    try {
      setUploading(true);
      const res = await axios.post(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data.success) {
        form.setValue(fieldName, res.data.data.url, { shouldValidate: true });
        toast.success(`Success! ${type.replace('_', ' ')} updated.`);
      }
    } catch (error) {
      toast.error(`Failed to upload ${type.replace('_', ' ')}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const mapBrandingForEditor = () => {
    const vals = form.getValues();
    return {
      schoolName: vals.school_name,
      address: vals.address,
      phone: vals.phone,
      logoUrl: vals.logo_url,
      secondaryLogoUrl: vals.secondary_logo_url,
      signatureUrl: vals.signature_url,
      stampUrl: vals.stamp_url,
      primaryColor: vals.primary_color || "#437ef1",
      academicYear: vals.academic_year || "2025-26",
    };
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 overflow-x-hidden">
      <div className="relative pt-12 pb-20 px-4 md:px-6 lg:px-12 overflow-hidden bg-slate-900">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
        
        <div className="relative max-w-7xl mx-auto space-y-2">
          <div className="flex items-center gap-3 text-primary-foreground/60 mb-4">
             <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl"><SettingsIcon className="h-4 w-4" /></div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Institutional Settings</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight flex items-center gap-4">
            Document Branding
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-black px-3 py-1">Engine v2.1</Badge>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-2xl leading-relaxed">
            Craft a professional institutional identity that applies across all official documents, certificates, and student credentials.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 -mt-10 relative z-10">
        <Form {...form}>
          <form className="space-y-10" onSubmit={form.handleSubmit(onSubmit)}>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden ring-1 ring-slate-100">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="pb-8 pt-10 px-10">
                  <CardTitle className="text-2xl font-black flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl"><User className="h-6 w-6 text-primary" /></div>
                    School Identity
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Verify your school's official identification details used in document headers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 px-10 pb-12">
                  <FormField control={form.control} name="school_name" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Institution Name</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. Cambridge International High School" className="h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl text-lg px-6 font-bold" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="affiliation_number" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Board Affiliation / Code</FormLabel>
                        <FormControl><Input {...field} placeholder="CBSE/10293/2024" className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-md px-5 font-bold" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="academic_year" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Academic Session</FormLabel>
                        <FormControl><Input {...field} placeholder="2025-26" className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-md px-5 font-bold" /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Campus Physical Address</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Full address for certificates..." className="min-h-[100px] bg-slate-50 border-slate-100 rounded-2xl text-md p-6 font-semibold leading-relaxed" /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden ring-1 ring-slate-100">
                 <div className="h-2 bg-amber-500 w-full" />
                 <CardHeader className="pt-10 px-8">
                   <CardTitle className="text-xl font-black flex items-center gap-4">
                     <div className="p-3 bg-amber-50 rounded-2xl"><Palette className="h-6 w-6 text-amber-500" /></div>
                     Theme Palette
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="px-8 pb-10 space-y-10">
                    <FormField control={form.control} name="primary_color" render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-400">Institutional Color</FormLabel>
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <FormControl><Input type="color" {...field} className="w-16 h-16 p-1 rounded-2xl cursor-pointer border-none shadow-inner" /></FormControl>
                              <Input {...field} className="h-14 font-mono font-bold text-center bg-slate-50 border-slate-100 rounded-2xl flex-1 text-lg" />
                           </div>
                           <div className="grid grid-cols-5 gap-2">
                              {["#437ef1", "#e11d48", "#059669", "#7c3aed", "#d97706"].map(c => (
                                <button key={c} type="button" onClick={() => field.onChange(c)} className={`aspect-square rounded-xl border-2 transition-transform hover:scale-110 ${field.value === c ? 'border-amber-500' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                              ))}
                           </div>
                        </div>
                      </FormItem>
                    )} />
                    <Separator className="bg-slate-100" />
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Visibility Status</h4>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-bold text-slate-700">Profile Verified</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">All branding changes are applied globally to 12 document types upon saving.</p>
                      </div>
                    </div>
                 </CardContent>
              </Card>
            </div>

            {/* Asset Library Section - High Polish */}
            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white rounded-[3rem] overflow-hidden transition-all hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.15)] ring-1 ring-slate-100">
               <div className="h-2 bg-gradient-to-r from-indigo-500 to-primary w-full" />
               <CardHeader className="pt-12 px-12 pb-10 flex flex-row items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-4 text-slate-900">
                      <div className="p-3.5 bg-indigo-50 rounded-[1.5rem]"><UploadCloud className="h-7 w-7 text-indigo-500" /></div>
                      Asset Library
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold text-lg max-w-xl">
                      Manage institutional imagery used for official authentication, stamps, and watermarks across all generated documents.
                    </CardDescription>
                  </div>
                  
                  {/* Persist Action - Integrated into the header for quick access */}
                  <div className="hidden lg:block">
                    <Button 
                      type="button" 
                      onClick={form.handleSubmit(onSubmit)} 
                      disabled={saving}
                      className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-200 gap-3 group transition-all active:scale-95"
                    >
                      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 group-hover:scale-110 transition-transform" /> }
                      {saving ? "Syncing..." : "Update Institutional Engine"}
                    </Button>
                  </div>
               </CardHeader>
               
               <CardContent className="px-12 pb-14">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <AssetUploader label="Primary Logo" field="logo_url" uploading={logoUploading} inputRef={logoInputRef} onUpload={(e: any) => handleFileUpload(e, 'logo')} currentUrl={form.watch("logo_url")} description="Main header logo" />
                    <AssetUploader label="Secondary Logo" field="secondary_logo_url" uploading={secondaryLogoUploading} inputRef={secondaryLogoInputRef} onUpload={(e: any) => handleFileUpload(e, 'secondary_logo')} currentUrl={form.watch("secondary_logo_url")} description="Trust/Board logo" />
                    <AssetUploader label="Head Signature" field="signature_url" uploading={signatureUploading} inputRef={signatureInputRef} onUpload={(e: any) => handleFileUpload(e, 'signature')} currentUrl={form.watch("signature_url")} description="Principal's sign" />
                    <AssetUploader label="Official Stamp" field="stamp_url" uploading={stampUploading} inputRef={stampInputRef} onUpload={(e: any) => handleFileUpload(e, 'stamp')} currentUrl={form.watch("stamp_url")} description="Digital institution seal" />
                  </div>
                  
                  {/* Mobile Mobile Action */}
                  <div className="mt-10 lg:hidden">
                    <Button 
                      type="button" 
                      onClick={form.handleSubmit(onSubmit)} 
                      disabled={saving}
                      className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black"
                    >
                      {saving ? "Deploying..." : "Persist Global Configuration"}
                    </Button>
                  </div>
               </CardContent>
            </Card>

            <div className="space-y-10 pt-10 border-t border-slate-100">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl text-primary"><Layout className="h-6 w-6" /></div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Standard Professional Layouts</h2>
                </div>
                <p className="text-slate-500 font-medium ml-14 text-lg">Individually customize special institutional documents using the advanced canvas engine.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { id: "ID_CARD", label: "Student ID Card", desc: "PVC/Digital Identity", icon: <CreditCard className="h-12 w-12" />, color: "bg-blue-600 shadow-blue-200" },
                  { id: "BONAFIDE", label: "Bonafide Certificate", desc: "Institutional Verification", icon: <FileCheck className="h-12 w-12" />, color: "bg-emerald-600 shadow-emerald-200" },
                  { id: "ACHIEVEMENT", label: "Achievement Award", desc: "Merit & Recognition", icon: <GraduationCap className="h-12 w-12" />, color: "bg-amber-600 shadow-amber-200" }
                ].map((doc) => (
                  <motion.div key={doc.id} whileHover={{ y: -10 }} transition={{ duration: 0.3 }}>
                    <Card className="rounded-[3rem] overflow-hidden shadow-2xl border-none p-3 bg-white ring-1 ring-slate-100 group">
                      <div className={`h-64 rounded-[2.5rem] ${doc.color} shadow-lg flex flex-col items-center justify-center text-white p-8 relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/10 rounded-full" />
                        <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-32 h-32 bg-black/10 rounded-full" />
                        
                        <div className="opacity-20 absolute top-6 right-6 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">{doc.icon}</div>
                        <div className="relative z-10 text-center space-y-4">
                          <div>
                            <h4 className="font-black text-2xl tracking-tight leading-none mb-2">{doc.label}</h4>
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-70">{doc.desc}</span>
                          </div>
                          <Button 
                            type="button"
                            onClick={() => setActiveEditor(doc.id as DocumentType)}
                            className="bg-white text-slate-900 border-none hover:bg-slate-50 font-black rounded-2xl px-10 h-14 text-sm shadow-xl shadow-black/10 group-hover:px-12 transition-all"
                          >
                            Launch Editor
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {activeEditor && (
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ type: "spring", damping: 25, stiffness: 150 }}
                  className="fixed inset-0 z-[150] bg-white"
                >
                  <DocumentEditor
                    documentType={activeEditor}
                    branding={mapBrandingForEditor()}
                    savedLayout={form.watch(`${activeEditor.toLowerCase()}_config` as any)?.canvas_layout}
                    onSave={(layout: any) => {
                      const configKey = `${activeEditor.toLowerCase()}_config` as any;
                      const current = form.getValues(configKey) || {};
                      form.setValue(configKey, { ...current, canvas_layout: layout });
                      setTimeout(() => form.handleSubmit(onSubmit)(), 100);
                    }}
                    onBack={() => setActiveEditor(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Form>
      </div>

      <FooterHelperComponents />
    </div>
  );
}

function FooterHelperComponents() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 mt-20 border-t pt-10 text-center text-slate-400 text-xs">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Badge className="bg-slate-900 rounded-lg">CampusConnect</Badge>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Branding Engine v2.1</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&copy; 2026 High Dynamic Educational Systems</p>
    </div>
  );
}

/* ==========================================================================
   HELPER COMPONENT: ASSET UPLOADER
   ========================================================================== */
function AssetUploader({ 
  label, 
  field, 
  uploading, 
  inputRef, 
  onUpload, 
  currentUrl,
  description
}: { 
  label: string, 
  field: string, 
  uploading: boolean, 
  inputRef: React.RefObject<HTMLInputElement>, 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  currentUrl?: string,
  description?: string
}) {
  return (
    <div className="space-y-4 group">
      <div>
        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors flex items-center gap-2">
          {label}
          {currentUrl && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </Label>
        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{description}</p>
      </div>
      <div 
        onClick={() => inputRef.current?.click()}
        className={`
          relative h-56 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 
          flex flex-col items-center justify-center cursor-pointer overflow-hidden
          hover:bg-white hover:border-primary/30 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] transition-all duration-500
          ${currentUrl ? 'border-none ring-1 ring-slate-100 shadow-sm' : ''}
        `}
      >
        <input type="file" ref={inputRef} onChange={onUpload} className="hidden" accept="image/*" />
        
        {currentUrl ? (
          <div className="relative w-full h-full group/img">
            <Image src={currentUrl} alt={label} fill className="object-contain p-6 transition-transform group-hover/img:scale-105 duration-500" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm">
              <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl text-white mb-2 transform scale-75 group-hover/img:scale-100 transition-transform">
                <UploadCloud className="h-6 w-6" />
              </div>
              <span className="text-[10px] text-white font-black tracking-widest uppercase">Replace Asset</span>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3 relative z-10 p-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
               {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900">Choose File</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JPG, PNG, SVG</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
