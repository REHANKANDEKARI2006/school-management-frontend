"use client";

import { CreditCard, Layers, Moon, Plus, Check, FileCheck, GraduationCap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTemplate1, getTemplate2, getTemplate3, getBonafideTemplate1, getBonafideTemplate2, getBonafideTemplate3, getAchievementTemplate } from "./starter-templates";
import type { CanvasTemplate, DocumentType } from "./types";
import { CanvasMiniPreview } from "./canvas-mini-preview";

interface TemplateGalleryProps {
  documentType: DocumentType;
  branding: {
    schoolName?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
    signatureUrl?: string;
    stampUrl?: string;
    primaryColor?: string;
    academicYear?: string;
  };
  savedLayout?: any;
  onSelect: (template: CanvasTemplate) => void;
  onBack?: () => void;
}

export function DocumentTemplateGallery({ documentType, branding, savedLayout, onSelect, onBack }: TemplateGalleryProps) {
  const pc = branding.primaryColor || "#dc2626";

  let templates: CanvasTemplate[] = [];
  
  if (documentType === "ID_CARD") {
    templates = [
      { id: "template1", name: "Portrait Professional", layout: getTemplate1(pc) },
      { id: "template2", name: "Landscape Wallet", layout: getTemplate2(pc) },
      { id: "template3", name: "Premium Dark", layout: getTemplate3("#1e40af") },
    ];
  } else if (documentType === "BONAFIDE") {
    templates = [
      { id: "bonafide_std", name: "Formal Standard", layout: getBonafideTemplate1(pc) },
      { id: "bonafide_mod", name: "Modern Corporate", layout: getBonafideTemplate2(pc) },
      { id: "bonafide_pre", name: "Premium Institutional", layout: getBonafideTemplate3("#ff0000") },
    ];
  } else if (documentType === "ACHIEVEMENT") {
    templates = [
      { id: "achieve_std", name: "Merit Excellence", layout: getAchievementTemplate("#d97706") }
    ];
  }

  const getIcon = (type: DocumentType) => {
    switch (type) {
      case "ID_CARD": return <CreditCard className="h-5 w-5" />;
      case "BONAFIDE": return <FileCheck className="h-5 w-5" />;
      case "ACHIEVEMENT": return <GraduationCap className="h-5 w-5" />;
      default: return <Layers className="h-5 w-5" />;
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-12">
      <div className="space-y-6 max-w-6xl mx-auto p-6 md:p-10 pt-4 md:pt-6">
        {/* Top Bar for Gallery */}
        {onBack && (
        <div className="flex items-center justify-between">
           <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-slate-500 hover:text-slate-900">
             <ChevronLeft className="h-4 w-4" /> Back to Documents
           </Button>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center py-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase mb-2 border border-primary/10">
          {getIcon(documentType)}
          {documentType.replace('_', ' ')} Designer
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Choose a Starting Template</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto font-medium">
          Select a professionally designed template to start with. You can fully customize every element later.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Saved Layout Card (if exists) */}
        {savedLayout && (
          <div
            className={`group relative bg-white rounded-2xl border-2 border-primary shadow-xl overflow-hidden ring-4 ring-primary/5 transition-all duration-300 cursor-pointer flex flex-col ${
              savedLayout.orientation === "landscape" ? "col-span-full md:col-span-1" : ""
            }`}
            onClick={() =>
              onSelect({
                id: "saved",
                name: "My Current Design",
                layout: savedLayout,
              })
            }
          >
            <div className={`relative w-full overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-100 group-hover:bg-white transition-colors ${
              savedLayout.orientation === "landscape" ? "aspect-[4/3]" : "aspect-[3/4]"
            }`}>
               <CanvasMiniPreview layout={savedLayout} branding={branding} />
               <div className="absolute top-3 right-3 z-10">
                 <Badge className="bg-primary text-white text-[9px] uppercase font-bold py-1 px-2.5 gap-1 shadow-md border-none">
                   <Check className="h-3 w-3" /> ACTIVE DESIGN
                 </Badge>
               </div>
            </div>

            <div className="p-4 bg-white flex items-center justify-between mt-auto">
              <div>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-0.5">RESUME DESIGN</p>
                <p className="text-[11px] text-slate-500 font-bold">Your Current {savedLayout.orientation}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <Plus className="h-4 w-4" />
              </div>
            </div>
          </div>
        )}

        {/* Starter Templates */}
        {templates.map((t) => {
          const isActive = savedLayout && JSON.stringify(savedLayout) === JSON.stringify(t.layout);
          const isLandscape = t.layout.orientation === "landscape";
          return (
            <div
              key={t.id}
              className={`group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col ${
                isActive ? "border-primary ring-4 ring-primary/5 shadow-primary/10" : "hover:border-primary/30"
              }`}
              onClick={() => onSelect(t)}
            >
              <div className={`relative w-full overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-100 group-hover:bg-white transition-colors ${
                isLandscape ? "aspect-[4/3]" : "aspect-[3/4]"
              }`}>
                 <CanvasMiniPreview layout={t.layout} branding={branding} />
                 {isActive && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-primary text-white text-[9px] uppercase font-bold py-1 px-2.5 gap-1 shadow-md border-none">
                        <Check className="h-3 w-3" /> ACTIVE
                      </Badge>
                    </div>
                 )}
              </div>

              <div className="p-4 flex items-center justify-between mt-auto">
                <div>
                   <h4 className="font-bold text-slate-800 text-[13px] mb-0.5">{t.name}</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">
                     {t.layout.paperSize} • {t.layout.orientation}
                   </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                   <Plus className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Blank Canvas Option */}
      <div
        className="group border border-dashed border-slate-200 hover:border-primary/30 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-primary/5 bg-white shadow-sm hover:shadow-lg mt-12"
        onClick={() =>
          onSelect({
            id: "blank",
            name: "Blank Canvas",
            layout: {
              documentType: documentType,
              paperSize: documentType === "ID_CARD" ? "CR80" : "A4",
              orientation: "portrait",
              bgColor: "#ffffff",
              elements: [],
            },
          })
        }
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center border border-slate-100 shadow-inner">
          <Plus className="h-8 w-8 text-slate-400 group-hover:text-white transition-colors" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-slate-800 text-xl tracking-tight">Start from Scratch</h3>
          <p className="text-sm text-slate-400 mt-1 font-medium">Create a custom layout from zero.</p>
        </div>
      </div>
      </div>
    </div>
  );
}
