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
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { UploadCloud, Camera, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

/* =========================
   HELPER FUNCTIONS
========================= */
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, mediaWidth, mediaHeight),
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
  user_status_id: z.string().optional(),   // optional — backend handles pending status for new users
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
  { id: 1, label: "A+" }, { id: 2, label: "A-" },
  { id: 3, label: "B+" }, { id: 4, label: "B-" },
  { id: 5, label: "AB+" }, { id: 6, label: "AB-" },
  { id: 7, label: "O+" }, { id: 8, label: "O-" },
];
const genders = [
  { id: 1, label: "Male" },
  { id: 2, label: "Female" },
];

/* =========================
   COMPONENT
========================= */
export function FacultyForm({ mode, initialData, departments, subjects, onSubmit }: Props) {
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
      user_status_id: initialData?.user_status_id ? String(initialData.user_status_id) : "1",
      joining_date: initialData?.joining_date ? initialData.joining_date.split("T")[0] : "",
      avatar: initialData?.profile_url ?? "",
    },
  });

  // ── Photo / crop state ─────────────────────────────────────────────────
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    initialData?.profile_url || null,
  );
  const [imgSrc, setImgSrc] = React.useState("");
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<any>();
  const imgRef = React.useRef<HTMLImageElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── User statuses (for edit mode) ──────────────────────────────────────
  const [userStatuses, setUserStatuses] = React.useState<any[]>([]);
  React.useEffect(() => {
    axios.get("/api/user-status").then((res) => setUserStatuses(res.data.data || []));
  }, []);

  // ── Photo upload handlers ──────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setCrop(undefined);
    setCompletedCrop(undefined);
    const reader = new FileReader();
    reader.addEventListener("load", () => setImgSrc(reader.result?.toString() || ""));
    reader.readAsDataURL(e.target.files[0]);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  /** Called when the image loads inside the crop box — sets a fixed 80% center crop */
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Always size the crop box at a fixed 320×320 pixels rendered size
    // by using percentage-based crop on the rendered element dimensions
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const handleConfirmCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement("canvas");

    // Always output a 300×300 avatar — normalise scale differences between images
    const OUTPUT_SIZE = 300;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, OUTPUT_SIZE, OUTPUT_SIZE,
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
    }, "image/jpeg", 0.92);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setImgSrc("");
    form.setValue("avatar", "");
  };

  // ── Form submit ────────────────────────────────────────────────────────

  const handleFormSubmit = async (values: FacultyFormData) => {
    await onSubmit(values);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const watchedName = form.watch("name");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">

        {/* ── PHOTO UPLOAD ─────────────────────────────────────────────── */}
        {imgSrc ? (
          /* Crop view — fixed-height container so window size is consistent */
          <div className="flex flex-col items-center gap-3 border border-dashed border-primary/30 bg-muted/30 rounded-xl p-4">
            <p className="text-xs font-medium text-muted-foreground">Drag to reposition • Scroll to zoom</p>

            {/* Fixed 280×280 crop window — same size regardless of image */}
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
                  onLoad={onImageLoad}
                  style={{ maxWidth: "280px", maxHeight: "280px", objectFit: "contain" }}
                />
              </ReactCrop>
            </div>

            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleConfirmCrop} disabled={isUploading}>
                {isUploading ? "Uploading…" : "✓ Confirm & Upload"}
              </Button>
              <Button
                type="button" size="sm" variant="outline"
                onClick={() => { setImgSrc(""); setCrop(undefined); }}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Normal view — compact avatar + small button */
          <div className="flex items-center gap-4 py-1">
            <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-border flex-shrink-0">
              <AvatarImage src={previewUrl || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {watchedName?.charAt(0)?.toUpperCase() || <UploadCloud className="h-6 w-6 opacity-40" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                {previewUrl ? "Photo uploaded" : "Profile photo"}
              </p>
              <p className="text-xs text-muted-foreground">
                {previewUrl ? "Click Change to replace" : "JPG, PNG or WEBP · optional"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {/* ── Upload button — correctly contained ── */}
                <label
                  htmlFor="faculty-photo-input"
                  className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold
                             border border-input bg-background hover:bg-accent hover:text-accent-foreground
                             h-7 px-3 rounded-md transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {previewUrl ? "Change" : "Upload Photo"}
                </label>
                <input
                  id="faculty-photo-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 text-xs text-destructive hover:underline font-medium"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* ── FORM FIELDS — Responsive grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <FormField
            control={form.control} name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="e.g. Priya Sharma" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control} name="email"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input type="email" placeholder="teacher@school.edu" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control} name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <FormControl>
                  <Input 
                    type="tel" 
                    pattern="[0-9]{10}" 
                    maxLength={10} 
                    minLength={10} 
                    title="Phone number must be exactly 10 digits" 
                    placeholder="Phone number" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} 
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control} name="joining_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joining Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control} name="qualification"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Qualification</FormLabel>
                <FormControl><Input placeholder="e.g. M.Sc. Mathematics" {...field} /></FormControl>
              </FormItem>
            )}
          />

          {/* Department */}
          <FormField
            control={form.control} name="dept_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department <span className="text-destructive">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.dept_id} value={String(d.dept_id)}>{d.dept_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subject */}
          <FormField
            control={form.control} name="subject_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.subject_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Blood Group */}
          <FormField
            control={form.control} name="bg_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Group</FormLabel>
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Gender */}
          <FormField
            control={form.control} name="gender_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {genders.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Status — only shown in edit mode; for new faculty it's set automatically */}
          {mode === "edit" && userStatuses.length > 0 && (
            <FormField
              control={form.control} name="user_status_id"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
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
          )}

        </div>

        <Button type="submit" className="w-full mt-2" loading={form.formState.isSubmitting}>
          {mode === "add" ? "Add Faculty & Send Invitation" : "Update Faculty"}
        </Button>

      </form>
    </Form>
  );
}
