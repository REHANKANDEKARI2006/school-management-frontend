// Shared types for the Universal Document Canvas Editor system

export type DocumentType = "ID_CARD" | "BONAFIDE" | "ACHIEVEMENT" | "CERTIFICATE";

export type PaperSize = "CR80" | "A4" | "A5";

export type ElementType =
  | "student_photo"
  | "school_logo"
  | "student_name"
  | "father_name"
  | "mother_name"
  | "class_section"
  | "admission_number"
  | "dob"
  | "blood_group"
  | "contact_number"
  | "address"
  | "academic_year"
  | "qr_code"
  | "barcode"
  | "signature"
  | "stamp"
  | "text_box"
  | "rectangle"
  | "circle"
  | "line"
  | "bg_color"
  | "bg_image"
  // Certificate Specific
  | "issue_date"
  | "certificate_title"
  | "certificate_description"
  | "achievement_rank"
  | "event_name";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  zIndex?: number;
  // Text styling
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | "medium" | "black";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right" | "justify";
  textColor?: string;
  lineHeight?: number;
  letterSpacing?: number;
  // Shape/container styling
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // Image styling
  objectFit?: "cover" | "contain" | "fill";
  // Dynamic field label to show in editor
  label?: string;
}

export interface CanvasLayout {
  documentType: DocumentType;
  paperSize: PaperSize;
  orientation: "portrait" | "landscape";
  bgColor: string;
  bgImage?: string;
  elements: CanvasElement[];
}

export interface CanvasTemplate {
  id: string;
  name: string;
  thumbnail?: string;
  layout: CanvasLayout;
}

// Mock student data for previews
export const MOCK_STUDENT = {
  student_name: "Rahul Kumar Sharma",
  father_name: "Ramesh Sharma",
  mother_name: "Sunita Sharma",
  class_section: "9 - A",
  admission_number: "2025001",
  dob: "15/08/2012",
  blood_group: "O+",
  contact_number: "9876543210",
  address: "123, MG Road, Jaipur",
  academic_year: "2025-26",
  issue_date: "05/04/2026",
  certificate_title: "CERTIFICATE OF EXCELLENCE",
  certificate_description: "This is to certify that the student has demonstrated exceptional performance in the academic session.",
  achievement_rank: "1st Rank",
  event_name: "Annual Sports Meet 2026",
};

// Dynamic field tokens
export const DYNAMIC_FIELDS: { type: ElementType; label: string; token: string }[] = [
  // Identity
  { type: "student_photo", label: "Student Photo", token: "{{photo}}" },
  { type: "school_logo", label: "School Logo", token: "{{logo}}" },
  { type: "student_name", label: "Student Name", token: "{{student_name}}" },
  { type: "father_name", label: "Father Name", token: "{{father_name}}" },
  { type: "class_section", label: "Class & Section", token: "{{class_section}}" },
  { type: "admission_number", label: "Admission No", token: "{{admission_number}}" },
  
  // Certificate specific
  { type: "certificate_title", label: "Certificate Title", token: "{{title}}" },
  { type: "certificate_description", label: "Description", token: "{{desc}}" },
  { type: "issue_date", label: "Issue Date", token: "{{date}}" },
  
  // Other Identity
  { type: "dob", label: "Date of Birth", token: "{{dob}}" },
  { type: "contact_number", label: "Contact No", token: "{{contact}}" },
  { type: "academic_year", label: "Academic Year", token: "{{academic_year}}" },
  
  // Visuals
  { type: "qr_code", label: "QR Code", token: "{{qr}}" },
  { type: "signature", label: "Principal Signature", token: "{{signature}}" },
  { type: "stamp", label: "School Stamp", token: "{{stamp}}" },
];

export const STATIC_FIELDS: { type: ElementType; label: string }[] = [
  { type: "text_box", label: "Text Box" },
  { type: "rectangle", label: "Rectangle" },
  { type: "circle", label: "Circle" },
  { type: "line", label: "Line" },
];

// Paper dimensions in pixels at 96dpi (scaled for editor)
export const DIMENSIONS = {
  CR80: {
    portrait: { width: 204, height: 324 },
    landscape: { width: 324, height: 204 },
  },
  A4: {
    portrait: { width: 595, height: 842 },
    landscape: { width: 842, height: 595 },
  },
  A5: {
    portrait: { width: 420, height: 595 },
    landscape: { width: 595, height: 420 },
  }
};
