"use client";

import { CreditCard, Layers, Moon, Plus, Check, FileCheck, GraduationCap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTemplate1, getTemplate2, getTemplate3, getBonafideTemplate, getAchievementTemplate } from "./starter-templates";
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
      { id: "bonafide_std", name: "Standard Bonafide", layout: getBonafideTemplate(pc) }
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
    <div className="space-y-8 max-w-6xl mx-auto p-6">
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          {getIcon(documentType)}
          {documentType.replace('_', ' ')} Designer
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Choose a Starting Template</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto font-medium">
          Select a professionally designed template to start with. You can fully customize every element later.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Saved Layout Card (if exists) */}
        {savedLayout && (
          <div
            className="group relative bg-white rounded-[2rem] border-2 border-primary shadow-2xl overflow-hidden ring-4 ring-primary/5 transition-all duration-300 cursor-pointer"
            onClick={() =>
              onSelect({
                id: "saved",
                name: "My Current Design",
                layout: savedLayout,
              })
            }
          >
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-primary text-white text-[10px] uppercase font-black py-1.5 px-3 gap-1.5 shadow-lg border-none">
                <Check className="h-3 w-3" /> Currently Active
              </Badge>
            </div>

            <div className="aspect-[4/5] bg-slate-50 flex items-center justify-center p-6 border-b border-slate-100 group-hover:bg-white transition-colors overflow-hidden">
               <div className="scale-75 origin-center">
                  <CanvasMiniPreview layout={savedLayout} branding={branding} />
               </div>
            </div>

            <div className="p-6 bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary font-black text-sm">RESUME DESIGN</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Your personalized {savedLayout.orientation} layout
                </p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-colors">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Starter Templates */}
        {templates.map((t) => {
          const isActive = savedLayout && JSON.stringify(savedLayout) === JSON.stringify(t.layout);
          return (
            <div
              key={t.id}
              className={`group relative bg-white rounded-[2rem] border overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                isActive ? "border-primary ring-4 ring-primary/5" : "border-slate-100 hover:border-primary/20"
              }`}
              onClick={() => onSelect(t)}
            >
              {isActive && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-primary text-white text-[10px] uppercase font-black py-1.5 px-3 gap-1.5 shadow-lg border-none">
                    <Check className="h-3 w-3" /> Active
                  </Badge>
                </div>
              )}

              <div className="aspect-[4/5] bg-slate-50 flex items-center justify-center p-6 border-b border-slate-100 group-hover:bg-white transition-colors overflow-hidden">
                <div className="scale-75 origin-center">
                  <CanvasMiniPreview layout={t.layout} branding={branding} />
                </div>
              </div>

              <div className="p-6 flex items-center justify-between">
                <div>
                   <h4 className="font-bold text-slate-800 mb-0.5">{t.name}</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                     {t.layout.paperSize} • {t.layout.orientation}
                   </p>
                </div>
                <Button size="icon" variant="ghost" className="rounded-full bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all">
                   <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Blank Canvas Option */}
      <div
        className="group border-2 border-dashed border-slate-200 hover:border-primary/30 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-primary/5 bg-white shadow-sm hover:shadow-xl mt-12"
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
        <div className="w-16 h-16 rounded-3xl bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center border border-slate-100 shadow-inner group-hover:shadow-primary/20">
          <Plus className="h-8 w-8 text-slate-400 group-hover:text-white transition-colors" />
        </div>
        <div className="text-center">
          <h3 className="font-black text-slate-800 text-xl tracking-tight">Start from Scratch</h3>
          <p className="text-sm text-slate-400 mt-1 font-medium italic">"Creativity is intelligence having fun." — Design your own from zero.</p>
        </div>
      </div>
    </div>
  );
}
