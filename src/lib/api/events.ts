import axios from "@/lib/axios";

export const getEvents = async () => {
    const res = await axios.get("/api/events");
    return res.data.data;
};

export const getEventStatuses = async () => {
    const res = await axios.get("/api/events/statuses");
    return res.data.data;
};

export const createEvent = async (payload: any) => {
    const res = await axios.post("/api/events", payload);
    return res.data.data;
};

export const updateEvent = async (id: string, payload: any) => {
    const res = await axios.put(`/api/events/${id}`, payload);
    return res.data.data;
};

export const deleteEvent = async (id: string) => {
    const res = await axios.delete(`/api/events/${id}`);
    return res.data;
};

export const generateCertificate = async (id: string) => {
    const res = await axios.post(`/api/events/certificate/${id}`);
    return res.data.data;
};
