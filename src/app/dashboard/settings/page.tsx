
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
import { Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
      description: "Your ID card settings have been updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Settings</CardTitle>
        <CardDescription>
          Manage application-wide settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <h3 className="text-lg font-medium">ID Card Template</h3>
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CampusConnect High" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be displayed at the top of the ID card.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recognition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recognition Text</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. (Govt. Recognised)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional text displayed below the school name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 University Drive, Knowledge City, ED 54321" {...field} />
                  </FormControl>
                  <FormDescription>
                    The school's address to be displayed on the ID card.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="schoolPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. +1 234 567 8900" {...field} />
                  </FormControl>
                  <FormDescription>
                    The school's contact phone number.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="slogan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slogan or Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Excellence in Education" {...field} />
                  </FormControl>
                  <FormDescription>
                    An optional slogan. In the example, this is used for 'Principal Sign'.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    The logo to be displayed on the ID card.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
