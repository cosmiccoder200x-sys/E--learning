import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

interface Class {
  id: string;
  name: string;
  subject: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);
  const [nextClass, setNextClass] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const classes = await api.getClasses();
      setEnrolledClasses(classes.classes || []);
      if (classes.classes && classes.classes.length > 0) {
        setNextClass(classes.classes[0]);
      }
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good morning, {user?.name}</h1>
          <p className="text-slate-600">Student Dashboard</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/"}>Home</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Classes Enrolled</p>
            <p className="text-3xl font-bold mt-1">{enrolledClasses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Attendance</p>
            <p className="text-3xl font-bold mt-1">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Average Marks</p>
            <p className="text-3xl font-bold mt-1">--</p>
          </CardContent>
        </Card>
      </div>

      {nextClass && (
        <Card>
          <CardHeader>
            <CardTitle>Next Class</CardTitle>
            <CardDescription>{nextClass.subject}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{nextClass.name}</p>
            <p className="text-sm text-slate-600">{nextClass.subject}</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.href = "/student/class"}>
              View Details
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {enrolledClasses.length === 0 ? (
            <p className="text-sm text-slate-500">You are not enrolled in any classes yet.</p>
          ) : (
            <div className="space-y-2">
              {enrolledClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-slate-600">{cls.subject}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
