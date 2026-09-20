import { Card } from "@/components/ui/card";

export default function Announcements() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
      <div className="space-y-4">
        <Card className="p-6">
          <p className="text-sm text-slate-500">No announcements yet.</p>
        </Card>
      </div>
    </div>
  );
}
