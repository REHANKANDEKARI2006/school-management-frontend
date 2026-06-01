import type { CanvasLayout } from "./types";

const PRIMARY = "#437ef1"; 

/**
 * TEMPLATE 1: THE INSTITUTIONAL STANDARD (Portrait)
 * Optimized for professional durability and clarity.
 */
export function getTemplate1(primaryColor: string = PRIMARY): CanvasLayout {
  return {
    documentType: "ID_CARD",
    paperSize: "CR80",
    orientation: "portrait",
    bgColor: "#ffffff",
    elements: [
      // Sophisticated Header
      {
        id: "hdr-bg",
        type: "rectangle",
        x: 0, y: 0, width: 204, height: 100,
        bgColor: primaryColor,
        zIndex: 1,
        label: "Primary Header"
      },
      {
        id: "hdr-accent",
        type: "rectangle",
        x: 0, y: 95, width: 204, height: 5,
        bgColor: "rgba(0,0,0,0.1)",
        zIndex: 2,
        label: "Header Shadow"
      },
      // School identity
      {
        id: "logo",
        type: "school_logo",
        x: 82, y: 12, width: 40, height: 40,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: "#ffffff",
        objectFit: "contain",
        zIndex: 3,
        label: "School Logo"
      },
      {
        id: "school-name",
        type: "text_box",
        text: "{{school_name}}",
        x: 10, y: 58, width: 184, height: 22,
        fontSize: 10,
        fontFamily: "Outfit",
        fontWeight: "bold",
        textAlign: "center",
        textColor: "#ffffff",
        zIndex: 3,
        label: "Institution Name"
      },
      {
        id: "school-addr",
        type: "text_box",
        text: "{{school_address}}",
        x: 10, y: 78, width: 184, height: 12,
        fontSize: 6.5,
        fontFamily: "Inter",
        textAlign: "center",
        textColor: "rgba(255,255,255,0.85)",
        zIndex: 3,
        label: "Address String"
      },
      // Student Focus
      {
        id: "photo",
        type: "student_photo",
        x: 67, y: 90, width: 70, height: 70,
        borderRadius: 35,
        borderWidth: 4,
        borderColor: "#ffffff",
        objectFit: "cover",
        zIndex: 10,
        label: "Student Portrait"
      },
      {
        id: "stu-name",
        type: "student_name",
        x: 10, y: 165, width: 184, height: 20,
        fontSize: 13,
        fontFamily: "Outfit",
        fontWeight: "bold",
        textAlign: "center",
        textColor: "#0f172a",
        zIndex: 4,
        label: "Student Full Name"
      },
      {
        id: "role-badge",
        type: "rectangle",
        x: 62, y: 188, width: 80, height: 14,
        bgColor: primaryColor,
        borderRadius: 7,
        opacity: 0.1,
        zIndex: 3,
        label: "Status Background"
      },
      {
        id: "class-sec",
        type: "class_section",
        x: 62, y: 189, width: 80, height: 12,
        fontSize: 8,
        fontFamily: "Inter",
        fontWeight: "bold",
        textAlign: "center",
        textColor: "#1e293b",
        zIndex: 4,
        label: "Class Info"
      },
      // Identity Details Grid
      { id: "adm-l", type: "text_box", text: "ID NUMBER", x: 15, y: 212, width: 70, height: 10, fontSize: 6.5, fontWeight: "bold", textAlign: "right", textColor: "#94a3b8", zIndex: 4 },
      { id: "adm-v", type: "admission_number", x: 92, y: 212, width: 97, height: 10, fontSize: 7, fontWeight: "bold", textAlign: "left", textColor: "#1e293b", zIndex: 4 },
      
      { id: "dob-l", type: "text_box", text: "BIRTH DATE", x: 15, y: 224, width: 70, height: 10, fontSize: 6.5, fontWeight: "bold", textAlign: "right", textColor: "#94a3b8", zIndex: 4 },
      { id: "dob-v", type: "dob", x: 92, y: 224, width: 97, height: 10, fontSize: 7, fontWeight: "bold", textAlign: "left", textColor: "#1e293b", zIndex: 4 },
      
      { id: "bg-l", type: "text_box", text: "BLOOD GRP", x: 15, y: 236, width: 70, height: 10, fontSize: 6.5, fontWeight: "bold", textAlign: "right", textColor: "#94a3b8", zIndex: 4 },
      { id: "bg-v", type: "blood_group", x: 92, y: 236, width: 97, height: 10, fontSize: 7, fontWeight: "bold", textAlign: "left", textColor: "#1e293b", zIndex: 4 },
      
      { id: "tel-l", type: "text_box", text: "EMERGENCY", x: 15, y: 248, width: 70, height: 10, fontSize: 6.5, fontWeight: "bold", textAlign: "right", textColor: "#94a3b8", zIndex: 4 },
      { id: "tel-v", type: "contact_number", x: 92, y: 248, width: 97, height: 10, fontSize: 7, fontWeight: "bold", textAlign: "left", textColor: "#1e293b", zIndex: 4 },
      
      // Verification
      {
        id: "qr",
        type: "qr_code",
        x: 10, y: 270, width: 35, height: 35,
        zIndex: 4,
        label: "Secure Verify"
      },
      {
        id: "sig",
        type: "signature",
        x: 120, y: 265, width: 70, height: 30,
        zIndex: 5,
        label: "Principal Auth"
      },
      {
        id: "sig-txt",
        type: "text_box",
        text: "AUTHORIZED SIGNATORY",
        x: 120, y: 295, width: 70, height: 8,
        fontSize: 5,
        fontWeight: "black",
        textAlign: "center",
        textColor: "#64748b",
        zIndex: 5
      },
      // Footer
      {
        id: "footer",
        type: "rectangle",
        x: 0, y: 312, width: 204, height: 12,
        bgColor: primaryColor,
        zIndex: 1
      },
      {
        id: "footer-msg",
        type: "text_box",
        text: "Valid for Academic Session {{academic_year}}",
        x: 0, y: 314, width: 204, height: 8,
        fontSize: 5.5,
        textAlign: "center",
        textColor: "#ffffff",
        zIndex: 2
      }
    ]
  };
}

