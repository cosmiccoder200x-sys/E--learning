import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";

export default function Profile() {
  const { user, logout, isGuest, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  const switchRole = (newRole: "teacher" | "student") => {
    loginAsDemo(newRole);
    navigate(newRole === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="space-y-6 max-w-[760px]">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
          User Account & Preferences
        </h1>
        <p className="text-sm text-slate-500">Your profile details, role permissions, and active session.</p>
      </div>

      <Card className="overflow-hidden border-slate-200/90 shadow-card">
        <div className="h-28 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700" />
        <CardHeader className="-mt-10 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <div className="h-20 w-20 rounded-2xl bg-white text-slate-900 grid place-items-center text-2xl font-extrabold shadow-soft border-2 border-white ring-2 ring-slate-100 shrink-0">
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="mb-1">
                <CardTitle className="text-xl font-bold">{user?.name || "Academic User"}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
              </div>
            </div>
            <Badge variant="brand" className="capitalize text-xs font-semibold px-3 py-1 mb-1">
              {user?.role} Workspace {isGuest && "(Demo)"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
              <p className="text-xs font-medium text-slate-500">Registered Email</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{user?.email || "—"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
              <p className="text-xs font-medium text-slate-500">Workspace Role</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">{user?.role}</p>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50/60 border border-indigo-200/80 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-indigo-900">Switch Workspace View</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Toggle between Teacher and Student dashboards anytime.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={user?.role === "teacher" ? "primary" : "outline"}
                className="text-xs"
                onClick={() => switchRole("teacher")}
              >
                Teacher View
              </Button>
              <Button
                size="sm"
                variant={user?.role === "student" ? "primary" : "outline"}
                className="text-xs"
                onClick={() => switchRole("student")}
              >
                Student View
              </Button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <Button variant="outline" onClick={onLogout} className="text-rose-600 hover:bg-rose-50 border-rose-200">
              <Icons.logout className="h-4 w-4 mr-1.5" /> Sign out of account
            </Button>
            <Button variant="subtle" onClick={() => navigate(user?.role === "teacher" ? "/teacher" : "/student")}>
              Return to Dashboard →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}