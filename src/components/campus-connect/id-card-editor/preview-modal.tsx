"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CanvasLayout } from "./types";
import { CanvasMiniPreview } from "./canvas-mini-preview";

interface PreviewModalProps {
  layout: CanvasLayout;
  branding: {
    schoolName?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
    signatureUrl?: string;
    primaryColor?: string;
    academicYear?: string;
  };
  onClose: () => void;
}

export function IdCardPreviewModal({ layout, branding, onClose }: PreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center gap-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="font-bold text-slate-900">Actual Preview</h3>
            <p className="text-xs text-slate-500 mt-0.5">Using realistic mock student data</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center" style={{ minHeight: 300 }}>
          <CanvasMiniPreview layout={layout} branding={branding} scale={1.6} />
        </div>

        <div className="w-full border-t border-slate-100 pt-4">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Dynamic fields show real student data during generation.<br />
            School details are pulled from your Branding settings.
          </p>
        </div>
      </div>
    </div>
  );
}
