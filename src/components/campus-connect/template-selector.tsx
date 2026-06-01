"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Download, Loader2, Users, X, FileCheck, CreditCard, GraduationCap, Search, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LockedTemplateEditor } from "./locked-template-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import axios from "@/lib/axios";

export type DocType = "ID_CARD" | "BONAFIDE" | "ACHIEVEMENT" | "MARK_SHEET" | "FEE_RECEIPT" | "LEAVING_CERTIFICATE";

interface Template { id: string; name: string; desc: string; preview: React.ReactNode; isCustom?: boolean; }
interface StudentItem { id: number; name: string; className: string; avatar?: string; initials: string; }
interface TemplateSelectorProps { 
  documentType: DocType; 
  onClose: () => void; 
  currentDefault?: string;
  onSetDefault?: (templateId: string) => void;
}

// ─── Mini Thumbnail Previews ───────────────────────────────────────────────────
// Portrait ID Card — matches new template1 design (navy header, gold line, circular photo, detail rows, navy footer)
const T1Preview = ({ color = "#1a2456" }: { color?: string }) => (
  <div style={{ width: 90, height: 143, background: "#fff", position: "relative", overflow: "hidden", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
    {/* Navy header */}
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48, background: color }} />
    {/* Gold accent line */}
    <div style={{ position: "absolute", top: 45, left: 0, right: 0, height: 1.5, background: "#c9a84c" }} />
    {/* School logo circle in header */}
    <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: "#fff", border: "1.5px solid #c9a84c", zIndex: 4 }} />
    {/* School name text */}
    <div style={{ position: "absolute", top: 26, left: 6, right: 6, height: 5, background: "rgba(255,255,255,0.65)", borderRadius: 2 }} />
    <div style={{ position: "absolute", top: 34, left: 12, right: 12, height: 3, background: "rgba(255,255,255,0.4)", borderRadius: 2 }} />
    {/* Student photo circle overlapping header */}
    <div style={{ position: "absolute", top: 37, left: "50%", transform: "translateX(-50%)", width: 26, height: 26, borderRadius: "50%", background: "#e2e8f0", border: "2px solid #fff", zIndex: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
    {/* Student name */}
    <div style={{ position: "absolute", top: 66, left: 8, right: 8, height: 5, background: "#1e293b", borderRadius: 2, opacity: 0.85 }} />
    {/* Class badge */}
    <div style={{ position: "absolute", top: 74, left: "50%", transform: "translateX(-50%)", width: 36, height: 6, borderRadius: 10, border: `1px solid ${color}`, opacity: 0.3 }} />
    {/* Detail rows with icon dots */}
    {[82, 91, 100, 109, 118].map((top, i) => (
      <div key={i} style={{ position: "absolute", top, left: 6, right: 6, display: "flex", alignItems: "center", gap: 2 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, opacity: 0.6, flexShrink: 0 }} />
        <div style={{ height: 3, background: color, borderRadius: 2, width: "30%", opacity: 0.5 }} />
        <div style={{ height: 3, background: "#e2e8f0", borderRadius: 2, flex: 1 }} />
      </div>
    ))}
    {/* Navy footer */}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 9, background: color }} />
    <div style={{ position: "absolute", bottom: 9, left: 0, right: 0, height: 1, background: "#c9a84c" }} />
  </div>
);

