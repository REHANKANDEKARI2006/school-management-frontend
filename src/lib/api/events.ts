import axios from "@/lib/axios";

export const getEvents = async (params?: { class_id?: number }) => {
    const res = await axios.get("/api/events", { params });
    return res.data.data;
};

export const getEventStatuses = async () => {
    const res = await axios.get("/api/events/statuses");
    return res.data.data;
};

export const getEventById = async (id: string | number) => {
    const res = await axios.get(`/api/events/${id}`);
    return res.data.data;
};

export const createEvent = async (payload: any) => {
    const res = await axios.post("/api/events", payload);
    return res.data.data;
};

export const updateEvent = async (id: string | number, payload: any) => {
    const res = await axios.put(`/api/events/${id}`, payload);
    return res.data.data;
};

export const deleteEvent = async (id: string | number) => {
    const res = await axios.delete(`/api/events/${id}`);
    return res.data;
};

export const generateCertificate = async (id: string | number) => {
    const res = await axios.post(`/api/events/certificate/${id}`);
    return res.data.data;
};

// Event Attendance
export const getEventAttendance = async (eventId: string | number, classId: string | number) => {
    const res = await axios.get(`/api/events/${eventId}/attendance/${classId}`);
    return res.data.data;
};

export const submitEventAttendance = async (eventId: string | number, classId: string | number, records: any[], staff_id: number) => {
    const res = await axios.post(`/api/events/${eventId}/attendance/${classId}`, { records, staff_id });
    return res.data.data;
};

export const unlockAttendanceEdit = async (eventId: string | number, classId: string | number) => {
    const res = await axios.post(`/api/events/${eventId}/attendance/${classId}/unlock`);
    return res.data.data;
};

// Coordinator
export const getCoordinatorEvents = async (staff_id: number) => {
    const res = await axios.get("/api/events/coordinator/today", { params: { staff_id } });
    return res.data.data;
};

// Displaced Periods
export const getDisplacedPeriods = async (id: string | number) => {
    const res = await axios.get(`/api/events/${id}/displaced-periods`);
    return res.data.data;
};

// Event Photos
export const getEventPhotos = async (eventId: string | number) => {
    const res = await axios.get(`/api/events/${eventId}/photos`);
    return res.data.data;
};

export const uploadEventPhotos = async (eventId: string | number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append("photos", file);
    });
    const res = await axios.post(`/api/events/${eventId}/photos`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data.data;
};

export const deleteEventPhoto = async (photoId: string | number) => {
    const res = await axios.delete(`/api/events/photos/${photoId}`);
    return res.data;
};
