import axios from "@/lib/axios";

export const getSchoolSchedule = async () => {
    const res = await axios.get("/api/schedule/school");
    return res.data.data;
};

export const getMySchedule = async (params: { staff_id?: number; class_id?: number }) => {
    const res = await axios.get("/api/schedule/my", { params });
    return res.data.data;
};

export const createSchedule = async (data: any) => {
    const res = await axios.post("/api/schedule", data);
    return res.data.data;
};

export const replaceClassSchedule = async (class_id: number, scheduleArray: any[]) => {
    const res = await axios.post("/api/schedule/bulk", { class_id, scheduleArray });
    return res.data;
};

export const updateSchedule = async (id: number, data: any) => {
    const res = await axios.patch(`/api/schedule/${id}`, data);
    return res.data.data;
};

export const deleteSchedule = async (id: number) => {
    const res = await axios.delete(`/api/schedule/${id}`);
    return res.data;
};
