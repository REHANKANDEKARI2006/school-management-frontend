import axios from "@/lib/axios";

export const getClasses = async () => {
  const res = await axios.get("/api/classes");
  return res.data.data;
};
