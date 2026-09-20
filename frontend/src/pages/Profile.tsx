import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <Card>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Name:</span> {user?.name}</p>
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          <p><span className="font-medium">Role:</span> {user?.role}</p>
        </CardContent>
        <Button variant="outline" className="mt-4" onClick={logout}>Logout</Button>
      </Card>
    </div>
  );
}
