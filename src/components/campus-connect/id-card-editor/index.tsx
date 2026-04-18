"use client";

import { useState, useEffect } from "react";
import { DocumentTemplateGallery } from "./template-gallery";
import { IdCardCanvasEditor } from "./canvas-editor";
import type { CanvasTemplate, DocumentType } from "./types";

interface DocumentEditorProps {
  documentType: DocumentType;
  branding: {
    schoolName?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    signatureUrl?: string;
    stampUrl?: string;
    primaryColor?: string;
    academicYear?: string;
  };
  savedLayout?: any;
  onSave: (layout: any) => void;
  onBack?: () => void;
}

export function DocumentEditor({ documentType, branding, savedLayout, onSave, onBack }: DocumentEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CanvasTemplate | null>(null);

  // Auto-select if we have a saved layout to jump straight into editing
  useEffect(() => {
    if (savedLayout && !selectedTemplate) {
      // In this system, if we have a saved layout, we treat it as a specialized "Template" 
      // containing the current canvas state.
      setSelectedTemplate({
        id: "custom-current",
        name: "Current Design",
        layout: savedLayout
      });
    }
  }, [savedLayout]);

  if (!selectedTemplate) {
    return (
      <DocumentTemplateGallery
        documentType={documentType}
        branding={branding}
        onSelect={(template) => setSelectedTemplate(template)}
        savedLayout={savedLayout}
        onBack={onBack}
      />
    );
  }

  return (
    <IdCardCanvasEditor
      template={selectedTemplate}
      branding={branding}
      onSave={(layout: any) => {
        onSave(layout);
      }}
      onBack={() => setSelectedTemplate(null)}
    />
  );
}
