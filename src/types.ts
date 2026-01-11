
export type Student = {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  classId: string;
  classNameShort?: string; // e.g., "10-A"
  avatar: string;
  fallback: string;
  subjectIds?: string[]; // Added to track student's subjects
  // Fields for student details form
  email?: string;
  status?: "Active" | "Suspended" | "Withdrawn";
  address?: string;
  bloodGroup?: string;
  fatherName?: string;
  motherName?: string;
  primaryContact?: string;
  secondaryContact?: string;
  parentEmail?: string;
  dob?: string;
  date?: string;
};

export type ClassItem = {
    id: string;
    name: string;
    subjectIds: string[];
}

export type Subject = {
    id: string;
    name: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'pending';

export type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
};

export type FeeStructure = {
  id: string;
  classId: string;
  feeCategoryId: string;
  amount: number;
}
