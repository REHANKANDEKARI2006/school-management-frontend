"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Student as StudentType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadCloud, Loader2 } from "lucide-react";

import * as React from "react";
import axios from "@/lib/axios";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

/* =========================
   HELPER FUNCTIONS
========================= */
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

/* =========================
   VALIDATION SCHEMA
========================= */
const studentSchema = z.object({
  id: z.string().optional(),
  rollNumber: z.string().optional(),

  class_id: z.string().min(1, "Class is required"),
  gender_id: z.string().min(1, "Gender is required"),

  name: z.string().min(1, "Student name is required"),
  user_status_id: z.string().min(1, "Status is required"),
  address: z.string().min(1, "Address is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  motherName: z.string().min(1, "Mother's name is required"),
  primaryContact: z.string().min(1, "Primary contact is required"),
  dob: z.string().min(1, "Date of birth is required"),
  secondaryContact: z.string().optional(),
  parentEmail: z.string().min(1, "Guardian email is required").email("Invalid email address"),
  avatar: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;

/* =========================
   COMPONENT
 ========================= */
interface Props {
  mode: "add" | "edit";
  student?: any; // initial data
  onSubmit: (data: Student) => void;
}

export function StudentForm({ mode, student, onSubmit }: Props) {
  const form = useForm<Student>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      id: student?.id ? String(student.id) : "",
      name: student?.name || "",
      class_id: student?.class_id ? String(student.class_id) : "",
      user_status_id: student?.user_status_id ? String(student.user_status_id) : "1",
      address: student?.address || "",
      bloodGroup: student?.bloodGroup || "",
      fatherName: student?.fatherName || "",
      motherName: student?.motherName || "",
      primaryContact: student?.primaryContact || "",
      secondaryContact: student?.secondaryContact || "",
      parentEmail: student?.parentEmail || "",
      dob: student?.dob ? student.dob.split("T")[0] : "",
      avatar: student?.avatar || "",
      gender_id: student?.gender_id ? String(student.gender_id) : "",
    },
  });

  /* =========================
     DROPDOWN DATA & STATE
  ========================= */
  const [classOptions, setClassOptions] = React.useState<any[]>([]);
  const [bloodGroups, setBloodGroups] = React.useState<any[]>([]);
  const [userStatuses, setUserStatuses] = React.useState<any[]>([]);

  const [selectedStandard, setSelectedStandard] = React.useState<string>("");
  const [selectedSection, setSelectedSection] = React.useState<string>("");
  
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(student?.avatar || null);

  // Cropper states
  const [imgSrc, setImgSrc] = React.useState("");
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<any>();
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    axios.get("/api/classes/admin/list").then((res) => {
      const mapped = res.data.data.map((c: any) => ({
        id: String(c.class_id),
        name: c.class_name,
        section: c.section_name || "-",
      }));
      setClassOptions(mapped);
    });

    axios.get("/api/blood-groups").then((res) => setBloodGroups(res.data.data));
    axios.get("/api/user-status").then((res) => setUserStatuses(res.data.data));
  }, []);

  const uniqueStandards = React.useMemo(() => {
    const stands = Array.from(new Set(classOptions.map((c) => c.name)));
    return stands.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [classOptions]);

  const uniqueSectionsForStandard = React.useMemo(() => {
    if (!selectedStandard) return [];
    return classOptions
      .filter((c) => c.name === selectedStandard && c.section !== "-")
      .map((c) => ({ id: c.id, section: c.section }))
      .sort((a, b) => a.section.localeCompare(b.section));
  }, [classOptions, selectedStandard]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setCrop(undefined); 
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleConfirmCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const OUTPUT_SIZE = 300;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, OUTPUT_SIZE, OUTPUT_SIZE
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", blob, "avatar.jpg");
        const res = await axios.post("/api/students/upload-photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          form.setValue("avatar", res.data.data.url, { shouldValidate: true });
          setPreviewUrl(res.data.data.url);
          setImgSrc("");
        }
      } catch (err) {
        console.error("Photo upload failed:", err);
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.92);
  };

  const handleSubmit = async (values: Student) => {
    await onSubmit(values);
  };

  const watchedName = form.watch("name");

  React.useEffect(() => {
    if (student?.class_id && classOptions.length > 0) {
      const cls = classOptions.find(c => String(c.id) === String(student.class_id));
      if (cls) {
        setSelectedStandard(cls.name);
        setTimeout(() => setSelectedSection(cls.section), 50);
      }
    }
  }, [student, classOptions]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        
        {/* PHOTO UPLOAD */}
        {imgSrc ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-primary/30 bg-muted/30 rounded-xl p-4">
            <p className="text-xs font-medium text-muted-foreground">Drag to reposition • Scroll to zoom</p>
            <div className="w-[280px] h-[280px] flex items-center justify-center overflow-hidden rounded-md">
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-w-[280px]"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  className="max-h-[280px] w-auto mx-auto"
                  onLoad={(e) => {
                    const { width, height } = e.currentTarget;
                    setCrop(centerAspectCrop(width, height, 1));
                  }}
                />
              </ReactCrop>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleConfirmCrop} disabled={isUploading}>
                {isUploading ? "Uploading…" : "✓ Confirm & Upload"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setImgSrc("")} disabled={isUploading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 py-1">
            <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-border flex-shrink-0">
              <AvatarImage src={previewUrl || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {watchedName?.charAt(0)?.toUpperCase() || <UploadCloud className="h-6 w-6 opacity-40" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">{previewUrl ? "Photo uploaded" : "Profile photo"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-3 rounded-md transition-colors">
                  <UploadCloud className="h-3.5 w-3.5" />
                  {previewUrl ? "Change" : "Upload Photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
                {previewUrl && (
                  <Button variant="ghost" size="sm" className="text-destructive h-7 px-2 text-xs" onClick={() => { setPreviewUrl(null); form.setValue("avatar", ""); }}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="e.g. Rahul Patil" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />



          <FormItem>
            <FormLabel>Standard <span className="text-destructive">*</span></FormLabel>
            <Select value={selectedStandard} onValueChange={(val) => { setSelectedStandard(val); setSelectedSection(""); form.setValue("class_id", ""); }}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {uniqueStandards.map((std) => <SelectItem key={std} value={std}>Standard {std}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>

          <FormField
            control={form.control}
            name="class_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section <span className="text-destructive">*</span></FormLabel>
                <Select
                  value={selectedSection}
                  onValueChange={(val) => {
                    setSelectedSection(val);
                    const match = classOptions.find(c => c.name === selectedStandard && c.section === val);
                    if (match) field.onChange(String(match.id));
                  }}
                  disabled={!selectedStandard}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {uniqueSectionsForStandard.map((sec) => <SelectItem key={sec.id} value={sec.section}>Section {sec.section}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender <span className="text-destructive">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Boy (Male)</SelectItem>
                    <SelectItem value="2">Girl (Female)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bloodGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Group <span className="text-destructive">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map((bg) => <SelectItem key={bg.bg_id} value={bg.blood_group}>{bg.blood_group}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_status_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {userStatuses
                      .filter(s => [
                        'Active', 
                        'Inactive', 
                        'Suspended', 
                        'Rusticated', 
                        'Alumni', 
                        'Transferred', 
                        'Banned', 
                        'Pending Approval'
                      ].includes(s.status_name))
                      .map((s) => (
                        <SelectItem key={s.user_status_id} value={String(s.user_status_id)}>
                          {s.status_name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address <span className="text-destructive">*</span></FormLabel>
                <FormControl><Textarea placeholder="Current residential address" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator className="md:col-span-2 my-2" />
          <h3 className="md:col-span-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">Guardian Information</h3>

          <FormField
            control={form.control}
            name="fatherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Father's Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Father's name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mother's Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Mother's name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="primaryContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Contact <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    minLength={10}
                    title="Phone number must be exactly 10 digits"
                    placeholder="Guardian phone" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guardian Email <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input type="email" placeholder="guardian@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full mt-4" loading={form.formState.isSubmitting}>
          {mode === "add" ? "Add Student & Register" : "Update Student Details"}
        </Button>
      </form>
    </Form>
  );
}
