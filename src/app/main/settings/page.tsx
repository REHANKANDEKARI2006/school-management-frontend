
// @ts-nocheck
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
import { useIdCardSettings, type IdCardSettings } from "@/components/school-os/id-card-settings-provider";
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
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 pb-4 hidden md:block">
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

      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 space-y-6 sm:space-y-8 pt-4 sm:pt-0">
        
        {/* Document Branding Section */}
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 ml-1">Branding &amp; Identity</h2>
          <Link href="/main/settings/documents" className="block group mb-4">
            <div className="border border-slate-200/80 shadow-sm rounded-2xl p-4 sm:p-6 bg-white hover:border-primary/50 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="h-11 w-11 sm:h-12 sm:w-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-primary transition-colors truncate">
                    Document Branding
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5 leading-snug">
                    Customize logos, stamps, and signatures for all system-generated reports.
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>
          </Link>
        </section>

        {/* School Profile Card */}
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 ml-1">Institutional Profile</h2>
          <Card className="shadow-sm border-slate-200/80 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Identity Configuration</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-500">Manage core information used across ID cards and certificates.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="schoolName"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">Institutional Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. SchoolOS University" 
                              {...field} 
                              className="h-10 sm:h-11 bg-white border-slate-200 focus:ring-primary/10 transition-all rounded-xl text-xs sm:text-sm font-semibold"
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">Organization Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. SchoolOS Educational Trust" 
                              {...field} 
                              value={field.value || ""}
                              className="h-10 sm:h-11 bg-white border-slate-200 focus:ring-primary/10 transition-all rounded-xl text-xs sm:text-sm font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="schoolPhone"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">Primary Contact</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1-202-555-0123" 
                              {...field} 
                              className="h-10 sm:h-11 bg-white border-slate-200 focus:ring-primary/10 transition-all rounded-xl text-xs sm:text-sm font-semibold"
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
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">Campus Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter the full institutional address..." 
                            {...field} 
                            className="bg-white border-slate-200 min-h-[90px] sm:min-h-[100px] focus:ring-primary/10 transition-all rounded-xl text-xs sm:text-sm font-medium resize-none"
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
                      className="w-full sm:w-auto h-11 px-8 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Settings
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
