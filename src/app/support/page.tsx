"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Ticket,
  Search,
  ChevronDown,
  ChevronUp,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  HelpCircle,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/school-os/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── FAQ Data ── */
const FAQ_ITEMS = [
  {
    q: "How do I reset a student's password?",
    a: "Go to Users → Find the student → Click Edit → Reset Password. An email will be sent to their registered address with secure instructions.",
    category: "User Management",
  },
  {
    q: "Why is attendance not syncing?",
    a: "Attendance syncs every 5 minutes. If delayed, check your internet connection or contact support with your school ID for immediate diagnostics.",
    category: "Attendance",
  },
  {
    q: "How to add a new academic year?",
    a: "Navigate to Settings → Academic Year → Add New Year. Existing historical data will be cleanly archived and accessible in read-only reports.",
    category: "Settings",
  },
  {
    q: "Can I export reports to Excel?",
    a: "Yes! Go to Reports → Select your desired report type → Click Export → Choose Excel format (.xlsx) or PDF.",
    category: "Reports",
  },
  {
    q: "How do I configure holiday calendar?",
    a: "Admin → Holidays → Add Holiday. Configured holidays automatically reflect across the attendance registers and academic timetables.",
    category: "Calendar",
  },
  {
    q: "What browsers does SchoolOS support?",
    a: "Chrome, Firefox, Safari, and Edge. We recommend Google Chrome on desktop and mobile for the smoothest experience.",
    category: "Technical",
  },
  {
    q: "How to contact support urgently?",
    a: "Use our official WhatsApp Support channel for critical issues — our response time is typically under 15 minutes during campus hours.",
    category: "Support",
  },
  {
    q: "Is my school data secure?",
    a: "Yes. All data is end-to-end encrypted in transit and at rest, stored in SOC-2 compliant secure cloud infrastructure, and backed up daily.",
    category: "Security",
  },
];