// Landscape ID Card — matches new template2 design (navy left panel, white right panel, full-width navy footer)
const T2Preview = ({ color = "#1a2456" }: { color?: string }) => (
  <div style={{ width: 143, height: 90, background: "#fff", position: "relative", overflow: "hidden", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", flex: 1 }}>
      {/* Left navy panel */}
      <div style={{ width: 46, background: color, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 4px 4px", gap: 4 }}>
        {/* Logo circle */}
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", border: "1.5px solid #c9a84c", flexShrink: 0 }} />
        {/* Student photo rect */}
        <div style={{ width: 22, height: 22, borderRadius: 2, background: "#e2e8f0", border: "1.5px solid #fff", flexShrink: 0 }} />
        {/* Gold divider */}
        <div style={{ width: "80%", height: 1, background: "#c9a84c" }} />
        {/* School name */}
        <div style={{ width: "80%", height: 3, background: "rgba(255,255,255,0.6)", borderRadius: 2 }} />
        <div style={{ width: "65%", height: 2, background: "rgba(255,255,255,0.35)", borderRadius: 2 }} />
      </div>
      {/* Right white panel */}
      <div style={{ flex: 1, padding: "6px 6px 4px" }}>
        <div style={{ height: 6, background: "#1e293b", borderRadius: 2, width: "75%", marginBottom: 2 }} />
        <div style={{ height: 3, background: color, borderRadius: 2, width: "45%", marginBottom: 4, opacity: 0.6 }} />
        <div style={{ height: 1, background: "#e2e8f0", marginBottom: 4 }} />
        {[1,2,3,4].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: color, opacity: 0.5, flexShrink: 0 }} />
            <div style={{ height: 2.5, background: color, borderRadius: 2, width: "30%", opacity: 0.45 }} />
            <div style={{ height: 2.5, background: "#e2e8f0", borderRadius: 2, flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
    {/* Full-width navy footer */}
    <div style={{ height: 9, background: color, flexShrink: 0, position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "#c9a84c" }} />
    </div>
  </div>
);

const BonafidePreview = ({ variant = 1 }: { variant?: number }) => {
  const styles: Record<number, React.CSSProperties> = {
    1: { background: "#fff" },
    2: { background: "#fff" },
    3: { background: "#fff" },
    4: { background: "linear-gradient(135deg,#fff 0%,#f1f5f9 100%)" },
  };
  return (
    <div style={{ width: 120, height: 170, ...styles[variant], position: "relative", overflow: "hidden", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
      {variant === 1 && <><div style={{ height: 2, background: "#437ef1", position: "absolute", top: 6, left: 6, right: 6 }} /><div style={{ height: 2, background: "#437ef1", position: "absolute", bottom: 6, left: 6, right: 6 }} /></>}
      {variant === 2 && <div style={{ height: 8, background: "#f8fafc", position: "absolute", top: 0, left: 0, right: 0, borderBottom: "2px solid #437ef1" }} />}
      {variant === 4 && <div style={{ width: 8, background: "#437ef1", position: "absolute", top: 0, left: 0, bottom: 0 }} />}
      <div style={{ padding: variant === 4 ? "12px 10px 10px 16px" : "12px 10px", display: "flex", flexDirection: "column", gap: 5, marginTop: variant === 2 ? 10 : 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#e2e8f0", margin: "0 auto" }} />
        <div style={{ height: 5, background: "#1e293b", borderRadius: 2, width: "80%", margin: "2px auto" }} />
        <div style={{ height: 3, background: "#94a3b8", borderRadius: 2, width: "60%", margin: "0 auto 4px" }} />
        {[1,2,3,4].map(i => <div key={i} style={{ height: 3, background: "#f1f5f9", borderRadius: 2 }} />)}
      </div>
    </div>
  );
};

const AchievementPreview = () => (
  <div style={{ width: 170, height: 120, background: "#fffdf7", position: "relative", overflow: "hidden", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
    <div style={{ position: "absolute", inset: 5, border: "2px solid #d97706", borderRadius: 3 }} />
    <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fef3c7", border: "2px solid #d97706" }} />
      <div style={{ height: 5, background: "#d97706", borderRadius: 2, width: "60%" }} />
      <div style={{ height: 3, background: "#94a3b8", borderRadius: 2, width: "70%" }} />
      <div style={{ height: 6, background: "#1e293b", borderRadius: 2, width: "55%" }} />
      <div style={{ height: 1, background: "#d97706", width: "50%" }} />
      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 2, width: "70%" }} />
    </div>
  </div>
);



const LeavingCertPreview = () => (
  <div style={{ width: 100, height: 140, background: "#fff", position: "relative", overflow: "hidden", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", padding: "10px", display: "flex", flexDirection: "column" }}>
    <div style={{ position: "absolute", top: 4, left: 4, right: 4, bottom: 4, border: "2px solid #1e293b", borderStyle: "dashed" }} />
    <div style={{ textAlign: "center", marginBottom: 6, zIndex: 1 }}>
      <div style={{ height: 4, background: "#1e293b", width: "70%", margin: "0 auto 2px" }} />
      <div style={{ height: 3, background: "#64748b", width: "50%", margin: "0 auto" }} />
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, zIndex: 1, padding: "0 4px" }}>
      {[1,2,3,4,5,6,7].map(i => (
        <div key={i} style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#94a3b8" }} />
          <div style={{ height: 2, background: "#cbd5e1", flex: 1 }} />
        </div>
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", zIndex: 1, padding: "0 4px" }}>
      <div style={{ height: 2, background: "#1e293b", width: 20 }} />
      <div style={{ height: 2, background: "#1e293b", width: 20 }} />
      <div style={{ height: 2, background: "#1e293b", width: 20 }} />
    </div>
  </div>
);

// ─── Template Configs per doc type ────────────────────────────────────────────
function getTemplates(type: DocType): Template[] {
  if (type === "ID_CARD") return [
    { id: "template1", name: "Portrait ID Card", desc: "Vertical card — navy header, circular photo, icon detail rows", preview: <T1Preview /> },
    { id: "template2", name: "Landscape ID Card", desc: "Horizontal card — navy sidebar, white panel, full-width footer", preview: <T2Preview /> },
  ];
  if (type === "BONAFIDE") return [
    { id: "template1", name: "Formal Standard", desc: "Classic institutional layout", preview: <BonafidePreview variant={1} /> },
    { id: "template2", name: "Modern Corporate", desc: "Clean professional style", preview: <BonafidePreview variant={2} /> },
  ];
  if (type === "LEAVING_CERTIFICATE") return [
    { id: "template1", name: "Standard Leaving Cert", desc: "Official leaving certificate design with decorative border", preview: <LeavingCertPreview /> }
  ];
  switch (type) {
    case "ACHIEVEMENT":
      return [
        { id: "template1", name: "Certificate of Recognition", desc: "Unified landscape certificate design", preview: <AchievementPreview /> }
      ];
    case "MARK_SHEET":
      return [
        { id: "template1", name: "Standard Report", desc: "Classic progress report", preview: <MarkSheetPreview variant={1} /> },
        { id: "template2", name: "Premium Report", desc: "Premium bordered design", preview: <MarkSheetPreview variant={2} /> }
      ];
    case "FEE_RECEIPT":
      return [
        { id: "template1", name: "Standard Receipt", desc: "Dual copy fee receipt", preview: <FeeReceiptPreview /> }
      ];
    default: return [];
  }
}

function getApiPaths(type: DocType) {
  const map: Record<DocType, { single: string; bulk: string }> = {
    ID_CARD:     { single: "id-card",            bulk: "id-card/bulk" },
    BONAFIDE:    { single: "bonafide",            bulk: "bonafide/bulk" },
    ACHIEVEMENT: { single: "general-certificate", bulk: "general-certificate/bulk" },
    MARK_SHEET:  { single: "mark-sheet",          bulk: "mark-sheet/bulk" },
    FEE_RECEIPT: { single: "fee-receipt",         bulk: "fee-receipt/bulk" },
    LEAVING_CERTIFICATE: { single: "leaving-certificate", bulk: "leaving-certificate/bulk" }
  };
  return map[type] || { single: "", bulk: "" };
}

function getTypeLabel(type: DocType) {
  const map: Record<DocType, string> = { 
    ID_CARD: "ID Card", 
    BONAFIDE: "Bonafide Certificate", 
    ACHIEVEMENT: "Achievement Certificate",
    MARK_SHEET: "Marksheet",
    FEE_RECEIPT: "Fee Receipt",
    LEAVING_CERTIFICATE: "Leaving Certificate"
  };
  return map[type] || "Document";
}

function getTypeIcon(type: DocType) {
  if (type === "ID_CARD") return <CreditCard className="h-5 w-5" />;
  if (type === "BONAFIDE" || type === "MARK_SHEET" || type === "LEAVING_CERTIFICATE") return <FileCheck className="h-5 w-5" />;
  if (type === "FEE_RECEIPT") return <CreditCard className="h-5 w-5" />;
  return <GraduationCap className="h-5 w-5" />;
}

const MarkSheetPreview = ({ variant = 1 }: { variant?: number }) => (
  <div style={{ width: 100, height: 140, background: "#fff", position: "relative", overflow: "hidden", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", border: variant === 2 ? "2px solid #1e40af" : "1px solid #e2e8f0" }}>
    <div style={{ position: "absolute", top: 4, left: 4, right: 4, bottom: 4, border: variant === 2 ? "1px solid #fbbf24" : "1px solid #cbd5e1" }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#1e40af", margin: "6px auto 4px" }} />
      <div style={{ height: 4, background: "#1e40af", width: "60%", margin: "0 auto 6px" }} />
      <div style={{ height: 10, background: "#1e40af", width: "80%", margin: "0 auto 8px", borderRadius: 2 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "0 6px", marginBottom: 6 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ width: "45%", height: 3, background: "#cbd5e1" }} />)}
      </div>
      <div style={{ height: 30, background: "#f1f5f9", margin: "0 6px 6px", border: "1px solid #cbd5e1" }} />
      <div style={{ display: "flex", gap: 4, padding: "0 6px", marginBottom: 6 }}>
        <div style={{ flex: 1, height: 14, background: "#bfdbfe", borderRadius: 2 }} />
        <div style={{ flex: 1, height: 14, background: "#fef08a", borderRadius: 2 }} />
        <div style={{ flex: 1, height: 14, background: "#bbf7d0", borderRadius: 2 }} />
      </div>
    </div>
  </div>
);

const FeeReceiptPreview = () => (
  <div style={{ width: 140, height: 90, background: "#fff", position: "relative", overflow: "hidden", borderRadius: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", display: "flex", padding: 4, gap: 4 }}>
    <div style={{ flex: 1, border: "1px dashed #cbd5e1", padding: 4, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 3, background: "#0f172a", width: "70%", margin: "0 auto 4px" }} />
      <div style={{ height: 8, background: "#f1f5f9", border: "1px solid #cbd5e1", marginBottom: 4 }} />
      <div style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 4 }} />
      <div style={{ height: 4, background: "#cbd5e1", width: "40%", alignSelf: "flex-end", marginBottom: 2 }} />
    </div>
    <div style={{ flex: 1, border: "1px dashed #cbd5e1", padding: 4, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 3, background: "#0f172a", width: "70%", margin: "0 auto 4px" }} />
      <div style={{ height: 8, background: "#f1f5f9", border: "1px solid #cbd5e1", marginBottom: 4 }} />
      <div style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 4 }} />
      <div style={{ height: 4, background: "#cbd5e1", width: "40%", alignSelf: "flex-end", marginBottom: 2 }} />
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export function TemplateSelector({ documentType, onClose, currentDefault, onSetDefault }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(currentDefault || null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editorOpenFor, setEditorOpenFor] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  
  const baseTemplates = getTemplates(documentType);
  const templates = [...baseTemplates, ...customTemplates];

  const loadCustomTemplates = useCallback(() => {
    if (documentType === "BONAFIDE" || documentType === "ACHIEVEMENT") {
      axios.get(`/api/document-templates/all/${documentType}`)
        .then(res => {
          if (res.data.success) {
            const currentBaseTemplates = getTemplates(documentType);
            const mapped = res.data.data.map((t: any) => {
              const baseTpl = currentBaseTemplates.find(b => b.id === t.base_template_id);
              return {
                id: `custom_${t.id}`,
                name: t.template_name || `Custom ${t.language}`,
                desc: `Custom inherited from ${baseTpl?.name || t.base_template_id}`,
                preview: baseTpl?.preview || <div className="p-4 border border-dashed rounded text-center text-sm text-slate-500">Preview not available</div>,
                isCustom: true
              };
            });
            setCustomTemplates(mapped);
          }
        })
        .catch(err => console.error("Failed to load custom templates:", err));
    }
  }, [documentType]);

  useEffect(() => {
    loadCustomTemplates();
  }, [loadCustomTemplates]);

  const handleDeleteCustomTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this custom template?")) return;
    try {
      const realId = templateId.split('_')[1];
      const res = await axios.delete(`/api/document-templates/${realId}`);
      if (res.data.success) {
        toast.success("Template deleted successfully");
        if (selectedTemplate === templateId) setSelectedTemplate(null);
        loadCustomTemplates();
      }
    } catch (err) {
      toast.error("Failed to delete template");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/60 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" /> Back to Settings
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-primary">
          {getTypeIcon(documentType)}
          <span className="font-bold text-slate-900">{getTypeLabel(documentType)} Templates</span>
        </div>
      </div>

      {/* Editor Link Removed */}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose a Template</h2>
            <p className="text-slate-500 text-sm font-medium">Select a design, then generate your document with real student data</p>
          </div>

          {/* Template Grid */}
          <div className={`grid gap-6 mb-10 ${documentType === "ID_CARD" ? "grid-cols-1 sm:grid-cols-2" : documentType === "BONAFIDE" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
            {templates.map((t) => {
              const isSelected = selectedTemplate === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`group relative bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all duration-200 text-left flex flex-col cursor-pointer
                    ${isSelected ? "border-primary ring-4 ring-primary/10 shadow-lg shadow-primary/10" : "border-slate-200 hover:border-primary/40 hover:shadow-md"}`}
                >
                  {/* Preview area */}
                  <div className="flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors p-8 min-h-[200px]">
                    {t.preview}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Current Default indicator */}
                  {currentDefault === t.id && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-sm border-0">
                        Default
                      </Badge>
                    </div>
                  )}

                  {/* Info and Actions */}
                  <div className="p-4 border-t border-slate-100 bg-white z-20">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{t.desc}</p>
                      </div>
                    </div>
                    {isSelected && documentType !== "ID_CARD" && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                        {!t.isCustom && (documentType === "BONAFIDE" || documentType === "ACHIEVEMENT") && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full text-xs gap-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditorOpenFor(t.id);
                            }}
                          >
                            <FileText className="w-3.5 h-3.5" /> Customize Content
                          </Button>
                        )}
                        {t.isCustom && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full text-xs gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomTemplate(t.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Template
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {onSetDefault && (
              <Button
                size="lg"
                disabled={!selectedTemplate || selectedTemplate === currentDefault}
                onClick={() => {
                  if (selectedTemplate) onSetDefault(selectedTemplate);
                }}
                className="h-12 px-10 font-bold gap-2 rounded-xl shadow-lg shadow-primary/20 disabled:opacity-40 w-full sm:w-auto"
              >
                <Check className="h-5 w-5" />
                {selectedTemplate === currentDefault ? "Currently Active Default" : "Set as Default Template"}
              </Button>
            )}
            
            <Button
              size="lg"
              variant="outline"
              disabled={!selectedTemplate}
              onClick={() => setStudentDialogOpen(true)}
              className="h-12 px-8 font-bold gap-2 rounded-xl w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-200"
            >
              <Users className="h-5 w-5" />
              Generate Test Document
            </Button>
          </div>
        </div>
      </div>

      {/* Student Dialog */}
      {studentDialogOpen && selectedTemplate && (
        <StudentPickerDialog
          documentType={documentType}
          templateId={selectedTemplate}
          onClose={() => setStudentDialogOpen(false)}
        />
      )}

      {/* Editor Modal */}
      {editorOpenFor && (
        <LockedTemplateEditor
          documentType={documentType}
          templateId={editorOpenFor}
          onClose={() => {
            setEditorOpenFor(null);
            loadCustomTemplates(); // Refresh list to show newly created template
          }}
        />
      )}
    </div>
  );
}

// ─── Student Picker Dialog ─────────────────────────────────────────────────────
function StudentPickerDialog({ documentType, templateId, onClose }: { documentType: DocType; templateId: string; onClose: () => void }) {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [studentsRes, eventsRes] = await Promise.all([
          axios.get("/api/students"),
          documentType === "ACHIEVEMENT" ? axios.get("/api/events").catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } })
        ]);
        
        const mapped: StudentItem[] = studentsRes.data.data.map((s: any) => ({
          id: s.student_id,
          name: `${s.stu_first_name} ${s.stu_last_name}`,
          className: s.class_name ? `${s.class_name}${s.section_name ? " - " + s.section_name : ""}` : "—",
          avatar: s.profile_url || "",
          initials: (s.stu_first_name?.charAt(0) || "") + (s.stu_last_name?.charAt(0) || ""),
        }));
        setStudents(mapped);
        
        if (eventsRes.data?.data) {
          setEventsList(eventsRes.data.data);
        }
      } catch { toast.error("Failed to load students"); }
      finally { setLoading(false); }
    })();
  }, [documentType]);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.className.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: number) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const generate = useCallback(async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    const token = localStorage.getItem("accessToken");
    const paths = getApiPaths(documentType);
    const label = getTypeLabel(documentType);
    const ids = Array.from(selected);

    try {
      let blob: Blob;
      let filename: string;

      if (ids.length === 1 && documentType !== "FEE_RECEIPT") {
        let fetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/documents/${paths.single}/${ids[0]}?template=${templateId}`;
        if (selectedEventId) fetchUrl += `&eventId=${selectedEventId}`;
        
        const res = await fetch(fetchUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Failed");
        }
        blob = await res.blob();
        filename = `${label.replace(/\s+/g, "_")}_${ids[0]}.pdf`;
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${paths.bulk}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: ids, templateId, eventId: selectedEventId || undefined }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || "Failed");
        }
        blob = await res.blob();
        filename = `${label.replace(/\s+/g, "_")}_${ids.length}_students.pdf`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${label} generated for ${ids.length} student${ids.length > 1 ? "s" : ""}!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message === "Failed" ? "Failed to generate document. Please try again." : error.message);
    } finally {
      setGenerating(false);
    }
  }, [selected, documentType, templateId, onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-900">Select Students</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Template: <span className="text-primary font-bold">{templateId}</span>
              {selected.size > 0 && <span className="ml-2 text-emerald-600">· {selected.size} selected</span>}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…" className="pl-9 h-10" />
          </div>
        </div>

        {/* Select all */}
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-b bg-slate-50/50 flex items-center justify-between">
            <button onClick={toggleAll} className="text-xs font-bold text-primary hover:underline">
              {selected.size === filtered.length ? "Deselect All" : "Select All Visible"}
            </button>
            <span className="text-xs text-slate-400 font-medium">{filtered.length} students</span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm font-medium">No students found</div>
          ) : (
            filtered.map(s => {
              const isSelected = selected.has(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary border-primary" : "border-slate-300"}`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={s.avatar} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{s.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 font-medium truncate">{s.className}</p>
                  </div>
                  {isSelected && <Badge variant="secondary" className="text-[10px] font-bold shrink-0">✓</Badge>}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex items-center gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={generate}
            disabled={selected.size === 0 || generating}
            className="flex-1 font-bold gap-2"
          >
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Download className="h-4 w-4" /> Generate PDF ({selected.size})</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
