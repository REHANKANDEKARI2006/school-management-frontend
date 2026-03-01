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
