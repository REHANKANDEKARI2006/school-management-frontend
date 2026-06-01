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
import { TemplateSelector, type DocType } from "@/components/campus-connect/template-selector";


const schoolProfileSchema = z.object({
  school_name: z.string().min(1, "School Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  organization_name: z.string().optional(),
  principal_name: z.string().optional(),
  primary_color: z.string().optional(),
  academic_year: z.string().optional(),
  logo_url: z.string().optional(),
  signature_url: z.string().optional(),
  selected_id_card_template: z.string().optional(),
  selected_bonafide_template: z.string().optional(),
  selected_mark_sheet_template: z.string().optional(),
  selected_general_certificate_template: z.string().optional(),
  selected_fee_receipt_template: z.string().optional(),
  selected_leaving_certificate_template: z.string().optional(),
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
  fee_receipt_config: z.any().optional(),
  document_theme: z.string().optional(),
  is_document_theme_enabled: z.boolean().default(true),
});

type FormData = z.infer<typeof schoolProfileSchema>;

export default function DocumentSettingsPage() {
  const [activeSelector, setActiveSelector] = useState<DocType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [customTemplateCounts, setCustomTemplateCounts] = useState<Record<string, number>>({
    BONAFIDE: 0,
    ACHIEVEMENT: 0
  });
  
  const [logoUploading, setLogoUploading] = useState(false);
  const [stampUploading, setStampUploading] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: {
      school_name: "",
      address: "",
      phone: "",
      email: "",
      organization_name: "",
      principal_name: "",
      primary_color: "#437ef1",
      academic_year: "",
      logo_url: "",
      signature_url: "",
      selected_id_card_template: "template1",
      selected_bonafide_template: "template1",
      selected_mark_sheet_template: "template1",
      selected_general_certificate_template: "template1",
      selected_fee_receipt_template: "template1",
      selected_leaving_certificate_template: "template1",
      stamp_url: "",
      header_layout_type: "LEFT",
      footer_text: "",
      show_watermark: false,
      document_config: {},
      id_card_config: {},
      bonafide_config: {},
      achievement_config: {},
      fee_receipt_config: {},
      document_theme: "THEME_1",
      is_document_theme_enabled: true
    },
  });

  useEffect(() => {
    checkAccess();
    fetchProfile();
    fetchCustomTemplateCounts();
  }, []);

  const fetchCustomTemplateCounts = async () => {
    try {
      const [bonafideRes, achievementRes] = await Promise.all([
        axios.get("/api/document-templates/all/BONAFIDE").catch(() => null),
        axios.get("/api/document-templates/all/ACHIEVEMENT").catch(() => null)
      ]);
      setCustomTemplateCounts({
        BONAFIDE: bonafideRes?.data?.success ? bonafideRes.data.data.length : 0,
        ACHIEVEMENT: achievementRes?.data?.success ? achievementRes.data.data.length : 0
      });
    } catch (error) {
      console.error("Failed to fetch custom template counts:", error);
    }
  };

  // Prevent body scroll when template selector is open
  useEffect(() => {
    if (activeSelector) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [activeSelector]);

  const checkAccess = () => {
    const roleId = Number(localStorage.getItem("role_id"));
    const allowedRoles = [1, 21]; // MASTER_ADMIN and IT_SUPPORT only
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'stamp' | 'signature') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    let setUploading: (v: boolean) => void;
    let endpoint: string;
    let fieldName: keyof FormData;

    switch (type) {
      case 'logo': setUploading = setLogoUploading; endpoint = "/api/school-profile/upload-logo"; fieldName = "logo_url"; break;
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


  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 overflow-x-hidden">
      <div className="bg-white border-b mb-8 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <SettingsIcon className="h-7 w-7 text-primary" />
              Document Branding
              <Badge variant="secondary" className="text-[10px] uppercase font-bold px-2 py-0">v2.1</Badge>
            </h1>
            <p className="text-slate-500 max-w-2xl text-sm font-medium">
              Craft a professional institutional identity that applies across all official documents, certificates, and student credentials.
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            
            {/* GLOBAL DOCUMENT BRANDING */}
            <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden mb-8">
              <CardHeader className="bg-slate-50/50 border-b p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0 mt-1 sm:mt-0">
                      <Palette className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Global Document Branding</CardTitle>
                      <CardDescription className="text-sm mt-1 sm:mt-0">Select a single global color theme that instantly applies across all your documents.</CardDescription>
                    </div>
                  </div>
                  <FormField control={form.control} name="is_document_theme_enabled" render={({ field }) => (
                    <FormItem className="flex items-center justify-between w-full sm:w-auto gap-3 space-y-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <FormLabel className="text-sm font-bold text-slate-700">Apply Theme To All Documents</FormLabel>
                      <FormControl>
                        <div 
                          className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative flex items-center ${field.value ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow absolute transition-transform ${field.value ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <FormField control={form.control} name="document_theme" render={({ field }) => {
                  const themes = [
                    { id: "THEME_1", name: "Royal Blue", primary: "#001F54", secondary: "#F5C400" },
                    { id: "THEME_2", name: "Emerald Green", primary: "#0B6E4F", secondary: "#FFD166" },
                    { id: "THEME_3", name: "Maroon Gold", primary: "#6D071A", secondary: "#E6B325" },
                    { id: "THEME_4", name: "Purple Modern", primary: "#4B2E83", secondary: "#FFB3C6" },
                    { id: "THEME_5", name: "Sky Blue Professional", primary: "#0077B6", secondary: "#90E0EF" },
                    { id: "THEME_6", name: "Elegant Dark", primary: "#1A1A1A", secondary: "#9CA3AF" },
                    { id: "THEME_7", name: "Red Premium", primary: "#9D0208", secondary: "#FFBA08" }
                  ];
                  
                  const activeTheme = themes.find(t => t.id === field.value) || themes[0];

                  return (
                    <FormItem>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 block">Global Theme Selector</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {themes.map(t => (
                              <div 
                                key={t.id}
                                onClick={() => field.onChange(t.id)}
                                className={`cursor-pointer border-2 rounded-xl p-3 flex items-center gap-3 transition-all ${field.value === t.id ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-300'}`}
                              >
                                <div className="flex -space-x-2">
                                  <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: t.primary }} />
                                  <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: t.secondary }} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{t.name}</span>
                                {field.value === t.id && <CheckCircle2 className="h-4 w-4 text-indigo-500 ml-auto" />}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-6 border flex flex-col items-center justify-center">
                          <span className="text-xs font-bold uppercase text-slate-400 mb-6 tracking-widest">Live Theme Preview</span>
                          <div className="w-full max-w-[280px] bg-white rounded-lg shadow-sm border overflow-hidden">
                            {/* Mock Header */}
                            <div className="h-16 flex items-center px-4" style={{ backgroundColor: activeTheme.primary, opacity: form.watch('is_document_theme_enabled') ? 1 : 0.5 }}>
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeTheme.primary }} />
                              </div>
                              <div className="ml-3">
                                <div className="w-24 h-2 rounded bg-white/20 mb-1" />
                                <div className="w-32 h-1.5 rounded" style={{ backgroundColor: activeTheme.secondary }} />
                              </div>
                            </div>
                            {/* Mock Body */}
                            <div className="p-4 space-y-3">
                              <div className="w-full h-2 rounded bg-slate-100" />
                              <div className="w-3/4 h-2 rounded bg-slate-100" />
                              <div className="w-full h-12 rounded border-l-4 mt-4" style={{ borderColor: activeTheme.primary, backgroundColor: activeTheme.primary + '10' }} />
                            </div>
                            {/* Mock Footer */}
                            <div className="h-6 flex items-center justify-between px-4" style={{ backgroundColor: activeTheme.primary + '20' }}>
                              <div className="w-12 h-1.5 rounded" style={{ backgroundColor: activeTheme.primary }} />
                              <div className="w-8 h-1.5 rounded" style={{ backgroundColor: activeTheme.secondary }} />
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => form.handleSubmit(onSubmit)()}
                            className="mt-6 w-full max-w-[280px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Set As Active Theme
                          </Button>
                        </div>
                      </div>
                    </FormItem>
                  );
                }} />
              </CardContent>
            </Card>

            {/* Asset Library Section */}
            <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <UploadCloud className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Asset Library</CardTitle>
                    <CardDescription className="text-sm">Manage institutional imagery used across generated documents.</CardDescription>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={saving}
                  className="h-10 px-6 rounded-lg font-bold gap-2 transition-all active:scale-95"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" /> }
                  Save Changes
                </Button>
              </CardHeader>
               
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <AssetUploader label="Primary Logo" field="logo_url" uploading={logoUploading} inputRef={logoInputRef} onUpload={(e: any) => handleFileUpload(e, 'logo')} currentUrl={form.watch("logo_url")} description="Main header logo" />
                  <AssetUploader label="Head Signature" field="signature_url" uploading={signatureUploading} inputRef={signatureInputRef} onUpload={(e: any) => handleFileUpload(e, 'signature')} currentUrl={form.watch("signature_url")} description="Principal's sign" />
                  <AssetUploader label="Official Stamp" field="stamp_url" uploading={stampUploading} inputRef={stampInputRef} onUpload={(e: any) => handleFileUpload(e, 'stamp')} currentUrl={form.watch("stamp_url")} description="Digital institution seal" />
                </div>
              </CardContent>
            </Card>



            <div className="space-y-6 pt-10 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Layout className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Document Templates</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium -mt-4">Select a pre-built template to generate professional documents using your school branding.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: "ID_CARD" as DocType, label: "Student ID Card", desc: "PVC / Digital Identity Card", icon: <CreditCard className="h-6 w-6" />, color: "bg-blue-600/10 text-blue-600 hoverColor:text-blue-600", templates: 2 },
                  { id: "BONAFIDE" as DocType, label: "Bonafide Certificate", desc: "Institutional Verification", icon: <FileCheck className="h-6 w-6" />, color: "bg-emerald-600/10 text-emerald-600 hoverColor:text-emerald-600", templates: 2 + (customTemplateCounts.BONAFIDE || 0) },
                  { id: "ACHIEVEMENT" as DocType, label: "Achievement Certificate", desc: "Merit & Recognition Award", icon: <GraduationCap className="h-6 w-6" />, color: "bg-amber-600/10 text-amber-600 hoverColor:text-amber-600", templates: 1 + (customTemplateCounts.ACHIEVEMENT || 0) },
                  // { id: "LEAVING_CERTIFICATE" as DocType, label: "Leaving Certificate", desc: "Official School Transfer", icon: <FileCheck className="h-6 w-6" />, color: "bg-rose-600/10 text-rose-600 hoverColor:text-rose-600", templates: 1 },
                  { id: "MARK_SHEET" as DocType, label: "Marksheet", desc: "Academic Progress Report", icon: <FileCheck className="h-6 w-6" />, color: "bg-indigo-600/10 text-indigo-600 hoverColor:text-indigo-600", templates: 2 },
                  { id: "FEE_RECEIPT" as DocType, label: "Fee Receipt", desc: "Payment Acknowledgment", icon: <CreditCard className="h-6 w-6" />, color: "bg-teal-600/10 text-teal-600 hoverColor:text-teal-600", templates: 1 }
                ].map((doc) => (
                  <div 
                    key={doc.id} 
                    className="border border-slate-200 shadow-sm rounded-xl p-6 bg-white hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-full"
                    onClick={() => setActiveSelector(doc.id)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${doc.color.split(' ')[0]} ${doc.color.split(' ')[1]}`}>
                          {doc.icon}
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold border-none px-2.5 py-0.5">
                          {doc.templates} {doc.templates === 1 ? 'Template' : 'Templates'}
                        </Badge>
                      </div>
                      <h4 className={`font-bold text-lg text-slate-800 leading-tight mb-1 transition-colors group-hover:text-primary`}>
                        {doc.label}
                      </h4>
                      <p className="text-sm font-medium text-slate-500">{doc.desc}</p>
                    </div>
                    <div className="mt-6 flex items-center text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">
                      Select Template
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {activeSelector && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => setActiveSelector(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full h-full max-w-6xl max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col m-4 md:m-8"
                  >
                    <TemplateSelector
                      documentType={activeSelector}
                      onClose={() => setActiveSelector(null)}
                      currentDefault={
                        activeSelector === 'ID_CARD' ? form.watch('selected_id_card_template') :
                        activeSelector === 'BONAFIDE' ? form.watch('selected_bonafide_template') :
                        activeSelector === 'MARK_SHEET' ? form.watch('selected_mark_sheet_template') :
                        activeSelector === 'FEE_RECEIPT' ? form.watch('selected_fee_receipt_template') :
                        activeSelector === 'LEAVING_CERTIFICATE' ? form.watch('selected_leaving_certificate_template') :
                        form.watch('selected_general_certificate_template')
                      }
                      onSetDefault={async (templateId) => {
                        if (activeSelector === 'ID_CARD') {
                          form.setValue('selected_id_card_template', templateId, { shouldDirty: true });
                        } else if (activeSelector === 'BONAFIDE') {
                          form.setValue('selected_bonafide_template', templateId, { shouldDirty: true });
                        } else if (activeSelector === 'MARK_SHEET') {
                          form.setValue('selected_mark_sheet_template', templateId, { shouldDirty: true });
                        } else if (activeSelector === 'FEE_RECEIPT') {
                          form.setValue('selected_fee_receipt_template', templateId, { shouldDirty: true });
                        } else if (activeSelector === 'LEAVING_CERTIFICATE') {
                          form.setValue('selected_leaving_certificate_template', templateId, { shouldDirty: true });
                        } else {
                          form.setValue('selected_general_certificate_template', templateId, { shouldDirty: true });
                        }
                        
                        try {
                          setSaving(true);
                          const data = form.getValues();
                          const res = await axios.put("/api/school-profile", data);
                          if (res.data.success) {
                            toast.success("Template activated successfully");
                            if (res.data.data) form.reset(res.data.data);
                          }
                        } catch (error) {
                          console.error("Error saving active template:", error);
                          toast.error("Failed to activate template");
                        } finally {
                          setSaving(false);
                        }
                      }}
                    />
                  </motion.div>
                </div>
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
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 mt-20 border-t pt-10 text-center text-slate-400 text-[10px]">
      <p className="font-bold uppercase tracking-widest">&copy; 2026 CampusConnect Educational Systems</p>
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
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-primary transition-colors flex items-center gap-2">
          {label}
          {currentUrl && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </Label>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{description}</p>
      </div>
      <div 
        onClick={() => inputRef.current?.click()}
        className={`
          relative h-48 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 
          flex flex-col items-center justify-center cursor-pointer overflow-hidden
          hover:bg-white hover:border-primary/30 transition-all duration-300
          ${currentUrl ? 'border-none ring-1 ring-slate-100 shadow-sm' : ''}
        `}
      >
        <input type="file" ref={inputRef} onChange={onUpload} className="hidden" accept="image/*" />
        
        {currentUrl ? (
          <div className="relative w-full h-full group/img">
            <Image src={currentUrl} alt={label} fill className="object-contain p-4 transition-transform group-hover/img:scale-105 duration-300" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
              <UploadCloud className="h-6 w-6 text-white mb-1" />
              <span className="text-[10px] text-white font-bold uppercase">Replace</span>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2 relative z-10 p-4">
            <div className="mx-auto w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-all">
               {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
            </div>
            <p className="text-xs font-bold text-slate-900">Choose File</p>
          </div>
        )}
      </div>
    </div>
  );
}
