"use client";
 
import React, { useState, useRef, useEffect } from "react";
import {
  Download, CheckCircle2, Loader2,
  FileText, ZoomIn, ZoomOut, ArrowLeft
} from "lucide-react";
import { PaperState, getAllQuestions, getTotalAssignedMarks } from "../page";
import LivePaperPreview from "./LivePaperPreview";
import { useRouter } from "next/navigation";
import { generatePaperPDF, publishPaper } from "@/lib/api/question-paper";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
 
interface Props {
  paper: PaperState;
}
 
export default function PreviewStep({ paper }: Props) {
  const router        = useRouter();
  const contentRef    = useRef<HTMLDivElement>(null);
  const qpRef         = useRef<HTMLDivElement>(null);
  const akRef         = useRef<HTMLDivElement>(null);
  const [zoom, setZoom]                   = useState(0.75);
  const [contentH, setContentH]           = useState(0);
  const [includeKey, setIncludeKey]       = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing]   = useState(false);
  const [published, setPublished]         = useState(paper.status === "Published");
 
  useEffect(() => {
    if (window.innerWidth < 768) setZoom(0.45);
    const id = setInterval(() => {
      if (contentRef.current) setContentH(contentRef.current.scrollHeight);
    }, 400);
    return () => clearInterval(id);
  }, []);
 
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // 1. Dynamically collect all active stylesheet rules currently loaded in the browser document.
      let stylesString = "";
      try {
        const styleSheets = document.styleSheets;
        for (let i = 0; i < styleSheets.length; i++) {
          const sheet = styleSheets[i];
          try {
            const rules = sheet.cssRules;
            for (let j = 0; j < rules.length; j++) {
              stylesString += rules[j].cssText + "\n";
            }
          } catch (e) {
            // Fallback for cross-origin or local style tags
            if (sheet.ownerNode && sheet.ownerNode.textContent) {
              stylesString += sheet.ownerNode.textContent + "\n";
            }
          }
        }
      } catch (e) {
        console.warn("Failed to collect some stylesheets", e);
      }
 
      // Helper to compile a self-contained, pixel-perfect HTML document wrapper
      const compileHtml = (htmlContent: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${stylesString}
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-page-sheet {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 9mm 15mm 15mm 15mm !important;
              border: none !important;
              box-shadow: none !important;
              page-break-after: always !important;
              break-after: page !important;
              position: relative !important;
              overflow: hidden !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
            }
            .print-page-sheet .page-border-frame {
              position: absolute !important;
              top: 5mm !important;
              left: 5mm !important;
              right: 5mm !important;
              bottom: 5mm !important;
              border: 2px solid #000000 !important;
              z-index: 1000 !important;
              box-sizing: border-box !important;
              display: block !important;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;
 
      // Helper to download a URL blob to a filename
      const triggerDownload = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename.replace(/[\s/]+/g, "_") + ".pdf";
        link.click();
      };
 
      // Always download the Question Paper PDF
      const qpHtml = qpRef.current ? qpRef.current.innerHTML : "";
      const qpFullHtml = compileHtml(qpHtml);
      const qpUrl = await generatePaperPDF(paper.paper_id!, {
        generate_answer_key: false,
        generateAnswerKey: false,
        html: qpFullHtml
      });
      triggerDownload(qpUrl, paper.title || "question_paper");
 
      // Additionally generate and download Answer Key PDF if toggle is ON
      if (includeKey) {
        const akHtml = akRef.current ? akRef.current.innerHTML : "";
        const akFullHtml = compileHtml(akHtml);
        const akUrl = await generatePaperPDF(paper.paper_id!, {
          generate_answer_key: true,
          generateAnswerKey: true,
          html: akFullHtml
        });
        triggerDownload(akUrl, `${paper.title || "question_paper"}_Answer_Key`);
      }
    } catch (err) {
      console.error("PDF failed", err);
    } finally {
      setIsDownloading(false);
    }
  };
 
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishPaper(paper.paper_id!);
      setPublished(true);
    } catch (err) {
      console.error("Publish failed", err);
    } finally {
      setIsPublishing(false);
    }
  };
 
  const totalQ      = getAllQuestions(paper).length;
  const totalMarks  = getTotalAssignedMarks(paper);
 
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
   
        {/* ── Paper Preview ── */}
        <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 relative min-h-[500px] lg:h-[780px] overflow-hidden">
   
          {/* Zoom controls */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1">
            <button
              onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-bold text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
   
          {/* Scrollable preview area */}
          <div className="w-full h-full overflow-auto p-6">
            <div
              className="relative transition-all duration-200"
              style={{
                width:  `calc(210mm * ${zoom})`,
                height: contentH > 0 ? `calc(${contentH}px * ${zoom})` : "auto",
                margin: "0 auto",
              }}
            >
              <div
                ref={contentRef}
                className="absolute top-0 left-0 origin-top-left"
                style={{ transform: `scale(${zoom})`, width: "210mm" }}
              >
                <LivePaperPreview paper={paper} showAnswers={includeKey} fullSize />
              </div>
            </div>
          </div>
        </div>
   
        {/* ── Controls Panel ── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
   
          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h2 className="text-base font-black text-slate-900">Paper Ready</h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">Your question paper is formatted and ready to download.</p>
   
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Questions", value: totalQ },
                { label: "Total Marks", value: paper.total_marks },
                { label: "Assigned", value: totalMarks },
                { label: "Class", value: paper.class_name || "—" },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
   
            {/* PDF Options */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Export Options</p>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold">Generate Answer Key</Label>
                  <p className="text-[10px] text-slate-400">Downloads additional Answer PDF</p>
                </div>
                <Switch checked={includeKey} onCheckedChange={setIncludeKey} />
              </div>
            </div>
   
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading || !paper.paper_id}
                className="w-full flex items-center justify-center gap-2 h-11 bg-[#3335e3] hover:bg-[#3335e3]/90 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </button>
   
              {!published ? (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !paper.paper_id}
                  className="w-full flex items-center justify-center gap-2 h-11 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Publish to Portal
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 h-11 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-black text-green-700 uppercase tracking-wider">Published!</span>
                </div>
              )}
            </div>
          </div>
   
          {/* Paper ID Card */}
          {paper.paper_id && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Paper Details</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Paper ID</span>
                  <span className="font-bold text-slate-800">#QP-{paper.paper_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject</span>
                  <span className="font-bold text-slate-800 truncate max-w-[120px]">{paper.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class</span>
                  <span className="font-bold text-slate-800">{paper.class_name}</span>
                </div>
              </div>
            </div>
          )}
   
          <button
            onClick={() => router.push("/main/paper-generator")}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </button>
        </div>
      </div>

      {/* Hidden containers for PDF generation */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "210mm" }}>
        <div ref={qpRef}>
          <LivePaperPreview paper={paper} showAnswers={false} fullSize />
        </div>
        <div ref={akRef}>
          <LivePaperPreview paper={paper} showAnswers={true} fullSize />
        </div>
      </div>
    </>
  );
}
