"use client";

import * as React from "react";
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
import axios from "@/lib/axios";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { UploadCloud, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

/* =========================
   HELPER FUNCTIONS
========================= */
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: '%', width: 90 },
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
const facultySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),

  contact: z.string().optional(),
  qualification: z.string().optional(),

  dept_id: z.string().min(1, "Department is required"),
  subject_id: z.string().optional(),

  bg_id: z.string().optional(),
  gender_id: z.string().optional(),

  user_status_id: z.string(),
  joining_date: z.string().optional(),
  avatar: z.string().optional(),
});

export type FacultyFormData = z.infer<typeof facultySchema>;

interface Props {
  mode: "add" | "edit";
  initialData?: any;
  departments: any[];
  subjects: any[];
  onSubmit: (data: FacultyFormData) => void;
}

/* =========================
   STATIC DROPDOWNS
========================= */
const bloodGroups = [
  { id: 1, label: "A+" },
  { id: 2, label: "A-" },
  { id: 3, label: "B+" },
  { id: 4, label: "B-" },
  { id: 5, label: "AB+" },
  { id: 6, label: "AB-" },
  { id: 7, label: "O+" },
  { id: 8, label: "O-" },
];

const genders = [
  { id: 1, label: "Male" },
  { id: 2, label: "Female" },
];

export function FacultyForm({
  mode,
  initialData,
  departments,
  subjects,
  onSubmit,
}: Props) {
  const form = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: initialData
        ? `${initialData.staff_first_name ?? ""} ${initialData.staff_last_name ?? ""}`.trim()
        : "",
      email: initialData?.email ?? "",
      contact: initialData?.contact ?? "",
      qualification: initialData?.qualification ?? "",
      dept_id: initialData?.dept_id ? String(initialData.dept_id) : "",
      subject_id: initialData?.subject_id ? String(initialData.subject_id) : "",
      bg_id: initialData?.bg_id ? String(initialData.bg_id) : "",
      gender_id: initialData?.gender_id ? String(initialData.gender_id) : "",
      user_status_id: initialData?.user_status_id
        ? String(initialData.user_status_id)
        : "1",
      joining_date: initialData?.joining_date
        ? initialData.joining_date.split("T")[0]
        : "",
      avatar: initialData?.profile_url ?? "",
    },
  });

  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialData?.profile_url || null);

  const [imgSrc, setImgSrc] = React.useState("");
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<any>();
  const imgRef = React.useRef<HTMLImageElement>(null);

  const [userStatuses, setUserStatuses] = React.useState<any[]>([]);

  React.useEffect(() => {
    axios.get("/api/user-status").then((res) => {
      setUserStatuses(res.data.data);
    });
  }, []);

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
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", blob, "avatar.jpg");
        const res = await axios.post("/api/faculty/upload-photo", formData, {
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
    }, 'image/jpeg');
  };

  const handleFormSubmit = async (values: FacultyFormData) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        
        {/* PHOTO UPLOAD */}
        <div className="flex flex-col items-center gap-3 pb-2">
          {imgSrc ? (
            <div className="flex flex-col items-center gap-2 w-full border border-dashed p-4 rounded-md">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  className="max-h-[300px] w-auto mx-auto"
                  onLoad={(e) => {
                    const { width, height } = e.currentTarget;
                    setCrop(centerAspectCrop(width, height, 1));
                  }}
                />
              </ReactCrop>
              <div className="flex gap-2">
                <Button type="button" onClick={handleConfirmCrop} loading={isUploading}>
                  Confirm & Upload
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setImgSrc("");
                }} disabled={isUploading}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {form.getValues("name")?.charAt(0) || <UploadCloud className="h-8 w-8 opacity-50" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    onClick={(e) => e.currentTarget.value = ""}
                  />
                </Button>
                {previewUrl && !isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8 px-2"
                    onClick={() => {
                      setPreviewUrl(null);
                      form.setValue("avatar", "");
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
        <Separator />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qualification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qualification</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="joining_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Joining Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Department */}
        <FormField
          control={form.control}
          name="dept_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.dept_id} value={String(d.dept_id)}>
                      {d.dept_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subject */}
        <FormField
          control={form.control}
          name="subject_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem
                      key={s.subject_id}
                      value={String(s.subject_id)}
                    >
                      {s.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Blood Group */}
        <FormField
          control={form.control}
          name="bg_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Group</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={form.control}
          name="gender_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="user_status_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {userStatuses.map((s) => (
                    <SelectItem key={s.user_status_id} value={String(s.user_status_id)}>
                      {s.status_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          {mode === "add" ? "Add Faculty" : "Update Faculty"}
        </Button>
      </form>
    </Form>
  );
}
