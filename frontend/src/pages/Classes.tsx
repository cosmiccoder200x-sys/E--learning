import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
  teacher_id: string;
  created_at: string;
}

export default function Classes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", subject: "", description: "" });
  const [addingStudent, setAddingStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => { loadClasses(); }, []);

  const loadClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data.classes || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClass(newClass);
      toast({ title: "Success", description: "Class created!" });
      setShowCreate(false);
      setNewClass({ name: "", subject: "", description: "" });
      loadClasses();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await api.deleteClass(id);
      toast({ title: "Success", description: "Class deleted" });
      loadClasses();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !addingStudent) return;
    try {
      await api.addStudent(selectedClass, addingStudent);
      toast({ title: "Success", description: "Student added!" });
      setAddingStudent("");
      loadClassStudents(selectedClass);
      loadClasses();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      const data = await api.getClassStudents(classId);
      setStudents(data.students || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {user?.role === "teacher" ? "My Classes" : "My Classes"}
        </h1>
        {user?.role === "teacher" && (
          <Button onClick={() => setShowCreate(true)}>Create Class</Button>
        )}
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={newClass.subject} onChange={(e) => setNewClass({...newClass, subject: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newClass.description} onChange={(e) => setNewClass({...newClass, description: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <Card key={cls.id}>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg">{cls.name}</h3>
              <p className="text-sm text-slate-600">{cls.subject}</p>
              <p className="text-sm text-slate-500 mt-1">{cls.description || "No description"}</p>
              {user?.role === "teacher" && (
                <div className="mt-4 space-y-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedClass(cls.id); loadClassStudents(cls.id); }}>View Students</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(cls.id)}>Delete</Button>
                </div>
              )}
              {user?.role === "student" && <p className="mt-2 text-sm text-slate-600">Enrolled</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <Card><CardContent className="p-6 text-center"><p className="text-slate-500">No classes yet. Create your first class!</p></CardContent></Card>
      )}

      {user?.role === "teacher" && selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Add Student</CardTitle>
            <CardDescription>Add a student by email to this class</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStudent} className="flex gap-2">
              <Input placeholder="student@email.com" value={addingStudent} onChange={(e) => setAddingStudent(e.target.value)} required />
              <Button type="submit">Add Student</Button>
              <Button type="button" variant="outline" onClick={() => { setSelectedClass(""); setStudents([]); }}>Close</Button>
            </form>
            {students.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Enrolled Students:</h4>
                <div className="space-y-1">
                  {students.map((s: any) => (
                    <div key={s.id || s.student_id} className="text-sm text-slate-600">{s.name || s.email}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
