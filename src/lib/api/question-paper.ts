// src/lib/api/question-paper.ts
import axios from "@/lib/axios";

/* ═══════════════════════════════════════════
   QUESTION PAPERS
═══════════════════════════════════════════ */
export const listPapers = async (params?: Record<string, string>) => {
  const res = await axios.get("/api/question-papers", { params });
  return res.data.data as any[];
};

export const getUpcomingExams = async () => {
  const res = await axios.get("/api/question-papers/upcoming-exams");
  return res.data.data as any[];
};

export const getPaper = async (id: number | string) => {
  const res = await axios.get(`/api/question-papers/${id}`);
  return res.data.data;
};

export const createDraft = async (payload: any) => {
  const res = await axios.post("/api/question-papers/draft", payload);
  return res.data.data;
};

export const updatePaper = async (id: number | string, payload: any) => {
  const res = await axios.patch(`/api/question-papers/${id}`, payload);
  return res.data.data;
};

export const duplicatePaper = async (id: number | string, overrides?: any) => {
  const res = await axios.post(`/api/question-papers/${id}/duplicate`, overrides || {});
  return res.data.data;
};

export const deletePaper = async (id: number | string) => {
  await axios.delete(`/api/question-papers/${id}`);
};

export const publishPaper = async (id: number | string) => {
  const res = await axios.post(`/api/question-papers/${id}/publish`);
  return res.data.data;
};

/* ═══════════════════════════════════════════
   SECTIONS & QUESTIONS
   ═══════════════════════════════════════════ */
export const upsertSection = async (paperId: number | string, payload: any) => {
  const res = await axios.post(`/api/question-papers/${paperId}/sections`, payload);
  return res.data.data;
};

export const deleteSection = async (sectionId: number | string) => {
  await axios.delete(`/api/question-papers/sections/${sectionId}`);
};

export const upsertQuestion = async (sectionId: number | string, payload: any) => {
  const res = await axios.post(`/api/question-papers/sections/${sectionId}/questions`, payload);
  return res.data.data;
};

export const deleteQuestion = async (questionId: number | string) => {
  await axios.delete(`/api/question-papers/questions/${questionId}`);
};

/* ═══════════════════════════════════════════
   FORMAT TEMPLATES
═══════════════════════════════════════════ */
export const getFormatTemplate = async (class_name: string, subject: string, exam_type?: string) => {
  const res = await axios.get("/api/paper-format-templates/find", {
    params: { class_name, subject, ...(exam_type ? { exam_type } : {}) }
  });
  return res.data.data;
};

/* ═══════════════════════════════════════════
   QUESTION BANK
═══════════════════════════════════════════ */
export const searchQuestionBank = async (params: {
  class_name?: string; subject?: string; chapter?: string;
  question_type?: string; difficulty?: string; search?: string;
  limit?: number; offset?: number;
}) => {
  const res = await axios.get("/api/question-bank", { params });
  return res.data.data as any[];
};

export const addToQuestionBank = async (payload: any) => {
  const res = await axios.post("/api/question-bank", payload);
  return res.data.data;
};

/* ═══════════════════════════════════════════
   PDF GENERATION
═══════════════════════════════════════════ */
export const generatePaperPDF = async (
  paperId: number | string,
  options: { generate_answer_key?: boolean; generateAnswerKey?: boolean; html?: string } = {}
): Promise<string> => {
  // Map both key variations to ensure seamless backend and EJS compatibility
  const bodyPayload = {
    ...options,
    generateAnswerKey: options.generate_answer_key ?? options.generateAnswerKey
  };
  // Returns a blob object URL for direct browser display
  const res = await axios.post(
    `/api/question-papers/${paperId}/generate-pdf`,
    bodyPayload,
    { responseType: "blob" }
  );
  const blob = new Blob([res.data], { type: "application/pdf" });
  return URL.createObjectURL(blob);
};

