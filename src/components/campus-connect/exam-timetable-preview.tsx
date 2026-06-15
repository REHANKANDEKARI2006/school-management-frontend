"use client";

import * as React from "react";
import axios from "@/lib/axios";
import { GraduationCap, Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ===================================================================
   TYPES
=================================================================== */
export interface TimetableSubjectRow {
  id: string;
  subject_name: string;
  subject_id: string;
  date: string;       // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

export interface ExamTimetablePreviewProps {
  examName: string;
  className: string;
  examType: string;
  academicYear: string;
  instructions: string;
  rows: TimetableSubjectRow[];
}

/* ===================================================================
   HELPERS
=================================================================== */
function getDayName(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getDay()];
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function calcDurationMins(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function formatDuration(start: string, end: string): string {
  const mins = calcDurationMins(start, end);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function formatTime(t: string): string {
  if (!t) return "—";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/* ===================================================================
   PDF GENERATOR
=================================================================== */
function generatePrintHTML(
  examName: string,
  className: string,
  examType: string,
  academicYear: string,
  instructions: string,
  rows: TimetableSubjectRow[],
  schoolName: string,
  orgName: string,
  logoUrl: string,
  primaryColor: string
): string {
  const subtitleParts = [];
  if (examType && !examName.toLowerCase().includes(examType.toLowerCase())) {
    subtitleParts.push(examType);
  }
  if (className && !examName.toLowerCase().includes(`class ${className.toLowerCase()}`)) {
    subtitleParts.push(`Class ${className}`);
  }
  if (academicYear && !examName.toLowerCase().includes(academicYear.toLowerCase())) {
    subtitleParts.push(`Academic Year ${academicYear}`);
  }
  const cleanSubtitle = subtitleParts.join(" &nbsp;|&nbsp; ");

  const sorted = [...rows]
    .filter((r) => r.subject_name && r.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rows_html = sorted
    .map(
      (r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${formatDisplayDate(r.date)}</td>
      <td>${getDayName(r.date)}</td>
      <td>${r.subject_name}</td>
      <td>${formatTime(r.start_time)}</td>
      <td>${formatTime(r.end_time)}</td>
      <td>${formatDuration(r.start_time, r.end_time)}</td>
    </tr>`
    )
    .join("");

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="School Logo" class="logo" />`
    : `<div class="logo-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
       </div>`;

  const instrHtml = instructions
    ? instructions
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => `<li>${line.trim().replace(/^➤\s*/, "")}</li>`)
        .join("")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${examName} — Timetable</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #fff;
      color: #000;
      font-size: 11px;
      line-height: 1.4;
    }
    .page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 15mm;
      position: relative;
      border: 1px solid #000;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    .bottom-section {
      margin-top: auto;
      width: 100%;
    }
    
    /* ── Header ── */
    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 12px;
    }
    .logo-container {
      margin-bottom: 8px;
    }
    .logo {
      height: 70px;
      width: 70px;
      object-fit: contain;
    }
    .logo-placeholder {
      height: 70px;
      width: 70px;
      border-radius: 50%;
      background: ${primaryColor}10;
      border: 2px solid ${primaryColor}30;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .school-name {
      font-size: 18px;
      font-weight: 800;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .org-name {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
      font-weight: 500;
    }
    .header-divider {
      border-top: 1.5px solid #000;
      margin-top: 10px;
      margin-bottom: 15px;
      width: 100%;
    }
    
    /* ── Title Section ── */
    .exam-title-section {
      text-align: center;
      margin-bottom: 16px;
    }
    .exam-title {
      font-size: 16px;
      font-weight: 800;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .exam-subtitle {
      font-size: 10.5px;
      color: #475569;
      margin-bottom: 12px;
      font-weight: 500;
    }
    .pills-container {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 6px;
    }
    .pill {
      display: inline-block;
      padding: 4px 14px;
      border: 1px solid #64748b;
      border-radius: 999px;
      font-size: 9.5px;
      font-weight: 600;
      color: #000;
      background: #fff;
    }
    
    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      margin-bottom: 20px;
      font-size: 10px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 8px;
      text-align: center;
      vertical-align: middle;
    }
    thead tr {
      background: #000;
      color: #fff;
    }
    thead th {
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #000;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    tbody td {
      color: #0f172a;
      font-weight: 500;
    }
    tbody td:nth-child(4) {
      font-weight: 600;
    }
    
    /* ── Instructions ── */
    .instructions-section {
      margin-top: 15px;
      margin-bottom: 25px;
    }
    .instructions-header {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: 9.5px;
      font-weight: 700;
      padding: 4px 14px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .instructions-divider {
      border-top: 1px solid #000;
      margin-bottom: 8px;
      width: 100%;
    }
    .instructions-list {
      list-style: none;
      padding-left: 0;
    }
    .instructions-list li {
      position: relative;
      padding-left: 15px;
      margin-bottom: 4px;
      font-size: 9.5px;
      color: #1e293b;
      font-weight: 500;
      text-align: left;
    }
    .instructions-list li::before {
      content: "➤";
      position: absolute;
      left: 0;
      color: #000;
      font-size: 8px;
    }
    
    /* ── Signatures ── */
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 45px;
      margin-bottom: 15px;
      width: 100%;
    }
    .sig-block {
      text-align: center;
      width: 35%;
    }
    .sig-line {
      border-top: 1px solid #475569;
      margin-bottom: 4px;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #000;
    }
    .sig-title {
      font-size: 9px;
      color: #64748b;
    }
    .sig-divider-graphic {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 25px auto;
      color: #64748b;
      font-size: 10px;
      width: 200px;
    }
    .sig-divider-graphic::before,
    .sig-divider-graphic::after {
      content: "";
      flex: 1;
      border-bottom: 1.5px solid #cbd5e1;
    }
    .sig-divider-graphic::before {
      margin-right: 15px;
    }
    .sig-divider-graphic::after {
      margin-left: 15px;
    }
    
    /* ── Footer ── */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #94a3b8;
      font-style: italic;
    }
    
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: #fff;
        margin: 0;
        padding: 0;
      }
      .page {
        width: 190mm;
        height: 275mm;
        margin: 10mm;
        padding: 15mm;
        border: 1px solid #000;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        page-break-inside: avoid;
        page-break-before: avoid;
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-container">
        ${logoHtml}
      </div>
      <div class="school-name">${schoolName}</div>
      ${orgName ? `<div class="org-name">${orgName}</div>` : ""}
      <div class="header-divider"></div>
    </div>
    
    <div class="exam-title-section">
      <div class="exam-title">${examName}</div>
      ${cleanSubtitle ? `<div class="exam-subtitle">${cleanSubtitle}</div>` : ""}
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width:50px">SR. NO.</th>
          <th style="width:120px">DATE</th>
          <th style="width:100px">DAY</th>
          <th>SUBJECT</th>
          <th style="width:90px">START</th>
          <th style="width:90px">END</th>
          <th style="width:80px">DURATION</th>
        </tr>
      </thead>
      <tbody>
        ${rows_html || '<tr><td colspan="7">No subjects added yet</td></tr>'}
      </tbody>
    </table>
    
    <div class="instructions-section">
      <div class="instructions-header">INSTRUCTIONS</div>
      <div class="instructions-divider"></div>
      <ul class="instructions-list">
        ${instrHtml || `
          <li>Students must reach the exam hall at least 20 minutes before the exam.</li>
          <li>Carry your admit card and necessary stationery.</li>
          <li>Mobile phones and electronic devices are strictly prohibited in the exam hall.</li>
          <li>Follow all instructions given by the invigilator.</li>
        `}
      </ul>
    </div>
    
    <div class="bottom-section">
      <div class="signature-section">
        <div class="sig-block">
          <div class="sig-line">Class Teacher</div>
          <div class="sig-title">Signature</div>
        </div>
        <div class="sig-block">
          <div class="sig-line">Principal</div>
          <div class="sig-title">Signature</div>
        </div>
      </div>
      
      <div class="sig-divider-graphic">◆ &nbsp; ◆ &nbsp; ◆</div>
      
      <div class="footer">
        <span>Generated by CampusConnect ERP</span>
        <span>This is an official school document.</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadExamTimetablePDF(
  examName: string,
  className: string,
  examType: string,
  academicYear: string,
  instructions: string,
  rows: TimetableSubjectRow[],
  schoolProfile: any
) {
  const schoolName = schoolProfile?.school_name || "CampusConnect";
  const orgName = schoolProfile?.organization_name || schoolProfile?.address || "";
  
  const getLogoUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
    return `${base}${path}`;
  };
  const logoUrl = schoolProfile?.logo_url ? getLogoUrl(schoolProfile.logo_url) : "";
  const primaryColor = schoolProfile?.primary_color || "#3d52a0";

  const html = generatePrintHTML(
    examName || "Exam Timetable",
    className,
    examType,
    academicYear,
    instructions,
    rows,
    schoolName,
    orgName,
    logoUrl,
    primaryColor
  );

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 600);
}

/* ===================================================================
   COMPONENT
=================================================================== */
export function ExamTimetablePreview({
  examName,
  className,
  examType,
  academicYear,
  instructions,
  rows,
}: ExamTimetablePreviewProps) {
  const [school, setSchool] = React.useState<any>(null);

  React.useEffect(() => {
    axios
      .get("/api/school-profile")
      .then((res) => {
        if (res.data.success) setSchool(res.data.data);
      })
      .catch(() => {});
  }, []);

  const getLogoUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const base =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:5000";
    return `${base}${path}`;
  };

  const schoolName = school?.school_name || "CampusConnect";
  const orgName = school?.organization_name || school?.address || "";
  const logoUrl = school?.logo_url ? getLogoUrl(school.logo_url) : "";
  const primaryColor = school?.primary_color || "#3d52a0";

  const subtitleParts = [];
  if (examType && !examName.toLowerCase().includes(examType.toLowerCase())) {
    subtitleParts.push(examType);
  }
  if (className && !examName.toLowerCase().includes(`class ${className.toLowerCase()}`)) {
    subtitleParts.push(`Class ${className}`);
  }
  if (academicYear && !examName.toLowerCase().includes(academicYear.toLowerCase())) {
    subtitleParts.push(academicYear);
  }
  const cleanSubtitle = subtitleParts.join("  |  ");

  // Sort rows by date, filter for display
  const sortedRows = [...rows].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const filledRows = sortedRows.filter((r) => r.subject_name || r.date);
  const hasContent = filledRows.length > 0;

  const handleDownloadPDF = () => {
    const html = generatePrintHTML(
      examName || "Exam Timetable",
      className,
      examType,
      academicYear,
      instructions,
      rows,
      schoolName,
      orgName,
      logoUrl,
      primaryColor
    );
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 600);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Download PDF button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadPDF}
        className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 font-semibold"
        disabled={!examName && rows.every((r) => !r.subject_name)}
      >
        <Download className="h-4 w-4" />
        Download / Print PDF
      </Button>

      {/* Preview card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6 min-h-[750px] flex flex-col justify-between">

        <div className="space-y-4">
          {/* School header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="School Logo"
                className="h-16 w-16 object-contain"
              />
            ) : (
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ background: `${primaryColor}10`, border: `2px solid ${primaryColor}30` }}
              >
                <GraduationCap className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
            )}
          </div>
          <h2 className="text-base font-black text-black uppercase tracking-wide leading-tight">
            {schoolName}
          </h2>
          {orgName && (
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {orgName}
            </p>
          )}
          <div className="border-t-2 border-black w-full mt-3" />
        </div>

        {/* Exam title block */}
        <div className="text-center space-y-1">
          <h3 className="font-black text-black text-lg uppercase tracking-wider">
            {examName || <span className="text-slate-400 italic font-normal text-sm">Enter exam name…</span>}
          </h3>
          {cleanSubtitle && (
            <p className="text-xs text-slate-600 font-medium">
              {cleanSubtitle}
            </p>
          )}
        </div>

        {/* Timetable table */}
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2 border border-dashed rounded-xl border-slate-200">
            <div className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              Add subjects to preview the timetable
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg border-slate-200">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  {["SR. NO.", "DATE", "DAY", "SUBJECT", "START", "END", "DURATION"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-[9.5px] font-bold text-center border border-black uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, idx) => {
                  const hasSubject = !!row.subject_name;
                  const hasDate = !!row.date;

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-slate-200 text-center transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50",
                        !hasSubject && !hasDate && "opacity-30"
                      )}
                    >
                      <td className="px-3 py-2.5 border border-slate-200 font-medium text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2.5 border border-slate-200 font-semibold text-black">
                        {hasDate ? formatDisplayDate(row.date) : "—"}
                      </td>
                      <td className="px-3 py-2.5 border border-slate-200 text-slate-600 font-medium">
                        {hasDate ? getDayName(row.date) : "—"}
                      </td>
                      <td className="px-3 py-2.5 border border-slate-200 font-bold text-black">
                        {hasSubject ? row.subject_name : "—"}
                      </td>
                      <td className="px-3 py-2.5 border border-slate-200 text-slate-600 font-medium">
                        {row.start_time ? formatTime(row.start_time) : "—"}
                      </td>
                      <td className="px-3 py-2.5 border border-slate-200 text-slate-600 font-medium">
                        {row.end_time ? formatTime(row.end_time) : "—"}
                      </td>
                      <td className="px-3 py-2.5 border border-slate-200 font-semibold text-slate-700">
                        {row.start_time && row.end_time ? formatDuration(row.start_time, row.end_time) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Instructions Block */}
        <div className="space-y-1 pt-2">
          <div className="inline-block bg-black text-white text-[9.5px] font-black px-3.5 py-1 rounded uppercase tracking-wider">
            Instructions
          </div>
          <div className="border-t border-black w-full" />
          <ul className="space-y-1.5 pl-0 list-none text-[10.5px] text-slate-700 font-medium pt-1">
            {instructions ? (
              instructions.split("\n").filter(line => line.trim()).map((line, idx) => (
                <li key={idx} className="flex gap-2 items-start text-left">
                  <span className="text-black text-[9px] mt-0.5">➤</span>
                  <span>{line.trim().replace(/^➤\s*/, "")}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex gap-2 items-start text-left">
                  <span className="text-black text-[9px] mt-0.5">➤</span>
                  <span>Students must reach the exam hall at least 20 minutes before the exam.</span>
                </li>
                <li className="flex gap-2 items-start text-left">
                  <span className="text-black text-[9px] mt-0.5">➤</span>
                  <span>Carry your admit card and necessary stationery.</span>
                </li>
                <li className="flex gap-2 items-start text-left">
                  <span className="text-black text-[9px] mt-0.5">➤</span>
                  <span>Mobile phones and electronic devices are strictly prohibited in the exam hall.</span>
                </li>
                <li className="flex gap-2 items-start text-left">
                  <span className="text-black text-[9px] mt-0.5">➤</span>
                  <span>Follow all instructions given by the invigilator.</span>
                </li>
              </>
            )}
          </ul>
        </div>

        </div>

        {/* Bottom content wrapper */}
        <div className="space-y-4 mt-auto pt-4">
          {/* Signatures */}
          <div className="flex justify-between items-center px-12">
            <div className="text-center w-[35%]">
              <div className="border-t border-slate-600 pt-1 text-[11px] font-bold text-black">Class Teacher</div>
              <div className="text-[9px] text-slate-500">Signature</div>
            </div>
            <div className="text-center w-[35%]">
              <div className="border-t border-slate-600 pt-1 text-[11px] font-bold text-black">Principal</div>
              <div className="text-[9px] text-slate-500">Signature</div>
            </div>
          </div>

          {/* Decorative divider graphic */}
          <div className="flex items-center justify-center my-4 max-w-[200px] mx-auto select-none">
            <div className="flex-1 border-b border-slate-200"></div>
            <div className="mx-4 text-slate-400 text-[10px] tracking-[4px]">◆ ◆ ◆</div>
            <div className="flex-1 border-b border-slate-200"></div>
          </div>

          {/* Footer info */}
          <div className="pt-2 border-t border-slate-200 flex justify-between text-[8.5px] text-slate-400 italic">
            <span>Generated by CampusConnect ERP</span>
            <span>This is an official school document.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
