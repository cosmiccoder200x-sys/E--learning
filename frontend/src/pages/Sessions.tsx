import { Card } from "@/components/ui/card";

export default function Sessions() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
      <Card className="p-6">
        <p className="text-sm text-slate-500">No sessions scheduled yet.</p>
      </Card>
    </div>
  );
}
