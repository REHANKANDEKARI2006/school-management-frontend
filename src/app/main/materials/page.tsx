"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import RouteGuard from "@/components/auth/RouteGuard";
import axios from "@/lib/axios";
import { PageSkeleton } from "@/components/ui/skeletons";
import { format } from "date-fns";

import { MoreHorizontal, PlusCircle, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MaterialForm, type Material } from "@/components/campus-connect/material-form";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/components/campus-connect/search-provider";

const initialMaterials: Material[] = [
  {
    id: "1",
    name: "Introduction to Algebra",
    subject_id: "1",
    class_id: "1",
    fileType: "PDF",
    date: new Date("2024-07-15"),
  },
];

const getFileTypeVariant = (fileType: string): "outline" | "default" | "secondary" => {
  switch (fileType) {
    case "PDF": return "outline";
    case "DOCX": return "default";
    case "PPTX": return "secondary";
    case "VIDEO": return "outline";
    default: return "secondary";
  }
};

import { ROLE, RoleId, ADMIN_GROUP } from "@/config/roles";

export default function MaterialsPage() {
  const { toast } = useToast();
  const { searchQuery } = useSearch();

  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;
  const isStudent = roleId === ROLE.STUDENT;
  const studentClassId = typeof window !== "undefined" ? localStorage.getItem("class_id") : null;

  const [materials, setMaterials] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<any | null>(null);

  const fetchMaterials = async () => {
    try {
      const url = isStudent && studentClassId ? `/api/materials?class_id=${studentClassId}` : "/api/materials";
      const res = await axios.get(url);
      if (res.data.success) {
        setMaterials(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch materials", error);
      toast({ title: "Error", description: "Failed to load materials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [isStudent, studentClassId]);

  const handleCreateMaterial = async (data: any) => {
    try {
      if (Array.isArray(data)) {
        await Promise.all(data.map(item => axios.post('/api/materials', item)));
        toast({ title: "Success", description: "All materials uploaded successfully" });
      } else {
        await axios.post('/api/materials', data);
        toast({ title: "Success", description: "Material uploaded successfully" });
      }
      setIsFormOpen(false);
      fetchMaterials();
    } catch (error) {
      console.error("Failed to create material", error);
      toast({ title: "Error", description: "Failed to save material", variant: "destructive" });
    }
  };

  const getFilesList = (filePath: string) => {
    if (!filePath) return [];
    return filePath.split(",").map((url) => {
      const parts = url.split("/");
      const filename = parts.pop() || "";
      const cleanName = filename.replace(/^\d+_/, "");
      return { url, name: cleanName };
    });
  };

  const handleViewIndividualFile = async (material: any, fileIndex: number) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      const res = await axios.get(`/api/materials/download/${material.material_id}?view=true`, {
        responseType: 'json',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      if (res.data.success) {
        const url = (res.data.urls && res.data.urls[fileIndex]) || res.data.url;
        if (url) {
          window.open(url, "_blank");
        } else {
          throw new Error("Failed to load view URL");
        }
      } else {
        throw new Error("Failed to load view URL");
      }
    } catch (error: any) {
      console.error("Failed to view material file:", error);
      toast({ title: "Error", description: "Failed to view material file", variant: "destructive" });
    }
  };

  const handleDownloadIndividualFile = async (material: any, fileIndex: number, filename: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      const res = await axios.get(`/api/materials/download/${material.material_id}`, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      const contentType = res.headers['content-type'];

      if (contentType && contentType.includes('application/json')) {
        const jsonStr = new TextDecoder('utf-8').decode(res.data);
        const jsonData = JSON.parse(jsonStr);

        if (jsonData.isExternal && (jsonData.url || jsonData.urls)) {
          const url = (jsonData.urls && jsonData.urls[fileIndex]) || jsonData.url;
          if (url) {
            window.open(url, "_blank");
            toast({ title: "Success", description: `Opening ${filename}` });
            return;
          }
        }
        if (!jsonData.success) {
          throw new Error(jsonData.message || "Failed to download");
        }
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Download successful" });
    } catch (error: any) {
      console.error("Failed to download material file:", error);
      toast({ title: "Error", description: "Failed to download material file", variant: "destructive" });
    }
  };

  const handleView = async (material: any) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
      const res = await axios.get(`/api/materials/download/${material.material_id}?view=true`, {
        responseType: 'json',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      if (res.data.success) {
        if (res.data.urls && res.data.urls.length > 0) {
          res.data.urls.forEach((url: string) => {
            window.open(url, "_blank");
          });
        } else if (res.data.url) {
          window.open(res.data.url, "_blank");
        } else {
          throw new Error("Failed to load view URL");
        }
      } else {
        throw new Error("Failed to load view URL");
      }
    } catch (error: any) {
      console.error("Failed to view material:", error);
      toast({ title: "Error", description: "Failed to view material", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      const res = await axios.delete(`/api/materials/${id}`);
      if (res.data.success) {
        toast({ title: "Success", description: "Material deleted successfully" });
        fetchMaterials();
      }
    } catch (error) {
      console.error("Failed to delete material", error);
      toast({ title: "Error", description: "Failed to delete material", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (material: any) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

      const res = await axios.get(`/api/materials/download/${material.material_id}`, {
        responseType: 'arraybuffer', // Using arraybuffer enables parsing JSON or Blob manually based on header
        headers: {
          Authorization: 'Bearer ' + token
        }
      });

      const contentType = res.headers['content-type'];

      // 1. Backend returned JSON (either Google drive link or Error)
      if (contentType && contentType.includes('application/json')) {
        const jsonStr = new TextDecoder('utf-8').decode(res.data);
        const jsonData = JSON.parse(jsonStr);

        if (jsonData.isExternal && (jsonData.url || jsonData.urls)) {
          if (jsonData.urls && jsonData.urls.length > 0) {
            jsonData.urls.forEach((url: string) => {
              window.open(url, "_blank");
            });
          } else if (jsonData.url) {
            window.open(jsonData.url, "_blank");
          }
          toast({ title: "Success", description: "Opening External Link(s)" });
          return;
        }

        if (!jsonData.success) {
          throw new Error(jsonData.message || "Failed to download");
        }
      }

      // 2. Backend returned a Stream (Cloudinary File)
      // Get filename from content-disposition header or fallback
      const contentDisposition = res.headers['content-disposition'];
      let filename = (material.file_path.split(',')[0] || '').split('/').pop() || 'downloaded_file';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Download successful" });
    } catch (error: any) {
      console.error("Failed to download material detail:", error);
      let errorMessage = "Failed to download material";

      // If Axios threw a specific Network or HTTP Error
      if (error.response?.data) {
        try {
          if (error.response.data instanceof Blob) {
            const text = await error.response.data.text();
            const json = JSON.parse(text);
            errorMessage = json.message || errorMessage;
            console.error("Server returned Blob error:", json);
          } else {
            // If response type was arraybuffer, decode it back to string
            const text = new TextDecoder('utf-8').decode(error.response.data);
            const json = JSON.parse(text);
            errorMessage = json.message || errorMessage;
            console.error("Server returned Error:", json);
          }
        } catch (e) {
          console.error("Failed to parse arraybuffer or blob error", e);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materials;
    return materials.filter(m =>
      m.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.class_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, materials]);

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ROLE.TEACHER, ROLE.CLASS_TEACHER, ROLE.STUDENT]}>
      <>
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Materials</CardTitle>
                <CardDescription>Study materials</CardDescription>
              </div>
              {!isStudent && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Upload
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <PageSkeleton rows={4} />
                    </TableCell>
                  </TableRow>
                ) : filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No materials found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map(material => (
                    <TableRow key={material.material_id}>
                      <TableCell>
                        <div className="font-medium text-slate-800">{material.material_name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {material.class_name}{material.section_name ? ` - ${material.section_name}` : ""} • {material.subject_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Document
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(material.upload_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                               onClick={() => {
                                 setActiveMaterial(material);
                                 setIsViewOpen(true);
                               }}
                             >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownload(material)}
                              disabled={downloadingId === material.material_id}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {downloadingId === material.material_id ? "Downloading..." : "Download"}
                            </DropdownMenuItem>
                            {!isStudent && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDelete(material.material_id)}
                                disabled={deletingId === material.material_id}
                              >
                                {deletingId === material.material_id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[94vw] sm:max-w-[425px] rounded-2xl left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
            <DialogHeader>
              <DialogTitle>Upload Material</DialogTitle>
              <DialogDescription>Add study material</DialogDescription>
            </DialogHeader>
            <MaterialForm 
              onSubmit={handleCreateMaterial} 
              onCancel={() => setIsFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="w-[94vw] sm:max-w-[500px] rounded-2xl left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
            <DialogHeader>
              <DialogTitle>Attached Documents</DialogTitle>
              <DialogDescription>
                Files for: <span className="font-semibold text-slate-800">{activeMaterial?.material_name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {activeMaterial?.file_path && getFilesList(activeMaterial.file_path).map((file: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[260px]" title={file.name}>
                    {file.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewIndividualFile(activeMaterial, idx)}
                      className="text-xs font-bold text-indigo-650 hover:text-indigo-850 hover:bg-indigo-50/50 px-2.5 h-8"
                    >
                      View
                    </Button>
                    <span className="text-slate-200">|</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadIndividualFile(activeMaterial, idx, file.name)}
                      className="text-xs font-bold text-indigo-650 hover:text-indigo-850 hover:bg-indigo-50/50 px-2.5 h-8"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    </RouteGuard>
  );
}