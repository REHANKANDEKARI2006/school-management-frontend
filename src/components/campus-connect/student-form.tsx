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

  name: z.string().min(1, "Student name is required"),
  email: z.string().email("Invalid email address"),
  user_status_id: z.string().min(1, "Status is required"),
  address: z.string().min(1, "Address is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  motherName: z.string().min(1, "Mother's name is required"),
  primaryContact: z.string().min(1, "Primary contact is required"),
  dob: z.string().min(1, "Date of birth is required"),
  secondaryContact: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  avatar: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;

interface StudentFormProps {
  onSubmit: (data: Student) => void;
  student?: StudentType;
}

export function StudentForm({ onSubmit, student }: StudentFormProps) {
  const form = useForm<Student>({
    resolver: zodResolver(studentSchema),
    defaultValues: student || {
      name: "",
      email: "",
      class_id: "",
      user_status_id: "1",
      address: "",
      bloodGroup: "",
      fatherName: "",
      motherName: "",
      primaryContact: "",
      secondaryContact: "",
      parentEmail: "",
      dob: "",
      avatar: "",
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
    axios
      .get("/api/classes/admin/list")
      .then((res) => {
        // res.data.data has { class_id, class_name, section_name, ... }
        const mapped = res.data.data.map((c: any) => ({
          id: String(c.class_id),
          name: c.class_name,
          section: c.section_name || "-",
        }));
        setClassOptions(mapped);
      });

    axios
      .get("/api/blood-groups")
      .then((res) => setBloodGroups(res.data.data));

    axios
      .get("/api/user-status")
      .then((res) => setUserStatuses(res.data.data));
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
      setCrop(undefined); // Reset crop
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
        const res = await axios.post("/api/students/upload-photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          form.setValue("avatar", res.data.data.url, { shouldValidate: true });
          setPreviewUrl(res.data.data.url);
          setImgSrc(""); // Close cropper
        }
      } catch (err) {
        console.error("Photo upload failed:", err);
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg');
  };

  const handleSubmit = async (values: Student) => {
    await onSubmit(values);
  };

  /* =========================
     PREFILL (EDIT MODE)
  ========================= */
  React.useEffect(() => {
    if (student) {
      form.reset({
        ...student,
        class_id: student.class_id ? String(student.class_id) : "",
        dob: student.dob ? student.dob.split("T")[0] : "",
        bloodGroup: student.bloodGroup ?? "",
        user_status_id: student.user_status_id ? String(student.user_status_id) : "1",
        avatar: student.avatar ?? "",
      });
      setPreviewUrl(student.avatar || null);
    } else {
      form.reset({
        name: "",
        email: "",
        class_id: "",
        user_status_id: "1",
        address: "",
        bloodGroup: "",
        fatherName: "",
        motherName: "",
        primaryContact: "",
        secondaryContact: "",
        parentEmail: "",
        dob: "",
        avatar: "",
      });
      setSelectedStandard("");
      setSelectedSection("");
      setPreviewUrl(null);
      setImgSrc("");
    }
  }, [student, form]);

  React.useEffect(() => {
    if (student?.class_id && classOptions.length > 0) {
      form.setValue("class_id", String(student.class_id), {
        shouldValidate: true,
      });
      // Delay the standard/section setting slightly to let the UI options mount,
      // or simply set them directly if we found the class.
      const cls = classOptions.find(
        (c) => String(c.id) === String(student.class_id)
      );
      if (cls) {
        setSelectedStandard(cls.name);
        // We use a small timeout to let the Standard select render the disabled Section Select
        setTimeout(() => {
          setSelectedSection(cls.section);
        }, 50);
      }
    }
  }, [student, classOptions, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        
        {/* PHOTO UPLOAD */}
        <div className="flex flex-col items-center gap-3 pb-2">
          {imgSrc ? (
            <div className="flex flex-col items-center gap-2 mt-2 w-full border border-dashed p-4 rounded-md">
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

        <h3 className="text-lg font-medium">Student Information</h3>

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
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ FIXED CLASS SELECT (INDUSTRY STANDARD) */}
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Standard</FormLabel>
            <Select
              value={selectedStandard}
              onValueChange={(val) => {
                setSelectedStandard(val);
                setSelectedSection("");
                form.setValue("class_id", "", { shouldValidate: true });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Standard" />
              </SelectTrigger>
              <SelectContent>
                {uniqueStandards.map((std) => (
                  <SelectItem key={std} value={std}>
                    Standard {std}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          <FormField
            control={form.control}
            name="class_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <Select
                  value={selectedSection}
                  onValueChange={(val) => {
                    setSelectedSection(val);
                    const match = classOptions.find(
                      (c) => c.name === selectedStandard && c.section === val
                    );
                    if (match) {
                      field.onChange(String(match.id));
                    }
                  }}
                  disabled={!selectedStandard}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSectionsForStandard.map((sec) => (
                      <SelectItem key={sec.id} value={sec.section}>
                        Section {sec.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* ✅ FIXED BLOOD GROUP */}
        <FormField
          control={form.control}
          name="bloodGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Group</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => (
                    <SelectItem key={bg.bg_id} value={bg.blood_group}>
                      {bg.blood_group}
                    </SelectItem>
                  ))}
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
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <h3 className="text-lg font-medium">Guardian Information</h3>

        <FormField
          control={form.control}
          name="fatherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Father's Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mother's Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Contact</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="secondaryContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary Contact (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guardian Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          {student ? "Update Student" : "Add Student"}
        </Button>
      </form>
    </Form>
  );
}
