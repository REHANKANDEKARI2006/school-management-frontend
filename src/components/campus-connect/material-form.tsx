
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const materialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Material name is required"),
  subject_id: z.string().min(1, "Subject is required"),
  class_id: z.string().min(1, "Class is required"),
  date: z.date({ required_error: "A date is required." }),
  fileType: z.string().optional(), // Will derive from file extension or keep simple
});

export type Material = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  onSubmit: (data: Material) => void;
  material?: Material;
}

export function MaterialForm({ onSubmit, material }: MaterialFormProps) {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get('/api/classes'),
      axios.get('/api/subjects')
    ]).then(([classesRes, subjectsRes]) => {
      setClasses(classesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    }).catch(err => {
      console.error("Failed to load classes or subjects", err);
    });
  }, []);

  const form = useForm<Material>({
    resolver: zodResolver(materialSchema),
    defaultValues: material ? {
      ...material,
      subject_id: String((material as any).subject_id || ""),
      class_id: String((material as any).class_id || ""),
      date: new Date(material.date)
    } : {
      name: "",
      subject_id: "",
      class_id: "",
      date: new Date(),
    },
  });

  const handleSubmit = async (values: Material) => {
    if (!selectedFile && !material) {
      toast({ title: "Error", description: "Please select a file to upload", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = (material as any)?.file_path || "";

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await axios.post('/api/materials/upload', formData, {
          headers: {
            // Unset the default JSON content-type so the browser can set the multipart boundary
            "Content-Type": undefined
          }
        });

        if (uploadRes.data.success) {
          fileUrl = uploadRes.data.fileUrl;
        } else {
          throw new Error("File upload failed");
        }
      }

      const dataToSend = {
        material_name: values.name,
        subject_id: parseInt(values.subject_id),
        class_id: parseInt(values.class_id),
        upload_date: format(values.date, 'yyyy-MM-dd'),
        file_path: fileUrl
      };

      onSubmit(dataToSend as any);
    } catch (err: any) {
      console.error("Failed to upload material", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to upload material";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Introduction to Algebra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="class_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>{c.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>File</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
          </FormControl>
        </FormItem>
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Upload Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? "Uploading..." : material ? "Update Material" : "Upload Material"}
        </Button>
      </form>
    </Form>
  );
}
