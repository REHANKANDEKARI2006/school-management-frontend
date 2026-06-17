"use client";

import RouteGuard from "@/components/auth/RouteGuard";

import {
  Activity,
  ClipboardCheck,
  DollarSign,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "January", attendance: 186 },
  { month: "February", attendance: 305 },
  { month: "March", attendance: 237 },
  { month: "April", attendance: 273 },
  { month: "May", attendance: 209 },
  { month: "June", attendance: 214 },
];

const chartConfig = {
  attendance: {
    label: "Attendance",
    color: "hsl(var(--primary))",
  },
};

import { ROLE, ADMIN_GROUP, TEACHING_STAFF_GROUP, STUDENT_PARENT_GROUP, OFFICE_STAFF_GROUP, ACADEMIC_STAFF_GROUP, RoleId } from "@/config/roles";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

export default function Dashboard() {
  const roleId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("role_id"))
      : null;

  const isAdmin = roleId ? (ADMIN_GROUP as readonly number[]).includes(roleId) : false;
  const isTeacher = roleId ? (TEACHING_STAFF_GROUP as readonly number[]).includes(roleId) : false;
  const isStudent = roleId ? (STUDENT_PARENT_GROUP as readonly number[]).includes(roleId) : false;

  const canSeeStats = roleId ? (ADMIN_GROUP as readonly number[]).includes(roleId) : false;

  if (isAdmin) {
    return (
      <RouteGuard allowedRoles={[...ADMIN_GROUP]}>
        <AdminDashboard />
      </RouteGuard>
    );
  }

  if (isTeacher) {
    return (
      <RouteGuard allowedRoles={[...TEACHING_STAFF_GROUP]}>
        <TeacherDashboard />
      </RouteGuard>
    );
  }

  if (isStudent) {
    return (
      <RouteGuard allowedRoles={[...STUDENT_PARENT_GROUP]}>
        <StudentDashboard />
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={[...ADMIN_GROUP, ...TEACHING_STAFF_GROUP, ...STUDENT_PARENT_GROUP, ...OFFICE_STAFF_GROUP, ...ACADEMIC_STAFF_GROUP]}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {canSeeStats && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,254</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92.5%</div>
                  <p className="text-xs text-muted-foreground">-1.2% from yesterday</p>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Science Fair next week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">New Notices</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">2 unread</p>
            </CardContent>
          </Card>
        </div>

        {canSeeStats && (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="font-headline">Attendance Overview</CardTitle>
                <CardDescription>Monthly student attendance percentage.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickFormatter={(v) => v.slice(0, 3)} />
                    <YAxis tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="attendance" fill="var(--color-attendance)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Recent Notices</CardTitle>
                <CardDescription>Important announcements.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="hidden sm:flex">
                    <AvatarImage src="https://picsum.photos/seed/principal/100/100" />
                    <AvatarFallback>PR</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Mid-term Exam Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      Schedule is now available.
                    </p>
                  </div>
                  <div className="ml-auto text-sm text-muted-foreground">2d ago</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {!canSeeStats && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome back!</CardTitle>
              <CardDescription>Check out the latest notices and events below.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simplified notice list for students/parents */}
              <div className="flex items-center gap-4">
                <Avatar className="hidden sm:flex">
                  <AvatarImage src="https://picsum.photos/seed/principal/100/100" />
                  <AvatarFallback>PR</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Mid-term Exam Schedule</p>
                  <p className="text-sm text-muted-foreground">
                    Schedule is now available.
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">2d ago</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
