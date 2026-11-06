"use client";

import { useEffect, useState } from "react";
import CalendarView, { CalendarTask } from "@/components/CalendarView";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Filter, Info } from "lucide-react";

export default function AdminCalendarPage() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchCalendarTasks();
  }, [selectedEmployeeId]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (res.ok && data.employees) {
        setEmployees(data.employees.map((e: any) => ({ id: e.id, name: e.name })));
      }
    } catch {
      console.error("Failed to load employees");
    }
  };

  const fetchCalendarTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedEmployeeId !== "all") {
        params.set("employeeId", selectedEmployeeId);
      }
      const res = await fetch(`/api/admin/calendar?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.tasks) {
        setTasks(data.tasks);
      }
    } catch {
      toast.error("Failed to load calendar tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Admin Task Schedule & Assignment Calendar
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visual monthly schedule: track which employee was assigned work on which date and their respective deadlines.
        </p>
      </div>

      {/* Helpful Hint banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
        <div>
          <strong className="font-semibold block mb-0.5">
            Admin Tracking ("Kis employee ko kis date ko kaam diya tha"):
          </strong>
          Click any date on the calendar grid to open the side panel. It will immediately show all tasks assigned to employees on that specific date along with assignee names, priority, and current status.
        </div>
      </div>

      {/* Calendar Component */}
      {loading && tasks.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
          Loading monthly calendar...
        </div>
      ) : (
        <CalendarView
          tasks={tasks}
          isAdmin={true}
          employees={employees}
          selectedEmployeeId={selectedEmployeeId}
          onEmployeeFilterChange={(empId) => setSelectedEmployeeId(empId)}
        />
      )}
    </div>
  );
}