/**
 * TEMPLATE 2: MODERN LANDSCAPE
 */
export function getTemplate2(primaryColor: string = PRIMARY): CanvasLayout {
  return {
    documentType: "ID_CARD",
    paperSize: "CR80",
    orientation: "landscape",
    bgColor: "#ffffff",
    elements: [
      { id: "side", type: "rectangle", x: 0, y: 0, width: 110, height: 204, bgColor: primaryColor, zIndex: 1 },
      { id: "logo", type: "school_logo", x: 35, y: 15, width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#fff", zIndex: 2 },
      { id: "photo", type: "student_photo", x: 25, y: 65, width: 60, height: 60, borderRadius: 6, borderWidth: 3, borderColor: "#fff", zIndex: 2 },
      { id: "inst-name", type: "text_box", text: "{{school_name}}", x: 5, y: 130, width: 100, height: 40, fontSize: 8, fontWeight: "bold", textAlign: "center", textColor: "#fff", zIndex: 2 },
      
      { id: "name", type: "student_name", x: 125, y: 20, width: 180, height: 24, fontSize: 16, fontWeight: "bold", textColor: "#1e293b", zIndex: 2 },
      { id: "class", type: "class_section", x: 125, y: 45, width: 180, height: 14, fontSize: 9, fontWeight: "bold", textColor: "#64748b", zIndex: 2 },
      { id: "div", type: "line", x: 125, y: 65, width: 180, height: 1, bgColor: "#f1f5f9", zIndex: 2 },
      
      { id: "a-l", type: "text_box", text: "Admission No", x: 125, y: 75, width: 70, height: 12, fontSize: 7, textColor: "#94a3b8", zIndex: 2 },
      { id: "a-v", type: "admission_number", x: 200, y: 75, width: 100, height: 12, fontSize: 7, fontWeight: "bold", zIndex: 2 },
      
      { id: "d-l", type: "text_box", text: "Date of Birth", x: 125, y: 90, width: 70, height: 12, fontSize: 7, textColor: "#94a3b8", zIndex: 2 },
      { id: "d-v", type: "dob", x: 200, y: 90, width: 100, height: 12, fontSize: 7, fontWeight: "bold", zIndex: 2 },
      
      { id: "b-l", type: "text_box", text: "Blood Group", x: 125, y: 105, width: 70, height: 12, fontSize: 7, textColor: "#94a3b8", zIndex: 2 },
      { id: "b-v", type: "blood_group", x: 200, y: 105, width: 100, height: 12, fontSize: 7, fontWeight: "bold", zIndex: 2 },
      
      { id: "bc", type: "barcode", x: 125, y: 130, width: 100, height: 30, zIndex: 2 },
      { id: "sig", type: "signature", x: 235, y: 130, width: 70, height: 30, zIndex: 2 },
      { id: "ft", type: "rectangle", x: 110, y: 188, width: 214, height: 16, bgColor: "#f8fafc", zIndex: 1 },
      { id: "ft-txt", type: "text_box", text: "{{school_address}}", x: 115, y: 191, width: 204, height: 10, fontSize: 6, textAlign: "center", textColor: "#94a3b8", zIndex: 2 }
    ]
  };
}

/**
 * TEMPLATE 3: PREMIUM DARK MODE
 */
export function getTemplate3(primaryColor: string = "#3b82f6"): CanvasLayout {
  return {
    documentType: "ID_CARD", paperSize: "CR80", orientation: "portrait", bgColor: "#0f172a",
    elements: [
       { id: "top", type: "rectangle", x: 0, y: 0, width: 204, height: 80, bgColor: "#1e293b", zIndex: 1 },
       { id: "accent", type: "rectangle", x: 0, y: 78, width: 204, height: 2, bgColor: primaryColor, zIndex: 2 },
       { id: "logo", type: "school_logo", x: 15, y: 15, width: 30, height: 30, zIndex: 2 },
       { id: "sn", type: "text_box", text: "{{school_name}}", x: 50, y: 15, width: 140, height: 30, fontSize: 8, fontWeight: "bold", textAlign: "left", textColor: "#fff", zIndex: 2 },
       { id: "p", type: "student_photo", x: 52, y: 60, width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: primaryColor, zIndex: 10 },
       { id: "n", type: "student_name", x: 10, y: 170, width: 184, height: 20, fontSize: 14, fontWeight: "bold", textAlign: "center", textColor: "#fff", zIndex: 2 },
       { id: "c", type: "class_section", x: 10, y: 190, width: 184, height: 12, fontSize: 9, fontWeight: "bold", textAlign: "center", textColor: "#e2e8f0", zIndex: 2 },
       { id: "ft", type: "rectangle", x: 0, y: 300, width: 204, height: 24, bgColor: "#1e293b", zIndex: 1 },
       { id: "ft-t", type: "text_box", text: "ACADEMIC YEAR {{academic_year}}", x: 0, y: 306, width: 204, height: 10, fontSize: 7, fontWeight: "bold", textAlign: "center", textColor: "#94a3b8", zIndex: 2 }
    ]
  };
}

/**
 * BONAFIDE TEMPLATE 1: THE FORMAL STANDARD
 * Classic institucional portrait layout.
 */
export function getBonafideTemplate1(primaryColor: string = "#437ef1"): CanvasLayout {
  return {
    documentType: "BONAFIDE",
    paperSize: "A4",
    orientation: "portrait",
    bgColor: "#ffffff",
    elements: [
      { id: "border", type: "rectangle", x: 30, y: 30, width: 535, height: 782, bgColor: "transparent", borderWidth: 1, borderColor: "#e2e8f0", zIndex: 1, label: "Frame" },
      { id: "accent-top", type: "rectangle", x: 197, y: 30, width: 200, height: 4, bgColor: primaryColor, zIndex: 2 },
      
      { id: "logo", type: "school_logo", x: 267, y: 60, width: 60, height: 60, borderRadius: 30, objectFit: "contain", zIndex: 2, label: "Seal" },
      { id: "school-name", type: "text_box", text: "{{school_name}}", x: 50, y: 130, width: 495, height: 40, fontSize: 26, fontWeight: "bold", fontFamily: "Outfit", textAlign: "center", textColor: "#1e293b", zIndex: 2 },
      { id: "school-addr", type: "text_box", text: "{{school_address}}", x: 50, y: 170, width: 495, height: 20, fontSize: 10, textAlign: "center", textColor: "#64748b", zIndex: 2 },
      
      { id: "divider", type: "line", x: 150, y: 210, width: 295, height: 1, bgColor: "#f1f5f9", zIndex: 2 },
      
      { id: "ref-no", type: "text_box", text: "Ref No: CIHS/CERT/{{admission_number}}", x: 60, y: 240, width: 250, height: 15, fontSize: 10, fontWeight: "bold", textColor: "#94a3b8", zIndex: 2 },
      { id: "date", type: "issue_date", x: 385, y: 240, width: 150, height: 15, fontSize: 10, fontWeight: "bold", textAlign: "right", textColor: "#94a3b8", zIndex: 2 },
      
      { id: "title", type: "certificate_title", text: "BONAFIDE CERTIFICATE", x: 50, y: 300, width: 495, height: 45, fontSize: 32, fontWeight: "black", textAlign: "center", textColor: primaryColor, zIndex: 2 },
      
      { id: "body", type: "certificate_description", 
        text: "This is to certify that Master/Miss {{student_name}}, son/daughter of Mr. {{father_name}}, is a bonafide student of this institution. \n\nHe/She is currently enrolled in Class {{class_section}} for the Academic Session {{academic_year}} under Admission Number {{admission_number}}.",
        x: 80, y: 380, width: 435, height: 200, fontSize: 15, fontFamily: "Inter", textAlign: "justify", lineHeight: 1.8, textColor: "#334155", zIndex: 2 
      },
      
      { id: "stamp", type: "stamp", x: 100, y: 680, width: 90, height: 90, opacity: 0.8, zIndex: 3 },
      { id: "sig", type: "signature", x: 380, y: 690, width: 140, height: 50, zIndex: 3 },
      { id: "sig-label", type: "text_box", text: "PRINCIPAL AUTHORITY", x: 380, y: 745, width: 140, height: 15, fontSize: 10, fontWeight: "black", textAlign: "center", textColor: "#1e293b", zIndex: 3 }
    ]
  };
}

/**
 * BONAFIDE TEMPLATE 2: MODERN CORPORATE
 * Clean, minimal, high-impact typography.
 */
export function getBonafideTemplate2(primaryColor: string = "#1e293b"): CanvasLayout {
  return {
    documentType: "BONAFIDE",
    paperSize: "A4",
    orientation: "portrait",
    bgColor: "#ffffff",
    elements: [
       { id: "hdr", type: "rectangle", x: 0, y: 0, width: 595, height: 120, bgColor: "#f8fafc", zIndex: 1 },
       { id: "logo", type: "school_logo", x: 50, y: 35, width: 50, height: 50, zIndex: 2 },
       { id: "sn", type: "text_box", text: "{{school_name}}", x: 110, y: 35, width: 435, height: 30, fontSize: 22, fontWeight: "bold", textAlign: "left", textColor: "#0f172a", zIndex: 2 },
       { id: "sa", type: "text_box", text: "{{school_address}}", x: 110, y: 65, width: 435, height: 20, fontSize: 9, textAlign: "left", textColor: "#64748b", zIndex: 2 },
       
       { id: "title", type: "certificate_title", text: "BONAFIDE STATEMENT", x: 50, y: 180, width: 495, height: 60, fontSize: 42, fontWeight: "black", textAlign: "left", textColor: primaryColor, zIndex: 2 },
       { id: "date", type: "issue_date", x: 50, y: 245, width: 200, height: 20, fontSize: 11, fontWeight: "bold", textColor: "#94a3b8", zIndex: 2 },
       
       { id: "body", type: "certificate_description", 
         text: "To whom it may concern,\n\nWe hereby confirm that {{student_name}}, documented under ID {{admission_number}}, is a registered student in active standing at our institution.\n\nCurrent Academic Progress:\nLevel: {{class_section}}\nSession: {{academic_year}}",
         x: 50, y: 300, width: 495, height: 300, fontSize: 16, fontFamily: "Outfit", textAlign: "left", lineHeight: 1.6, textColor: "#475569", zIndex: 2 },
       
       { id: "line", type: "line", x: 50, y: 650, width: 150, height: 2, bgColor: primaryColor, zIndex: 2 },
       { id: "sig", type: "signature", x: 50, y: 660, width: 150, height: 50, zIndex: 2 },
       { id: "s-l", type: "text_box", text: "Registrar / Principal", x: 50, y: 720, width: 150, height: 15, fontSize: 10, fontWeight: "bold", zIndex: 2 }
    ]
  };
}

/**
 * BONAFIDE TEMPLATE 3: PREMIUM INSTITUTIONAL (Screenshot Match)
 * Exact replica of the user-provided design.
 */
export function getBonafideTemplate3(primaryColor: string = "#e11d48"): CanvasLayout {
  return {
    documentType: "BONAFIDE",
    paperSize: "A4",
    orientation: "portrait",
    bgColor: "#ffffff",
    elements: [
      // Double Red Border
      { id: "border-out", type: "rectangle", x: 20, y: 20, width: 555, height: 802, bgColor: "transparent", borderWidth: 3, borderColor: "#ff0000", zIndex: 1 },
      { id: "border-in",  type: "rectangle", x: 28, y: 28, width: 539, height: 786, bgColor: "transparent", borderWidth: 1, borderColor: "#ff0000", zIndex: 1 },
      
      // Header
      { id: "logo", type: "school_logo", x: 257, y: 65, width: 80, height: 80, zIndex: 2 },
      { id: "school", type: "text_box", text: "{{school_name}}", x: 40, y: 165, width: 515, height: 45, fontSize: 28, fontWeight: "black", textAlign: "center", textColor: "#ff0000", fontFamily: "Outfit", zIndex: 2 },
      { id: "addr", type: "text_box", text: "{{school_address}} | Phone: {{school_phone}}", x: 40, y: 210, width: 515, height: 20, fontSize: 11, fontWeight: "bold", textAlign: "center", textColor: "#64748b", zIndex: 2 },
      
      // Title Box
      { id: "title-bg", type: "rectangle", x: 147, y: 270, width: 300, height: 55, bgColor: "#f1f5f9", borderRadius: 27, zIndex: 2 },
      { id: "title-txt", type: "certificate_title", text: "BONAFIDE CERTIFICATE", x: 147, y: 270, width: 300, height: 55, fontSize: 22, fontWeight: "black", textAlign: "center", textColor: "#0f172a", zIndex: 3 },
      
      // Body
      { id: "body", type: "certificate_description", 
        text: "This is to certify that Mr./Ms. {{student_name}} , son/daughter of {{father_name}} and {{mother_name}} , bearing ID number {{admission_number}} , is a bonafide student of this institution.\n\nHe/She is currently studying in class {{class_section}} for the academic year {{academic_year}} . His/Her date of birth according to the school records is {{dob}} .\n\nTo the best of our knowledge, he/she possesses a good moral character.",
        x: 80, y: 380, width: 435, height: 280, fontSize: 16, fontFamily: "Inter", textAlign: "justify", lineHeight: 1.8, textColor: "#1e293b", zIndex: 2 
      },
      
      // Footer
      { id: "date-txt", type: "text_box", text: "Date: {{date}}", x: 80, y: 730, width: 150, height: 20, fontSize: 13, fontWeight: "bold", textColor: "#0f172a", zIndex: 2 },
      { id: "stamp", type: "stamp", x: 227, y: 680, width: 120, height: 120, zIndex: 3 },
      { id: "sig", type: "signature", x: 360, y: 690, width: 160, height: 50, zIndex: 3 },
      { id: "base", type: "line", x: 360, y: 745, width: 160, height: 2, bgColor: "#0f172a", zIndex: 3 },
      { id: "p-txt", type: "text_box", text: "PRINCIPAL", x: 360, y: 755, width: 160, height: 15, fontSize: 12, fontWeight: "black", textAlign: "center", textColor: "#0f172a", zIndex: 3 },
      { id: "auth", type: "text_box", text: "Authorized Signatory", x: 360, y: 775, width: 160, height: 12, fontSize: 9, fontWeight: "bold", textAlign: "center", textColor: "#64748b", zIndex: 3 }
    ]
  };
}

/**
 * ACHIEVEMENT AWARD (A4 Landscape)
 * High-premium aesthetic.
 */
export function getAchievementTemplate(primaryColor: string = "#d97706"): CanvasLayout {
  return {
    documentType: "ACHIEVEMENT",
    paperSize: "A4",
    orientation: "landscape",
    bgColor: "#fffdfa",
    elements: [
      // Double Border Frame
      { id: "outer-b", type: "rectangle", x: 20, y: 20, width: 802, height: 555, bgColor: "transparent", borderWidth: 4, borderColor: primaryColor, zIndex: 1 },
      { id: "inner-b", type: "rectangle", x: 35, y: 35, width: 772, height: 525, bgColor: "transparent", borderWidth: 1, borderColor: primaryColor, opacity: 0.4, zIndex: 1 },
      
      { id: "logo", type: "school_logo", x: 391, y: 50, width: 60, height: 60, zIndex: 3 },
      { id: "school", type: "text_box", text: "{{school_name}}", x: 100, y: 120, width: 642, height: 30, fontSize: 22, fontWeight: "bold", textAlign: "center", textColor: "#475569", zIndex: 3 },
      
      { id: "title", type: "certificate_title", text: "CERTIFICATE OF EXCELLENCE", x: 100, y: 180, width: 642, height: 55, fontSize: 42, fontWeight: "black", textAlign: "center", textColor: primaryColor, zIndex: 3 },
      { id: "label-1", type: "text_box", text: "THIS HONOR IS PROUDLY BESTOWED UPON", x: 100, y: 260, width: 642, height: 20, fontSize: 12, fontWeight: "bold", textAlign: "center", textColor: "#64748b", zIndex: 3 },
      
      { id: "stu-name", type: "student_name", x: 100, y: 290, width: 642, height: 55, fontSize: 48, fontWeight: "black", textAlign: "center", textColor: "#1e293b", zIndex: 3 },
      { id: "div", type: "line", x: 250, y: 350, width: 342, height: 2, bgColor: primaryColor, zIndex: 3 },
      
      { id: "desc", type: "certificate_description", 
        text: "In recognition of exceptional merit and outstanding achievement in {{event_name}} within the Academic Session {{academic_year}}.",
        x: 150, y: 380, width: 542, height: 80, fontSize: 18, textAlign: "center", lineHeight: 1.6, textColor: "#475569", zIndex: 3 
      },
      
      { id: "date-box", type: "text_box", text: "Dated: {{date}}", x: 371, y: 460, width: 100, height: 25, fontSize: 12, fontWeight: "bold", textAlign: "center", zIndex: 3 },
      
      { id: "sig-1", type: "signature", x: 120, y: 470, width: 120, height: 50, zIndex: 4 },
      { id: "sig-1-l", type: "text_box", text: "HEAD OF INSTITUTION", x: 120, y: 525, width: 120, height: 20, fontSize: 9, fontWeight: "black", textAlign: "center", zIndex: 4 },
      
      { id: "sig-2", type: "signature", x: 602, y: 470, width: 120, height: 50, zIndex: 4 },
      { id: "sig-2-l", type: "text_box", text: "DEPT. COORDINATOR", x: 602, y: 525, width: 120, height: 20, fontSize: 9, fontWeight: "black", textAlign: "center", zIndex: 4 }
    ]
  };
}
