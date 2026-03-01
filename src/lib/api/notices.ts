import axios from "@/lib/axios";

export const getNotices = async () => {
    const res = await axios.get("/api/notices");
    return res.data.data;
};

export const getNoticeAudiences = async () => {
    const res = await axios.get("/api/notices/audiences");
    return res.data.data;
};

export const createNotice = async (payload: any) => {
    const res = await axios.post("/api/notices", payload);
    return res.data.data;
};

export const updateNotice = async (id: string, payload: any) => {
    const res = await axios.put(`/api/notices/${id}`, payload);
    return res.data.data;
};

export const deleteNotice = async (id: string) => {
    const res = await axios.delete(`/api/notices/${id}`);
    return res.data;
};
