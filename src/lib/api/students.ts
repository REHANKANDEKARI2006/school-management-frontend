import axios from "@/lib/axios";

export const getStudentsByClass = async (classId: string) => {
  const res = await axios.get(`/api/students?class_id=${classId}`);
  return res.data.data;
};
