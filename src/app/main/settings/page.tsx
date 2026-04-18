
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
  Bell
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const settingsSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  slogan: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  schoolAddress: z.string().min(1, "School address is required"),
  recognition: z.string().optional(),
  schoolPhone: z.string().optional(),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, setSettings } = useIdCardSettings();

  const form = useForm<IdCardSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  
  React.useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  const onSubmit = (data: IdCardSettings) => {
    setSettings(data);
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-zinc-950/30 pb-20">
      {/* Header with Background Pattern */}
      <div className="bg-white dark:bg-zinc-950 border-b mb-8 pt-10 pb-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/4 h-full bg-primary/5 clip-path-polygon pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 mb-2 px-3 py-1 rounded-full font-bold">
                Control Panel
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                <SettingsIcon className="h-10 w-10 text-primary" />
                Settings
              </h1>
              <p className="text-slate-500 max-w-2xl text-lg font-medium">
                Configure your institution&apos;s digital ecosystem and administrative preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-10">
        
        {/* Core Modules Grid */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">Core Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/main/settings/documents" className="block group h-full">
              <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                className="h-full border-2 border-white shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-white hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-150 rotate-12">
                   <FileText className="h-20 w-20 text-primary" />
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors flex items-center gap-2">
                      Document Branding
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 scale-90">Ready</Badge>
                    </h3>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed font-medium">
                      Configure consistent logos, stamps, and layout styles for all system-generated PDFs.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-primary font-bold text-sm">
                  Configure Module <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>

            <div className="opacity-60 cursor-not-allowed group h-full">
              <div className="h-full border-2 border-slate-100 rounded-3xl p-6 bg-slate-50 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-14 w-14 bg-slate-200 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-400 flex items-center gap-2">
                      Roles & Permissions
                      <Badge variant="outline" className="scale-90">Soon</Badge>
                    </h3>
                    <p className="text-slate-400 mt-2 text-sm leading-relaxed font-medium">
                      Manage administrative access levels and security protocols.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* School Profile Card */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">Legacy Config</h2>
          <Card className="border-none shadow-2xl shadow-slate-200 bg-white rounded-[2rem] overflow-hidden ring-1 ring-slate-100">
            <div className="h-2 bg-gradient-to-r from-primary/40 via-primary to-primary/40 w-full" />
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Quick Identity Check</CardTitle>
                  <CardDescription className="text-base">Basic institutional data used for ID card generation.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <Separator className="mb-8 opacity-50" />
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="schoolName"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Institutional Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. CampusConnect University" 
                              {...field} 
                              className="h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl text-base px-6 font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schoolPhone"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Primary Hotline</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1-202-555-0123" 
                              {...field} 
                              className="h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl text-base px-6 font-semibold"
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
                      <FormItem className="space-y-3">
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Campus Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Full physical address..." 
                            {...field} 
                            className="bg-slate-50 border-slate-100 min-h-[120px] focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl text-base p-6 font-medium resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 flex justify-end">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-white px-10 h-14 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 hover:shadow-2xl active:scale-95 flex items-center gap-3">
                      <Save className="h-5 w-5" />
                      Commit Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>

        {/* Utility Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { icon: Globe, label: "Localization", color: "text-blue-500", bg: "bg-blue-50" },
             { icon: Users, label: "User Logs", color: "text-purple-500", bg: "bg-purple-50" },
             { icon: Bell, label: "Alert Config", color: "text-amber-500", bg: "bg-amber-50" },
             { icon: CreditCard, label: "Billing", color: "text-emerald-500", bg: "bg-emerald-50" }
           ].map((item, i) => (
             <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
               <div className={`h-12 w-12 ${item.bg} rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12`}>
                 <item.icon className={`h-6 w-6 ${item.color}`} />
               </div>
               <span className="font-bold text-slate-700">{item.label}</span>
             </div>
           ))}
        </section>
      </div>
    </div>
  );
}
