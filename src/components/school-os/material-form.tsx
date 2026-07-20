
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
  onCancel?: () => void;
  material?: Material;
}

export function MaterialForm({ onSubmit, onCancel, material }: MaterialFormProps) {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
    if (selectedFiles.length === 0 && !material) {
      toast({ title: "Error", description: "Please select at least one file to upload", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      if (material) {
        // Edit mode
        let fileUrl = (material as any)?.file_path || "";
        if (selectedFiles.length > 0) {
          const fileUrls: string[] = [];
          for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await axios.post('/api/materials/upload', formData, {
              headers: {
                "Content-Type": "multipart/form-data"
              }
            });

            if (uploadRes.data.success) {
              fileUrls.push(uploadRes.data.fileUrl);
            } else {
              throw new Error("File upload failed");
            }
          }
          fileUrl = fileUrls.join(",");
        }

        const dataToSend = {
          material_name: values.name,
          subject_id: parseInt(values.subject_id),
          class_id: parseInt(values.class_id),
          upload_date: format(values.date, 'yyyy-MM-dd'),
          file_path: fileUrl
        };

        await onSubmit(dataToSend as any);
      } else {
        // Create mode (can be multiple files)
        const fileUrls: string[] = [];
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await axios.post('/api/materials/upload', formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });

          if (uploadRes.data.success) {
            fileUrls.push(uploadRes.data.fileUrl);
          } else {
            throw new Error(`File upload failed for ${file.name}`);
          }
        }

        const dataToSend = {
          material_name: values.name,
          subject_id: parseInt(values.subject_id),
          class_id: parseInt(values.class_id),
          upload_date: format(values.date, 'yyyy-MM-dd'),
          file_path: fileUrls.join(",")
        };

        await onSubmit(dataToSend as any);
      }
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-semibold text-slate-700">Material Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Introduction to Algebra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="subject_id"
            render={({ field }) => (
                <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-700">Subject</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-slate-700">Class</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {classes.map(c => (
                        <SelectItem key={c.class_id} value={String(c.class_id)}>
                        {c.class_name}{c.section_name ? ` - ${c.section_name}` : ""}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormItem className="space-y-2">
          <FormLabel className="text-sm font-semibold text-slate-700">Files</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type="file"
                multiple={true}
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                className="cursor-pointer"
              />
            </div>
          </FormControl>
          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-[120px] overflow-y-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Selected Files ({selectedFiles.length}):</p>
              {selectedFiles.map((f, idx) => (
                <div key={idx} className="text-xs font-semibold text-slate-650 truncate flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  {f.name} <span className="text-[10px] font-normal text-slate-400">({(f.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              ))}
            </div>
          )}
        </FormItem>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2">
              <FormLabel className="text-sm font-semibold text-slate-700">Upload Date</FormLabel>
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
        
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="order-2 sm:order-1">
                    Cancel
                </Button>
            )}
            <Button type="submit" className="flex-1 order-1 sm:order-2" loading={isUploading}>
                {material ? "Update Material" : "Upload Material"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
