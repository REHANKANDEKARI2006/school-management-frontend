"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  faculty: any;
}

export function FacultyDetails({ faculty }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback>
            {faculty.staff_first_name?.[0]}
            {faculty.staff_last_name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div>
          <h2 className="text-xl font-bold">
            {faculty.staff_first_name} {faculty.staff_last_name}
          </h2>
          <p className="text-muted-foreground">{faculty.email}</p>
          <Badge>
            {faculty.user_status_id === 1 ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">Department</p>
            <p>{faculty.dept_name || "-"}</p>
          </div>
          <div>
            <p className="font-semibold">Subject</p>
            <p>{faculty.subject_name || "-"}</p>
          </div>
          <div>
            <p className="font-semibold">Qualification</p>
            <p>{faculty.qualification || "-"}</p>
          </div>
          <div>
            <p className="font-semibold">Contact</p>
            <p>{faculty.contact || "-"}</p>
          </div>
          <div>
            <p className="font-semibold">Joining Date</p>
            <p>
              {faculty.joining_date
                ? faculty.joining_date.split("T")[0]
                : "-"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
