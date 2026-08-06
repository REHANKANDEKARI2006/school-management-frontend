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
      // Self-contained CSS that exactly matches LivePaperPreview.tsx rendering
      const paperCSS = `
        @page {
          size: A4;
          margin: 0;
        }
        * { box-sizing: border-box; }
        body {
          font-family: 'Times New Roman', Times, serif;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a;
          line-height: 1.2;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ── Page Sheet ── */
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
        .print-page-sheet:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }

        /* ── Page Border Frame ── */
        .page-border-frame {
          position: absolute !important;
          top: 5mm !important;
          left: 5mm !important;
          right: 5mm !important;
          bottom: 5mm !important;
          border: 2px solid #000000 !important;
          z-index: 1000 !important;
          box-sizing: border-box !important;
          display: block !important;
          pointer-events: none;
        }

        /* ── Watermark ── */
        .watermark-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          pointer-events: none;
          z-index: 0;
          user-select: none;
          white-space: nowrap;
          font-size: 90px;
          font-weight: 800;
          opacity: 0.025;
          color: #0f172a;
        }

        /* ── Hide the page number footer in PDF ── */
        .page-number-footer { display: none !important; }
        /* ── Hide measurement and preview-only elements ── */
        .measurement-container { display: none !important; }

        /* ── School Header ── */
        .school-name-text {
          font-size: 20pt;
          font-weight: 900;
          text-transform: uppercase;
          text-align: center;
          letter-spacing: 0.5px;
          line-height: 1.1;
          margin: 0;
          color: #000;
        }
        .school-institution-text {
          font-size: 8pt;
          color: #475569;
          font-weight: 500;
          text-align: center;
          margin: 2pt 0 0 0;
        }

        /* ── Double Divider ── */
        .double-divider {
          border-top: 3px solid #000;
          border-bottom: 1px solid #000;
          height: 2px;
          margin-bottom: 4pt;
          margin-top: 4pt;
        }

        /* ── Info Rows ── */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 1pt;
        }
        .info-grid > *:nth-child(1) { text-align: left; }
        .info-grid > *:nth-child(2) { text-align: center; }
        .info-grid > *:nth-child(3) { text-align: right; }
        .info-title {
          font-weight: 900;
          text-decoration: underline;
          font-size: 10pt;
        }

        /* ── Instructions ── */
        .instructions-box {
          border: 1px solid #000;
          padding: 6px 10px;
          margin-top: 5pt;
          margin-bottom: 8pt;
          font-size: 8pt;
        }
        .instructions-title {
          font-weight: 900;
          text-transform: uppercase;
          text-decoration: underline;
          margin-bottom: 2pt;
          font-size: 8.5pt;
        }
        .instruction-line {
          display: flex;
          gap: 6px;
          margin-bottom: 1pt;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.2;
        }

        /* ── Section Separator ── */
        .section-separator {
          border-top: 2px solid #000;
          margin-bottom: 10pt;
          margin-top: 5pt;
        }

        /* ── Section Header ── */
        .section-header-center {
          text-align: center;
          padding-left: 70pt;
          padding-right: 70pt;
        }
        .section-letter {
          font-weight: bold;
          font-size: 11pt;
          color: #0f172a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .section-subtitle {
          font-weight: bold;
          font-size: 10.5pt;
          color: #0f172a;
          letter-spacing: 0.5px;
          margin-top: 2pt;
        }
        .section-marks {
          font-size: 9.5pt;
          font-weight: 900;
          color: #0f172a;
          white-space: nowrap;
        }

        /* ── Subsection Header ── */
        .subsection-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          width: 100%;
          padding-top: 4pt;
          padding-bottom: 2pt;
          margin-top: 4pt;
          margin-bottom: 2pt;
        }
        .subsection-title {
          font-weight: bold;
          font-size: 10pt;
          color: #0f172a;
          letter-spacing: 0.5px;
        }
        .subsection-marks {
          font-size: 9.5pt;
          font-weight: bold;
          color: #1e293b;
          white-space: nowrap;
        }

        /* ── Question Items ── */
        .question-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 30px;
          margin-top: 8pt;
          page-break-inside: avoid;
          width: 100%;
          padding-left: 8px;
        }
        .q-roman {
          font-weight: normal;
          font-size: 10pt;
          width: 32px;
          text-align: right;
          flex-shrink: 0;
        }
        .q-body {
          flex: 1;
          min-width: 0;
        }
        .q-text {
          font-size: 10pt;
          font-weight: normal;
          color: #0f172a;
          line-height: 1.2;
          white-space: pre-wrap;
        }
        .q-marks {
          font-size: 9pt;
          font-weight: normal;
          color: #334155;
          white-space: nowrap;
          width: 70px;
          text-align: right;
          flex-shrink: 0;
        }

        /* ── MCQ 2-column Grid ── */
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2pt 15pt;
          margin-top: 4pt;
        }
        .option-item {
          display: flex;
          gap: 6px;
          font-size: 9.5pt;
          font-weight: normal;
          page-break-inside: avoid;
        }
        .option-label { font-weight: bold; }

        /* ── True/False ── */
        .tf-container {
          display: flex;
          gap: 20pt;
          margin-top: 4pt;
        }
        .tf-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9.5pt;
          font-weight: normal;
        }
        .tf-circle {
          height: 9pt;
          width: 9pt;
          border-radius: 50%;
          border: 1.5px solid #000;
          display: inline-block;
        }

        /* ── Match Table ── */
        .match-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4pt;
          font-size: 9pt;
        }
        .match-table th, .match-table td {
          border: 1px solid #000;
          padding: 3pt 8pt;
          text-align: left;
        }
        .match-table th {
          background-color: #f8fafc;
          font-weight: 900;
        }
        .match-table td { font-weight: normal; }

        /* ── Passage Box ── */
        .passage-box {
          border: 1px solid #000;
          padding: 8pt;
          margin-top: 6pt;
          margin-bottom: 6pt;
          background-color: #ffffff;
          font-size: 9.5pt;
          font-weight: 500;
          line-height: 1.3;
          white-space: pre-wrap;
        }

        /* ── Fill Blanks Line ── */
        .fill-blank-line {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 80px;
        }

        /* ── Answers ── */
        .answer-block {
          margin-top: 3pt;
          margin-left: 12px;
          padding: 4px 8px;
          border-left: 2px solid #15803d;
          background: rgba(240, 253, 244, 0.3);
        }
        .answer-label {
          font-size: 9pt;
          font-weight: bold;
          color: #15803d;
        }
        .answer-text {
          font-size: 9.5pt;
          font-weight: bold;
          color: #15803d;
          white-space: pre-wrap;
          line-height: 1.2;
        }

        /* ── Footer Asterisks ── */
        .paper-footer {
          margin-top: 20pt;
          text-align: center;
          font-size: 11pt;
          font-weight: 900;
          letter-spacing: 5px;
          color: #1e293b;
          page-break-inside: avoid;
        }

        /* ── Bullets / Letter ── */
        .bullets-box {
          margin-top: 4pt;
          border-left: 2px solid #cbd5e1;
          padding-left: 10pt;
          margin-left: 10pt;
        }
        .bullet-line {
          font-size: 9.5pt;
          font-weight: normal;
          display: flex;
          gap: 6px;
          line-height: 1.2;
        }

        /* ── Word Limit ── */
        .word-limit-inline {
          font-size: 8.5pt;
          font-weight: normal;
          font-style: italic;
          color: #64748b;
          display: inline;
          margin-left: 6px;
        }

        /* ── Diagram ── */
        .diagram-box {
          margin-top: 6pt;
          margin-bottom: 6pt;
          max-width: 280px;
        }
        .diagram-box img {
          max-height: 220px;
          max-width: 100%;
          object-fit: contain;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }

        /* ── Diagram Labels Grid ── */
        .labels-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3pt;
          margin-top: 4pt;
        }
        .label-item {
          display: flex;
          gap: 6px;
          font-size: 9.5pt;
          font-weight: normal;
        }

        /* ── Case Based Sub-questions ── */
        .case-sub-questions {
          margin-top: 5pt;
          margin-left: 15pt;
        }
        .case-sub-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          margin-top: 4pt;
          page-break-inside: avoid;
        }
        .case-sub-label {
          font-weight: normal;
          font-size: 9.5pt;
          flex-shrink: 0;
        }
        .case-sub-text {
          font-size: 9.5pt;
          font-weight: normal;
          color: #0f172a;
          line-height: 1.2;
          flex: 1;
        }
        .case-sub-marks {
          font-size: 9pt;
          font-weight: normal;
          color: #475569;
          flex-shrink: 0;
          white-space: nowrap;
        }

        /* ── Activity / Sub-question ── */
        .activity-item {
          margin-top: 8pt;
          page-break-inside: avoid;
        }
        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 30px;
          margin-bottom: 4pt;
        }
        .activity-title {
          font-size: 9.5pt;
          font-weight: 900;
          color: #0f172a;
        }
        .activity-marks {
          font-size: 9.5pt;
          font-weight: 900;
          color: #0f172a;
          white-space: nowrap;
        }
        .sub-questions-list {
          padding-left: 15pt;
        }
        .sub-question-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          margin-top: 4pt;
          page-break-inside: avoid;
          width: 100%;
        }
        .sub-q-roman {
          font-weight: normal;
          font-size: 9.5pt;
          width: 25px;
          text-align: right;
          flex-shrink: 0;
        }
        .sub-q-text {
          font-size: 9.5pt;
          font-weight: normal;
          color: #0f172a;
          line-height: 1.2;
          white-space: pre-wrap;
          flex: 1;
        }

        /* ── Hide the outer space-y wrapper's first child (LivePaperPreview controls) ── */
        .space-y-6 > div:first-child {
          display: none !important;
        }
        .print\\:hidden { display: none !important; }
      `;

      // Also collect Tailwind utility CSS from the browser (needed for className attributes in innerHTML)
      let tailwindCSS = "";
      try {
        const styleSheets = document.styleSheets;
        for (let i = 0; i < styleSheets.length; i++) {
          const sheet = styleSheets[i];
          try {
            const rules = sheet.cssRules;
            for (let j = 0; j < rules.length; j++) {
              tailwindCSS += rules[j].cssText + "\n";
            }
          } catch (e) {
            if (sheet.ownerNode && (sheet.ownerNode as HTMLElement).textContent) {
              tailwindCSS += (sheet.ownerNode as HTMLElement).textContent + "\n";
            }
          }
        }
      } catch (e) {
        console.warn("Failed to collect some stylesheets", e);
      }

      // Helper to compile a self-contained HTML document for PDF
      // Tailwind CSS goes first, then our explicit paper CSS overrides where needed
      const compileHtml = (htmlContent: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${tailwindCSS}</style>
          <style>${paperCSS}</style>
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
      const qpHtml = contentRef.current ? contentRef.current.innerHTML : "";
      const qpFullHtml = compileHtml(qpHtml);
      const qpUrl = await generatePaperPDF(paper.paper_id!, {
        generate_answer_key: false,
        generateAnswerKey: false,
        html: qpFullHtml
      });
      triggerDownload(qpUrl, paper.title || "question_paper");
 
      // Additionally generate and download Answer Key PDF if toggle is ON
      if (includeKey) {
        const akHtml = contentRef.current ? contentRef.current.innerHTML : "";
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
