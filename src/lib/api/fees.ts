import axios from "@/lib/axios";

/* =========================
   FEE CATEGORIES
========================= */
export const getFeeCategories = async () => {
  const res = await axios.get("/api/fees/categories");
  return res.data.data;
};

export const createFeeCategory = async (payload: any) => {
  const res = await axios.post("/api/fees/categories", payload);
  return res.data.data;
};

export const updateFeeCategory = async (id: string, payload: any) => {
  const res = await axios.patch(`/api/fees/categories/${id}`, payload);
  return res.data.data;
};

export const deleteFeeCategory = async (id: string) => {
  await axios.delete(`/api/fees/categories/${id}`);
};

/* =========================
   FEE STRUCTURES
========================= */
export const getFeeStructures = async () => {
  const res = await axios.get("/api/fees/structures");
  return res.data.data;
};

export const createFeeStructure = async (payload: any) => {
  const res = await axios.post("/api/fees/structures", payload);
  return res.data.data;
};

/* =========================
   FEE COLLECTION
========================= */
export const collectFee = async (payload: any) => {
  const res = await axios.post("/api/fees/collect", payload);
  return res.data.data;
};

export const getStudentFeeCollection = async (studentId: string) => {
  const res = await axios.get(`/api/fees/collection/${studentId}`);
  return res.data.data;
};

export const getFeeStatusByClass = async (classId: string) => {
  const res = await axios.get(`/api/fees/status/class/${classId}`);
  return res.data.data;
};

export const getStudentDetailedFeeStatus = async (studentId: string) => {
  const res = await axios.get(`/api/fees/status/student/${studentId}`);
  return res.data.data;
};

export const updateFeeStructure = async (data: { standardName: string; feeCatId: number; newAmount: number }) => {
  const res = await axios.put(`/api/fees/structure`, data);
  return res.data.data;
};

export const deleteFeeStructure = async (standardName: string, feeCatId: number) => {
  const res = await axios.delete(`/api/fees/structure`, { params: { standardName, feeCatId } });
  return res.data.data;
};
