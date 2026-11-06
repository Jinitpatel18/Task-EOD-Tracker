"use client";

import { useEffect, useState } from "react";
import CalendarView, { CalendarTask } from "@/components/CalendarView";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Info } from "lucide-react";

export default function EmployeeCalendarPage() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarTasks();
  }, []);

  const fetchCalendarTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/calendar");
      const data = await res.json();
      if (res.ok && data.tasks) {
        setTasks(data.tasks);
      }
    } catch {
      toast.error("Failed to load your calendar schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          My Task Schedule & Calendar
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monthly overview of your assigned start dates and delivery deadlines. Click any day to inspect details.
        </p>
      </div>

      {/* Helpful Hint banner */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
        <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">
            Your Personal Calendar:
          </strong>
          Highlighted dates show when tasks were assigned to you and when deadlines are due. Clicking any date opens the side drawer with full specifications.
        </div>
      </div>

      {/* Calendar Component */}
      {loading && tasks.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
          Loading calendar...
        </div>
      ) : (
        <CalendarView tasks={tasks} isAdmin={false} />
      )}
    </div>
  );
}

