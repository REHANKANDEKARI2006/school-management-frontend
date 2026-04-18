/**
 * Centralized Role Constants for School Management System
 * Based on user_role table IDs
 */

export const ROLE = {
  // System / super admin
  MASTER_ADMIN: 1,
  INSTITUTE_ADMIN: 2,

  // Core staff (teaching)
  TEACHER: 3,
  CLASS_TEACHER: 4,
  MENTOR: 5,

  // Academic support staff
  LIBRARIAN: 6,
  LAB_ASSISTANT: 7,
  SPORTS_MANAGER: 8,
  COUNSELLOR: 9,

  // Administration / office staff
  PRINCIPAL: 10,
  VICE_PRINCIPAL: 11,
  OFFICE_STAFF: 12,
  CASHIER: 13,
  ACCOUNTANT: 14,
  ADMISSION_OFFICER: 15,

  // Management / governance
  MANAGEMENT_MEMBER: 16,
  HR_MANAGER: 17,

  // Student & guardian
  STUDENT: 18,
  CLASS_REPRESENTATIVE: 19,
  GUARDIAN: 20,

  // Support & technical
  IT_SUPPORT: 21,
  LIBRARY_ASSISTANT: 22,

  // Demo / guest
  DEMO_USER: 23,
} as const;

export type RoleId = typeof ROLE[keyof typeof ROLE];

// Helper groups
export const ADMIN_GROUP = [
  ROLE.MASTER_ADMIN,
  ROLE.INSTITUTE_ADMIN,
  ROLE.PRINCIPAL,
  ROLE.VICE_PRINCIPAL,
  ROLE.MANAGEMENT_MEMBER,
  ROLE.HR_MANAGER
];

export const TEACHING_STAFF_GROUP = [
  ROLE.TEACHER,
  ROLE.CLASS_TEACHER,
  ROLE.MENTOR
];

export const ACADEMIC_STAFF_GROUP = [
  ...TEACHING_STAFF_GROUP,
  ROLE.LIBRARIAN,
  ROLE.LAB_ASSISTANT,
  ROLE.SPORTS_MANAGER,
  ROLE.COUNSELLOR
];

export const OFFICE_STAFF_GROUP = [
  ROLE.OFFICE_STAFF,
  ROLE.CASHIER,
  ROLE.ACCOUNTANT,
  ROLE.ADMISSION_OFFICER,
  ROLE.IT_SUPPORT
];

export const STUDENT_PARENT_GROUP = [
  ROLE.STUDENT,
  ROLE.CLASS_REPRESENTATIVE,
  ROLE.GUARDIAN
];

export const ALL_STAFF_GROUP = [
  ...ADMIN_GROUP,
  ...ACADEMIC_STAFF_GROUP,
  ...OFFICE_STAFF_GROUP
];