const CATEGORIES = [
  "Attendance",
  "Timesheet",
  "Leave Management",
  "User Management",
  "Reports",
  "Billing",
  "Technical Issue",
  "Feature Request",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
type PriorityType = (typeof PRIORITIES)[number];

export default function SupportPage() {
  // ── Search & FAQ State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // ── Form State ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<PriorityType>("Medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // ── Submission State ──
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Filter FAQs based on search
  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
      setAttachedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, boolean> = {};
    if (!name.trim()) newErrors.name = true;
    if (!email.trim() || !email.includes("@")) newErrors.email = true;
    if (!schoolName.trim()) newErrors.schoolName = true;
    if (!category) newErrors.category = true;
    if (!subject.trim()) newErrors.subject = true;
    if (!description.trim()) newErrors.description = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToForm();
      return;
    }

    setErrors({});
    setSubmitting(true);

    // Simulate instant ticket creation
    setTimeout(() => {
      const genId = "TKT-" + Date.now().toString().slice(-6);
      setTicketId(genId);
      setIsSubmitted(true);
      setSubmitting(false);
    }, 600);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setSchoolName("");
    setCategory("");
    setPriority("Medium");
    setSubject("");
    setDescription("");
    setAttachedFile(null);
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* ════════════════════════════════════════
          1. HEADER / NAVBAR
          ════════════════════════════════════════ */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/auth/login" className="flex items-center gap-2 group">
            <Logo
              className="h-7 w-7 sm:h-8 sm:w-8"
              iconClassName="h-6 w-6 sm:h-7 sm:w-7 text-[#3B4ED8]"
              textClassName="text-lg sm:text-xl font-bold tracking-tight text-slate-900"
            />
          </Link>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#3B4ED8] hover:text-indigo-800 hover:bg-indigo-50/80 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all active:scale-95 border border-indigo-100"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Login</span>
            <span className="sm:hidden">Login</span>
          </Link>
        </div>
      </header>

      {/* ════════════════════════════════════════
          2. HERO SECTION
          ════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-[#EEF2FF] via-[#E8EEFF] to-[#E0E7FF] px-4 py-10 sm:py-16 text-center border-b border-indigo-100/60 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <span className="bg-indigo-100/90 text-indigo-700 text-xs font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-4 border border-indigo-200/60 shadow-2xs">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
            Support Center
          </span>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            How can we help you?
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 mt-2.5 sm:mt-3 max-w-lg mx-auto leading-relaxed">
            Get help with SchoolOS. We typically respond within 24 hours.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto mt-6 sm:mt-8 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers..."
              className="w-full h-11 sm:h-12 pl-11 pr-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-[#3B4ED8] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. CONTACT OPTIONS ROW (3 CARDS)
          ════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 w-full relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1 — Email Support */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-2xs">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-4 tracking-tight">
                Email Support
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Send us an email and we&apos;ll get back to you within 24 hours.
              </p>
            </div>
            <div className="pt-5 mt-2 border-t border-slate-100">
              <a
                href="mailto:hello@prophetbird.com"
                className="text-[#3B4ED8] font-bold text-sm hover:underline inline-flex items-center gap-1 group"
              >
                hello@prophetbird.com
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
              <div className="mt-3">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  24hr response
                </span>
              </div>
            </div>
          </div>

          {/* Card 2 — WhatsApp Support (HIGHLIGHTED) */}
          <div className="bg-[#3B4ED8] text-white rounded-2xl p-6 shadow-xl shadow-indigo-500/20 border border-indigo-400/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-sm">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white mt-4 tracking-tight">
                WhatsApp Support
              </h2>
              <p className="text-sm text-indigo-100 mt-1.5 leading-relaxed">
                Chat with our support team directly on WhatsApp for instant assistance.
              </p>
              <div className="text-white font-black text-lg mt-3 tracking-wide">
                +91 80555 71953
              </div>
            </div>
            <div className="pt-4 mt-2 relative z-10">
              <a
                href="https://wa.me/918055571953"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-[#3B4ED8] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-indigo-50 w-full text-center block transition-all shadow-md active:scale-[0.98]"
              >
                Chat on WhatsApp
              </a>
              <div className="mt-3">
                <span className="bg-white/20 text-white border border-white/20 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Fastest response
                </span>
              </div>
            </div>
          </div>

          {/* Card 3 — Submit a Ticket */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-2xs">
                <Ticket className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-4 tracking-tight">
                Submit a Ticket
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Create a support ticket for complex issues and track its progress online.
              </p>
            </div>
            <div className="pt-5 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={scrollToForm}
                className="text-amber-600 font-bold text-sm hover:underline inline-flex items-center gap-1 group"
              >
                Create ticket below
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <div className="mt-3">
                <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  48hr resolution
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. MAIN CONTENT: TICKET FORM + FAQ
          ════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* ── LEFT COLUMN (col-span-3): TICKET FORM ── */}
          <div
            ref={formRef}
            id="ticket-form"
            className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm"
          >
            {isSubmitted ? (
              /* Success State */
              <div className="text-center py-12 px-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Ticket Submitted!
                </h3>
                <div className="inline-block bg-slate-100 border border-slate-200/80 px-4 py-1.5 rounded-xl font-mono text-sm font-bold text-slate-800 my-2">
                  #{ticketId}
                </div>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your ticket has been created and assigned to our support engineers.
                  We&apos;ll email you updates at <strong className="text-slate-800">{email}</strong>.
                </p>
                <div className="pt-6">
                  <Button
                    type="button"
                    onClick={resetForm}
                    className="bg-[#3B4ED8] hover:bg-indigo-700 text-white rounded-xl h-11 px-6 font-bold text-sm shadow-md"
                  >
                    Submit Another Ticket
                  </Button>
                </div>
              </div>
            ) : (
              /* Ticket Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Submit a Support Ticket
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill in the details and we&apos;ll assign it to the right team.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Your Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: false });
                      }}
                      className={`h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm ${
                        errors.name ? "border-rose-400 bg-rose-50/30" : ""
                      }`}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="name@school.edu.in"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: false });
                      }}
                      className={`h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm ${
                        errors.email ? "border-rose-400 bg-rose-50/30" : ""
                      }`}
                    />
                  </div>

                  {/* School / Institution Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      School / Institution Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. St. Xavier's International School"
                      value={schoolName}
                      onChange={(e) => {
                        setSchoolName(e.target.value);
                        if (errors.schoolName)
                          setErrors({ ...errors, schoolName: false });
                      }}
                      className={`h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm ${
                        errors.schoolName ? "border-rose-400 bg-rose-50/30" : ""
                      }`}
                    />
                  </div>

                  {/* Issue Category */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Issue Category <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={category}
                      onValueChange={(val) => {
                        setCategory(val);
                        if (errors.category)
                          setErrors({ ...errors, category: false });
                      }}
                    >
                      <SelectTrigger
                        className={`h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm font-medium ${
                          errors.category ? "border-rose-400 bg-rose-50/30" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select an issue category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority Radio Pills */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Priority Level
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRIORITIES.map((p) => {
                        const isSelected = priority === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`h-10 rounded-xl px-3 text-xs font-bold transition-all border text-center flex items-center justify-center ${
                              isSelected
                                ? "bg-[#3B4ED8] text-white border-[#3B4ED8] shadow-xs"
                                : "bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Subject <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Brief summary of the issue"
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        if (errors.subject)
                          setErrors({ ...errors, subject: false });
                      }}
                      className={`h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm ${
                        errors.subject ? "border-rose-400 bg-rose-50/30" : ""
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Describe your issue <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      rows={4}
                      placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, and what you expected to happen."
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description)
                          setErrors({ ...errors, description: false });
                      }}
                      className={`min-h-[120px] rounded-xl bg-slate-50/50 border-slate-200 text-sm leading-relaxed resize-none ${
                        errors.description ? "border-rose-400 bg-rose-50/30" : ""
                      }`}
                    />
                  </div>

                  {/* Attach Screenshot */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Attach Screenshot <span className="text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    {attachedFile ? (
                      <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50/50 rounded-xl">
                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 truncate">
                          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span className="truncate">{attachedFile.name}</span>
                          <span className="text-slate-400 font-normal">
                            ({(attachedFile.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/30 hover:bg-indigo-50/20 transition-all select-none"
                      >
                        <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-slate-700">
                          Drag &amp; drop or click to upload
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          PNG, JPG, WEBP up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-[#3B4ED8] hover:bg-indigo-700 text-white rounded-xl font-bold text-base mt-6 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  {submitting ? "Submitting Ticket..." : "Submit Ticket →"}
                </Button>
              </form>
            )}
          </div>

          {/* ── RIGHT COLUMN (col-span-2): FAQ ── */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick answers to common questions about SchoolOS
              </p>
            </div>

            {/* In-FAQ search filter */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Filter FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-3 rounded-xl bg-white border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* Accordion List */}
            <div className="space-y-2 pt-1">
              {filteredFaqs.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-2xl bg-white text-xs text-slate-400">
                  No questions match your query. Scroll left to submit a ticket.
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={faq.q}
                      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full px-4 py-3.5 flex justify-between items-center text-left hover:bg-slate-50/70 transition-colors gap-3 select-none"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-indigo-600 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 leading-relaxed animate-in fade-in duration-200">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* "Still need help?" card */}
            <div className="bg-indigo-50/80 rounded-2xl p-4 sm:p-5 border border-indigo-100/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs mt-4">
              <div>
                <p className="text-xs font-bold text-indigo-950">
                  Can&apos;t find what you&apos;re looking for?
                </p>
                <p className="text-[11px] text-indigo-700/80 mt-0.5">
                  Our dedicated engineering support team is online.
                </p>
              </div>
              <a
                href="https://wa.me/918055571953"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3B4ED8] hover:text-indigo-800 shrink-0"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          5. FOOTER
          ════════════════════════════════════════ */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <Logo
              className="h-6 w-6"
              iconClassName="h-5 w-5 text-[#3B4ED8]"
              textClassName="text-sm font-bold text-slate-800"
            />
            <span className="text-xs text-slate-400">
              © {new Date().getFullYear()} SchoolOS (CampusConnect). All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-500 font-medium">
            <a href="#ticket-form" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#ticket-form" className="hover:text-indigo-600 transition-colors">
              Terms of Service
            </a>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
