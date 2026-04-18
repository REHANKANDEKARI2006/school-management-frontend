"use client";

import { MOCK_STUDENT } from "./types";
import type { CanvasLayout, CanvasElement } from "./types";
import Image from "next/image";
import QRCode from "react-qr-code";

interface MiniPreviewProps {
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
  scale?: number;
}

function resolveText(text: string | undefined, branding: MiniPreviewProps["branding"]): string {
  if (!text) return "";
  return text
    .replace("{{school_name}}", branding.schoolName || "YOUR SCHOOL NAME")
    .replace("{{school_address}}", branding.address || "School Address, City")
    .replace("{{school_phone}}", branding.phone || "9876543210")
    .replace("{{student_name}}", MOCK_STUDENT.student_name)
    .replace("{{father_name}}", MOCK_STUDENT.father_name)
    .replace("{{mother_name}}", MOCK_STUDENT.mother_name)
    .replace("{{class_section}}", MOCK_STUDENT.class_section)
    .replace("{{admission_number}}", MOCK_STUDENT.admission_number)
    .replace("{{dob}}", MOCK_STUDENT.dob)
    .replace("{{blood_group}}", MOCK_STUDENT.blood_group)
    .replace("{{contact}}", MOCK_STUDENT.contact_number)
    .replace("{{address}}", MOCK_STUDENT.address)
    .replace("{{academic_year}}", branding.academicYear || MOCK_STUDENT.academic_year);
}

function getDynamicValue(type: CanvasElement["type"], branding: MiniPreviewProps["branding"]): string {
  switch (type) {
    case "student_name": return MOCK_STUDENT.student_name;
    case "father_name": return MOCK_STUDENT.father_name;
    case "mother_name": return MOCK_STUDENT.mother_name;
    case "class_section": return `Class ${MOCK_STUDENT.class_section}`;
    case "admission_number": return MOCK_STUDENT.admission_number;
    case "dob": return MOCK_STUDENT.dob;
    case "blood_group": return MOCK_STUDENT.blood_group;
    case "contact_number": return MOCK_STUDENT.contact_number;
    case "address": return MOCK_STUDENT.address;
    case "academic_year": return branding.academicYear || MOCK_STUDENT.academic_year;
    default: return "";
  }
}

export function CanvasMiniPreview({ layout, branding, scale = 1 }: MiniPreviewProps) {
  const isLandscape = layout.orientation === "landscape";
  const cardW = isLandscape ? 324 : 204;
  const cardH = isLandscape ? 204 : 324;
  const displayScale = scale * (isLandscape ? 0.55 : 0.62);

  return (
    <div
      style={{
        width: cardW,
        height: cardH,
        backgroundColor: layout.bgColor,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        transform: `scale(${displayScale})`,
        transformOrigin: "top center",
        flexShrink: 0,
      }}
    >
      {[...layout.elements]
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((el) => renderElement(el, branding))}
    </div>
  );
}

function renderElement(el: CanvasElement, branding: MiniPreviewProps["branding"]) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    opacity: el.opacity ?? 1,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    zIndex: el.zIndex || 1,
    boxSizing: "border-box",
    overflow: "hidden",
  };

  if (el.type === "rectangle" || el.type === "bg_color" || el.type === "line") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          backgroundColor: el.bgColor || "transparent",
          borderRadius: el.borderRadius || 0,
          border: el.borderWidth && el.borderColor ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
        }}
      />
    );
  }

  if (el.type === "circle") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          backgroundColor: el.bgColor || "transparent",
          borderRadius: "50%",
          border: el.borderWidth && el.borderColor ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
        }}
      />
    );
  }

  if (el.type === "school_logo") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          borderRadius: el.borderRadius ?? 4,
          border: el.borderWidth && el.borderColor ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt="Logo"
            style={{ width: "100%", height: "100%", objectFit: el.objectFit || "contain" }}
          />
        ) : (
          <div style={{ fontSize: 6, color: "#94a3b8", textAlign: "center", fontWeight: "bold", padding: 2 }}>
            LOGO
          </div>
        )}
      </div>
    );
  }

  if (el.type === "student_photo") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          borderRadius: el.borderRadius ?? 4,
          border: el.borderWidth && el.borderColor ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
          backgroundColor: "#e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 24 24" fill="#94a3b8" style={{ width: "50%", height: "50%" }}>
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      </div>
    );
  }

  if (el.type === "signature") {
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {branding.signatureUrl ? (
          <img
            src={branding.signatureUrl}
            alt="Signature"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <div style={{ width: "100%", borderBottom: "1px solid #64748b", height: "60%" }} />
        )}
      </div>
    );
  }

  if (el.type === "qr_code") {
    return (
      <div key={el.id} style={{ ...baseStyle, display: "flex", alignItems: "center", justifyContent: "center", padding: 2 }}>
        <QRCode value={MOCK_STUDENT.admission_number} size={Math.min(el.width, el.height) - 4} />
      </div>
    );
  }

  if (el.type === "barcode") {
    // Simple visual barcode representation
    return (
      <div key={el.id} style={{ ...baseStyle, display: "flex", alignItems: "stretch", gap: 1, padding: 2, backgroundColor: "#fff" }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: i % 3 === 0 ? 2 : 1,
              backgroundColor: "#1e293b",
              height: "100%",
              borderRadius: 0.5,
            }}
          />
        ))}
      </div>
    );
  }

  // Text elements (text_box, student_name, father_name, etc.)
  const isDynamic = !["text_box", "rectangle", "circle", "line", "bg_color", "bg_image", "school_logo", "student_photo", "signature", "qr_code", "barcode", "stamp"].includes(el.type);
  const textContent = isDynamic
    ? getDynamicValue(el.type, branding)
    : resolveText(el.text, branding);

  if (!textContent && !el.text) return null;

  return (
    <div
      key={el.id}
      style={{
        ...baseStyle,
        fontSize: el.fontSize || 8,
        fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : "Inter, sans-serif",
        fontWeight: el.fontWeight || "normal",
        fontStyle: el.fontStyle || "normal",
        textAlign: el.textAlign || "left",
        color: el.textColor || "#1e293b",
        backgroundColor: el.bgColor || "transparent",
        display: "flex",
        alignItems: "center",
        lineHeight: 1.2,
        paddingLeft: el.textAlign === "left" ? 2 : 0,
        paddingRight: el.textAlign === "right" ? 2 : 0,
        justifyContent:
          el.textAlign === "center" ? "center" :
          el.textAlign === "right" ? "flex-end" : "flex-start",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {isDynamic ? textContent : resolveText(el.text, branding)}
    </div>
  );
}
