// src/config/rolePermissions.ts

export const ROLE = {
  MASTER_ADMIN: 1,
  INSTITUTE_ADMIN: 2,
  TEACHER: 3,
  CLASS_TEACHER: 4,
  STUDENT: 18,
  GUARDIAN: 19, // example (change if DB id different)
};

/**
 * Which roles can access which routes
 */
export const rolePermissions: Record<number, string[]> = {
  [ROLE.MASTER_ADMIN]: ["*"],

  [ROLE.INSTITUTE_ADMIN]: [
    "/main/dashboard",
    "/main/students",
    "/main/faculty",
    "/main/classes",
    "/main/attendance",
    "/main/fees",
    "/main/schedule",
    "/main/exams",
    "/main/events",
    "/main/materials",
    "/main/notices",
  ],

  [ROLE.TEACHER]: [
    "/main/dashboard",
    "/main/classes",
    "/main/attendance",
    "/main/schedule",
    "/main/exams",
    "/main/materials",
    "/main/notices",
  ],

  [ROLE.CLASS_TEACHER]: [
    "/main/dashboard",
    "/main/classes",
    "/main/attendance",
    "/main/schedule",
    "/main/exams",
    "/main/materials",
    "/main/notices",
  ],

  [ROLE.STUDENT]: [
    "/main/dashboard",
    "/main/schedule",
    "/main/exams",
    "/main/events",
    "/main/materials",
    "/main/notices",
  ],

  [ROLE.GUARDIAN]: [
    "/main/dashboard",
    "/main/exams",
    "/main/events",
    "/main/notices",
  ],
};
