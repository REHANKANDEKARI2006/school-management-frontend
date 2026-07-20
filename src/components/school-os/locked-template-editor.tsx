"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X, Eye, FileText, AlertCircle } from "lucide-react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface LockedTemplateEditorProps {
  documentType: string;
  templateId: string;
  onClose: () => void;
}

export function LockedTemplateEditor({ documentType, templateId, onClose }: LockedTemplateEditorProps) {
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("english");
  const [title, setTitle] = useState("");
  const [paragraph, setParagraph] = useState("");
  const [remarks, setRemarks] = useState("");
  
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // We are creating a NEW template, so no initial fetch. Start blank.
  const isInitialLoad = false;

  // Debounced Preview Update
  useEffect(() => {
    if (isInitialLoad) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        const res = await axios.post('/api/document-templates/preview-html', {
          document_type: documentType,
          template_id: templateId,
          language,
          title,
          paragraph,
          remarks
        });
        if (res.data.success) {
          setPreviewHtml(res.data.html);
        }
      } catch (err) {
        console.error("Preview failed", err);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [documentType, templateId, language, title, paragraph, remarks, isInitialLoad]);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Template Name is required");
      return;
    }
    if (title.length > 50 || paragraph.length > 1500 || remarks.length > 120) {
      toast.error("Character limits exceeded");
      return;
    }
    
    setIsSaving(true);
    try {
      const contentJson = JSON.stringify({ title, paragraph, remarks });
      
      const res = await axios.post('/api/document-templates', {
        document_type: documentType,
        template_name: templateName,
        base_template_id: templateId,
        language,
        content: contentJson
      });
      
      if (res.data.success) {
        toast.success("New custom template created successfully");
        onClose();
      }
    } catch (err) {
      toast.error("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={!isSaving ? onClose : undefined} />
      
      <div className="relative w-full max-w-[95vw] h-[95vh] max-h-[95vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 border border-slate-200">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customize Content</h2>
              <p className="text-xs text-slate-500 font-medium">{documentType} • {templateId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || isInitialLoad} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save & Apply
            </Button>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Live Preview */}
          <div className="flex-1 border-r flex flex-col bg-slate-100 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-xs font-semibold text-slate-600 border border-slate-200">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              Live Preview
            </div>
            {isInitialLoad ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-300 animate-spin" />
              </div>
            ) : (
              <iframe 
                className="w-full h-full border-0 bg-white"
                srcDoc={previewHtml}
                title="Live Document Preview"
                sandbox="allow-same-origin"
              />
            )}
          </div>

          {/* Right: Form Editor */}
          <div className="w-[450px] shrink-0 bg-white flex flex-col overflow-y-auto">
            <div className="p-6 space-y-6">
              
              {/* Alert */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 leading-relaxed">
                  <strong>Layout is Locked.</strong> Only the specific text fields below can be modified. Formatting, logos, and signatures will automatically be applied.
                </div>
              </div>

              {/* Template Name & Language */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    placeholder="e.g. Marathi Bonafide" 
                    value={templateName} 
                    onChange={e => setTemplateName(e.target.value)}
                    className="bg-slate-50 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full bg-slate-50">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className="z-[250]">
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="marathi">Marathi</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Document Title</label>
                    <span className={`text-xs ${title.length > 50 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {title.length} / 50
                    </span>
                  </div>
                  <Input 
                    placeholder="e.g. Bonafide Certificate" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    className="bg-slate-50 focus-visible:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Main Paragraph</label>
                    <span className={`text-xs ${paragraph.length > 1500 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {paragraph.length} / 1500
                    </span>
                  </div>
                  <Textarea 
                    placeholder="Enter the main body text. Use placeholders like {student_name}."
                    value={paragraph}
                    onChange={e => setParagraph(e.target.value)}
                    className="min-h-[200px] resize-y bg-slate-50 focus-visible:ring-indigo-500 font-mono text-sm"
                  />
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border">
                    <span className="font-semibold text-slate-700 block mb-1">Placeholders:</span>
                    {`{student_name}, {father_name}, {mother_name}, {class}, {section}, {dob}, {academic_year}, {school_name}, {event_name}`}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">Remarks (Optional)</label>
                    <span className={`text-xs ${remarks.length > 120 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {remarks.length} / 120
                    </span>
                  </div>
                  <Input 
                    placeholder="e.g. Issued for passport purpose." 
                    value={remarks} 
                    onChange={e => setRemarks(e.target.value)}
                    className="bg-slate-50 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
