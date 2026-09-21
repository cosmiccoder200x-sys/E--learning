import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  description: string;
  teacher_id: string;
  created_at: string;
}

const subjectColor: Record<string, string> = {
  Math: "bg-violet-50 text-violet-700 ring-violet-200",
  Physics: "bg-brand-50 text-brand-700 ring-brand-200",
  Chemistry: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Biology: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function Classes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isTeacher = user?.role === "teacher";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", subject: "Physics", description: "" });
  const [addingStudent, setAddingStudent] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data.classes || []);
    } catch (err: any) {
      toast({ title: "Note", description: err.message || "Failed to load classes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name.trim()) return;
    setSubmitting(true);
    try {
      await api.createClass(newClass);
      toast({ title: "Class Created!", description: `${newClass.name} is ready.` });
      setShowCreate(false);
      setNewClass({ name: "", subject: "Physics", description: "" });
      loadClasses();
    } catch (err: any) {
      toast({ title: "Error creating class", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteClass(id);
      toast({ title: "Class Deleted", description: `"${name}" removed.` });
      if (selectedClassId === id) {
        setSelectedClassId("");
        setStudents([]);
      }
      loadClasses();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleOpenRoster = async (classId: string) => {
    setSelectedClassId(classId);
    try {
      const data = await api.getClassStudents(classId);
      setStudents(data.students || []);
    } catch (err: any) {
      toast({ title: "Roster info", description: err.message });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !addingStudent.trim()) return;
    try {
      await api.addStudent(selectedClassId, addingStudent.trim());
      toast({ title: "Student Added", description: `${addingStudent} is now enrolled.` });
      setAddingStudent("");
      handleOpenRoster(selectedClassId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const activeClassObj = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            {isTeacher ? "Class Management" : "My Enrolled Classes"}
          </h1>
          <p className="text-sm text-slate-500">
            {isTeacher
              ? "Create course cohorts, invite students, and manage class rosters."
              : "Access your course materials, live lectures, and assignments."}{" "}
            · <span className="font-semibold text-slate-700">{classes.length} total</span>
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowCreate(!showCreate)} className="shadow-sm">
            <Icons.plus className="h-4 w-4 mr-1.5" /> {showCreate ? "Close Form" : "Create Class"}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="border-brand-300 shadow-card bg-gradient-to-b from-brand-50/20 to-white animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create New Course / Class</CardTitle>
            <CardDescription>Enter course details. Students will see it once enrolled.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClass} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  placeholder="e.g. Physics 101: Mechanics"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Area</Label>
                <select
                  id="subject"
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                >
                  <option value="Physics">Physics</option>
                  <option value="Math">Math</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Literature">Literature</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="classDesc">Description (Optional)</Label>
                <Input
                  id="classDesc"
                  placeholder="What will students learn in this class?"
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 md:col-span-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : "Publish Class"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedClassId && activeClassObj && (
        <Card className="border-indigo-300 shadow-card bg-slate-50/60 animate-scale-in">
          <CardHeader className="flex-row items-start justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icons.users className="h-5 w-5 text-indigo-600" />
                Roster: {activeClassObj.name}
              </CardTitle>
              <CardDescription>Add students by school email to give them access.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedClassId("");
                setStudents([]);
              }}
            >
              Done / Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddStudent} className="flex gap-2 max-w-md">
              <Input
                placeholder="student.email@school.edu"
                type="email"
                value={addingStudent}
                onChange={(e) => setAddingStudent(e.target.value)}
                required
              />
              <Button type="submit" className="shrink-0">
                <Icons.plus className="h-4 w-4 mr-1" /> Add Student
              </Button>
            </form>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Enrolled Students ({students.length})
                </p>
              </div>
              {students.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No students in this class yet. Add a student email above.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {students.map((s: any) => {
                    const profileName = s.profiles?.name || s.name || s.student_email || "Student";
                    const profileEmail = s.profiles?.email || s.email || s.student_email || "";
                    return (
                      <div
                        key={s.id || s.student_id}
                        className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5"
                      >
                        <span className="h-7 w-7 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-bold shrink-0">
                          {profileName[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{profileName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{profileEmail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-2" />
          <p className="text-sm">Loading classes…</p>
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mb-3">
              <Icons.book className="h-6 w-6" />
            </div>
            <p className="font-display font-bold text-slate-900 text-lg">No classes found</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {isTeacher
                ? "Click 'Create Class' above to set up your first course cohort."
                : "Ask your instructor to add your email to the class roster."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="group overflow-hidden hover:shadow-lift transition-all duration-200 border-slate-200/90 flex flex-col justify-between"
            >
              <div>
                <div className="h-1 bg-gradient-to-r from-brand-600 to-indigo-600" />
                <CardContent className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-items-center shrink-0 shadow-xs">
                      <Icons.book className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="slate"
                      className={`ring-1 font-semibold ${
                        subjectColor[cls.subject] || "bg-slate-50 text-slate-700 ring-slate-200"
                      }`}
                    >
                      {cls.subject}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-[17px] font-bold text-slate-900 leading-snug">
                    {cls.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {cls.description || "No course description provided."}
                  </p>
                </CardContent>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-3 pt-3 flex flex-wrap items-center justify-between gap-2">
                {isTeacher ? (
                  <>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleOpenRoster(cls.id)}
                      >
                        <Icons.users className="h-3.5 w-3.5 mr-1 text-slate-600" /> Roster
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                      >
                        Delete
                      </Button>
                    </div>
                    <Button
                      variant="subtle"
                      size="sm"
                      className="text-xs text-brand-700 bg-brand-50 hover:bg-brand-100"
                      onClick={() => navigate("/teacher/materials")}
                    >
                      Materials →
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="brand" className="text-xs">
                      Enrolled
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => navigate("/student/materials")}
                      >
                        Materials
                      </Button>
                      <Button
                        variant="subtle"
                        size="sm"
                        className="text-xs bg-brand-600 text-white hover:bg-brand-700"
                        onClick={() => navigate("/student/sessions")}
                      >
                        Sessions
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}