"use client";

import React, { useState } from "react";
import { Download, Printer, CheckCircle2, Loader2, FileText, Settings, Key, ArrowLeft } from "lucide-react";
import { PaperState } from "../page";
import LivePaperPreview from "./LivePaperPreview";
import { useRouter } from "next/navigation";
import { generatePaperPDF, publishPaper } from "@/lib/api/question-paper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Props {
  paper: PaperState;
}

export default function PreviewPrintStep({ paper }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [includeKey, setIncludeKey] = useState(false);
  const [published, setPublished] = useState(paper.status === "Published");

  const handleDownload = async () => {
    setLoading(true);
    try {
      const url = await generatePaperPDF(paper.paper_id!, { generate_answer_key: includeKey });
      const link = document.createElement("a");
      link.href = url;
      link.download = `${paper.title.replace(/\s+/g, "_")}.pdf`;
      link.click();
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      await publishPaper(paper.paper_id!);
      setPublished(true);
    } catch (err) {
      console.error("Publish failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-[#1e293b]">
      {/* Left: Premium PDF Preview */}
      <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-slate-900/50 relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] h-fit">
            <LivePaperPreview paper={paper} fullSize />
        </div>
      </div>

      {/* Right: Controls */}
      <div className="w-96 bg-white border-l h-full flex flex-col shadow-2xl">
        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="text-xl font-black uppercase tracking-tight">Paper Finalized</h2>
            </div>
            <p className="text-sm text-muted-foreground">Your question paper is ready for distribution.</p>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Settings className="h-3 w-3" /> PDF Export Settings
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-700">Include Answer Key</Label>
                  <p className="text-[10px] text-muted-foreground">Appends correct answers to the end</p>
                </div>
                <Switch checked={includeKey} onCheckedChange={setIncludeKey} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-700">Official Branding</Label>
                  <p className="text-[10px] text-muted-foreground font-medium text-primary">Always Enabled</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary">Branded</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleDownload} 
                disabled={loading} 
                className="w-full h-12 rounded-2xl gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                Download Question Paper
              </Button>
              
              {!published ? (
                <Button 
                  onClick={handlePublish}
                  variant="outline" 
                  disabled={loading}
                  className="w-full h-12 rounded-2xl gap-2 border-slate-200"
                >
                  {loading ? <Loader2 className="h-5 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-slate-400" />}
                  Publish to Dashboard
                </Button>
              ) : (
                <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Published to Portal</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
             <div className="p-4 rounded-xl bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                   <span>Paper ID</span>
                   <span className="text-slate-900">#QP-{paper.paper_id}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                   <span>Created For</span>
                   <span className="text-slate-900 truncate max-w-[150px]">{paper.class_name} • {paper.subject}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t">
          <Button 
            variant="ghost" 
            className="w-full gap-2 text-slate-500 hover:text-slate-900"
            onClick={() => router.push("/main/paper-generator")}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </Button>
        </div>
      </div>
    </div>
  );
}
