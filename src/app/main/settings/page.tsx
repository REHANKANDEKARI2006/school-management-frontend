
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIdCardSettings, type IdCardSettings } from "@/components/campus-connect/id-card-settings-provider";
import axios from "@/lib/axios";
import { PageSkeleton } from "@/components/ui/skeletons";
import { 
  Save, 
  FileText, 
  ChevronRight, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Users, 
  Globe, 
  CreditCard,
  Building2,
  Bell,
  Loader2
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE } from "@/config/roles";

const settingsSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  organizationName: z.string().optional(),
  slogan: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  schoolAddress: z.string().min(1, "School address is required"),
  recognition: z.string().optional(),
  schoolPhone: z.string().optional(),
});

export default function SettingsPage() {
  useRoleGuard([ROLE.MASTER_ADMIN, ROLE.IT_SUPPORT]);
  const { toast } = useToast();
  const { settings, setSettings } = useIdCardSettings();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<IdCardSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  // 🔄 Fetch Live Profile on Mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/school-profile");
        if (res.data.success && res.data.data) {
          const profile = res.data.data;
          
          const mappedSettings: IdCardSettings = {
            schoolName: profile.school_name || "",
            organizationName: profile.organization_name || "",
            schoolAddress: profile.address || "",
            schoolPhone: profile.phone || "",
            logoUrl: profile.logo_url || "",
            slogan: profile.slogan || "",
            academicYear: profile.academic_year || "",
            signatureUrl: profile.signature_url || "",
            primaryColor: profile.primary_color || "#437ef1",
            recognition: "(Govt. Recognised)", // Default fallback
          };
          
          form.reset(mappedSettings);
          setSettings(mappedSettings);
        }
      } catch (error) {
        console.error("Failed to fetch institutional profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form, setSettings]);

  const onSubmit = async (data: IdCardSettings) => {
    try {
      setSaving(true);
      
      // Update Backend
      const res = await axios.put("/api/school-profile", {
        school_name: data.schoolName,
        organization_name: data.organizationName,
        address: data.schoolAddress,
        phone: data.schoolPhone,
        slogan: data.slogan,
        logo_url: data.logoUrl,
        primary_color: data.primaryColor,
        academic_year: data.academicYear,
      });

      if (res.data.success) {
        setSettings(data);
        toast({
          title: "Settings Saved",
          description: "Institutional identity has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to save institutional profile:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred while updating settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton rows={5} />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-primary" />
              Settings
            </h1>
            <p className="text-sm text-slate-500">Configure your institution&apos;s identity and administrative preferences.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        
        {/* Document Branding Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Branding & Identity</h2>
          <Link href="/main/settings/documents" className="block group mb-4">
            <div className="border border-slate-200 shadow-sm rounded-xl p-6 bg-white hover:border-primary/50 transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
                    Document Branding
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Customize logos, stamps, and signatures for all system-generated reports.
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
          {/* 
          <Link href="/main/settings/document-content" className="block group">
            <div className="border border-slate-200 shadow-sm rounded-xl p-6 bg-white hover:border-emerald-500/50 transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    Document Content Manager
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">
                    Manage dynamic content, translations, and placeholders for certificates without altering layouts.
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
          */}
        </section>

        {/* School Profile Card */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Institutional Profile</h2>
          <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Identity Configuration</CardTitle>
                  <CardDescription className="text-sm">Manage core information used across ID cards and certificates.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="schoolName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institutional Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. CampusConnect University" 
                              {...field} 
                              className="h-11 bg-white border-slate-200 focus:ring-primary/10 transition-all rounded-lg text-sm font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organization Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. CampusConnect Educational Trust" 
                              {...field} 
                              value={field.value || ""}
                              className="h-11 bg-white border-slate-200 focus:ring-primary/10 transition-all rounded-lg text-sm font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="schoolPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Contact</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1-202-555-0123" 
                              {...field} 
                              className="h-11 bg-white border-slate-200 focus:ring-primary/10 transition-all rounded-lg text-sm font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="schoolAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the full institutional address..." 
                            {...field} 
                            className="bg-white border-slate-200 min-h-[100px] focus:ring-primary/10 transition-all rounded-lg text-sm font-medium resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="w-full sm:w-auto h-11 px-8 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
