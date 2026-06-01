"use client";

import { useState, useEffect } from "react";
import { FileText, Download, BookOpen, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";

interface Material {
  material_id: number;
  material_name: string;
  subject_name: string;
  class_name: string;
  section_name?: string;
  upload_date: string;
  file_path: string;
}

export const StudentMaterialsWidget = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const classId =
      typeof window !== "undefined" ? localStorage.getItem("class_id") : null;
    const url = classId
      ? `/api/materials?class_id=${classId}`
      : "/api/materials";

    api
      .get(url)
      .then((res) => {
        if (res.data.success) {
          setMaterials(res.data.data.slice(0, 3));
        }
      })
      .catch((err) => console.error("Failed to fetch materials:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (material: Material) => {
    try {
      setDownloadingId(material.material_id);
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        "";

      const res = await api.get(
        `/api/materials/download/${material.material_id}`,
        {
          responseType: "arraybuffer",
          headers: { Authorization: "Bearer " + token },
        }
      );

      const contentType = res.headers["content-type"];

      if (contentType?.includes("application/json")) {
        const json = JSON.parse(new TextDecoder("utf-8").decode(res.data));
        if (json.isExternal && json.url) {
          window.open(json.url, "_blank");
          return;
        }
      }

      const contentDisposition = res.headers["content-disposition"];
      let filename = material.file_path.split("/").pop() || "download";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Card className="border border-slate-100/80 shadow-sm bg-white overflow-hidden rounded-2xl h-full flex flex-col">
      <CardHeader className="p-6 pb-3 shrink-0 flex flex-row items-center justify-between border-b border-slate-50">
        <CardTitle className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          Study Materials
        </CardTitle>
        <BookOpen className="h-4 w-4 text-slate-400" />
      </CardHeader>

      <CardContent className="p-6 flex-grow flex flex-col">
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-2xl bg-slate-50/50 animate-pulse border border-slate-100/50"
                />
              ))}
            </div>
          ) : materials.length > 0 ? (
            materials.map((m) => (
              <div
                key={m.material_id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-100/80 hover:bg-slate-50/20 hover:border-slate-200 transition-all duration-300 group"
              >
                {/* Icon + Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[12px] font-extrabold text-slate-700 truncate leading-tight group-hover:text-primary transition-colors">
                      {m.material_name}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                      {m.subject_name}
                      {m.class_name ? ` · ${m.class_name}` : ""}
                      {m.section_name ? `-${m.section_name}` : ""}
                    </p>
                  </div>
                </div>

                {/* Date + Download */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 hidden sm:block">
                    {format(new Date(m.upload_date), "dd/MM/yyyy")}
                  </span>
                  <button
                    onClick={() => handleDownload(m)}
                    disabled={downloadingId === m.material_id}
                    className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center border transition-all duration-300",
                      downloadingId === m.material_id
                        ? "bg-slate-100 text-slate-300 border-slate-200 cursor-wait"
                        : "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {downloadingId === m.material_id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm font-bold">
                No materials available yet
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
          <Link
            href="/main/materials"
            className="flex items-center justify-center gap-2 text-[10px] font-bold text-blue-650 hover:text-blue-700 uppercase tracking-widest transition-colors"
          >
            View All Materials <ArrowUpRight size={12} className="stroke-[2.5]" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
