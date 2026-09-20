import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, pending: 0, attendance: "0%" });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getClasses();
        setStats({ ...stats, classes: (data.classes || []).length });
      } catch {}
    };
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
          <p className="text-slate-600">Teacher Dashboard</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/"}>Home</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: stats.classes.toString() },
          { label: "Students", value: stats.students.toString() },
          { label: "Pending", value: stats.pending.toString() },
          { label: "Attendance", value: stats.attendance },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => window.location.href = "/teacher/classes"}>Create Class</Button>
            <Button className="w-full" variant="secondary" onClick={() => window.location.href = "/teacher/sessions"}>Schedule Class</Button>
            <Button className="w-full" variant="secondary" onClick={() => window.location.href = "/teacher/materials"}>Upload Material</Button>
            <Button className="w-full" variant="secondary" onClick={() => window.location.href = "/teacher/assignments"}>Create Assignment</Button>
            <Button className="w-full" variant="secondary" onClick={() => window.location.href = "/teacher/announcements"}>Post Announcement</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">No upcoming classes scheduled.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
