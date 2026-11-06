"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FilePlus,
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface AvailableTask {
  id: string;
  title: string;
  priority: string;
  status: string;
}

interface FormItem {
  taskId: string;
  workDone: string;
  status: "Pending" | "In Progress" | "Completed" | "Blocked";
  hoursSpent: number;
  blockers: string;
}

function EmployeeEodForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const [reportDate, setReportDate] = useState<string>(initialDate);
  const [summary, setSummary] = useState<string>("");
  const [items, setItems] = useState<FormItem[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEodForDate(reportDate);
  }, [reportDate]);

  const fetchEodForDate = async (date: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employee/eod?date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableTasks(data.availableTasks || []);

        if (data.report) {
          // Existing report for this date
          setExistingReportId(data.report.id);
          setSummary(data.report.summary || "");
          setLastSubmittedAt(data.report.submittedAt);
          if (data.report.items && data.report.items.length > 0) {
            setItems(
              data.report.items.map((it: any) => ({
                taskId: it.taskId,
                workDone: it.workDone,
                status: it.status,
                hoursSpent: it.hoursSpent,
                blockers: it.blockers || "",
              }))
            );
          }
        } else {
          // New report for this date
          setExistingReportId(null);
          setSummary("");
          setLastSubmittedAt(null);

          // If available tasks exist, seed the first row
          if (data.availableTasks && data.availableTasks.length > 0) {
            setItems([
              {
                taskId: data.availableTasks[0].id,
                workDone: "",
                status: data.availableTasks[0].status as any,
                hoursSpent: 4,
                blockers: "",
              },
            ]);
          } else {
            setItems([]);
          }
        }
      }
    } catch {
      toast.error("Failed to load EOD form data");
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    if (availableTasks.length === 0) {
      toast.error("You don't have any tasks assigned by admin yet.");
      return;
    }
    const defaultTask = availableTasks[0];
    setItems((prev) => [
      ...prev,
      {
        taskId: defaultTask.id,
        workDone: "",
        status: defaultTask.status as any,
        hoursSpent: 2,
        blockers: "",
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error("An EOD report must have at least one task entry");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // If user switches task dropdown, sync the initial status with that task
      if (field === "taskId") {
        const found = availableTasks.find((t) => t.id === value);
        if (found) {
          updated[index].status = found.status as any;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Please add at least one task entry");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].workDone.trim()) {
        toast.error(`Please describe work completed for item #${i + 1}`);
        return;
      }
      if (!items[i].hoursSpent || items[i].hoursSpent <= 0) {
        toast.error(`Please enter valid hours spent (> 0) for item #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/eod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate,
          summary,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit EOD report");
        setSubmitting(false);
        return;
      }

      toast.success(
        existingReportId
          ? "EOD report updated successfully!"
          : "Daily EOD report submitted successfully!"
      );

      // Refresh data
      fetchEodForDate(reportDate);
    } catch {
      toast.error("Network error submitting EOD report");
    } finally {
      setSubmitting(false);
    }
  };

  const totalHours = items.reduce(
    (sum, it) => sum + (Number(it.hoursSpent) || 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Daily End-of-Day (EOD) Submission
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Log your daily progress, hours spent on tasks, completed work, and any blockers.
          </p>
        </div>

        {/* Live Total Hours Badge */}
        <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-2 self-start sm:self-auto">
          <Clock className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-slate-500 font-semibold">Total Hours:</span>
          <span className="font-extrabold text-slate-900 text-sm">
            {totalHours.toFixed(1)} hrs
          </span>
        </div>
      </div>

      {/* Date Bar & Existing Submission Notice */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Report Date
              </label>
              <input
                type="date"
                required
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="mt-1 text-sm font-semibold border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {existingReportId ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>Report Already Filed:</strong> You can edit and update this report until the end of the day.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                One report per employee per day policy. Only filed once per date.
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-sm">
          Loading report entries...
        </div>
      ) : availableTasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No Tasks Assigned Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any tasks assigned by your administrator. Contact your admin so they can assign deliverables to your account before submitting an EOD.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Notes / Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              General Day Summary (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Summary of today's progress, meetings attended, or general updates..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Task Entries Required by Prompt */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tasks Worked On Today
                </h3>
                <p className="text-xs text-slate-500">
                  Select each task you touched today, detail what was completed, and note blockers.
                </p>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Task</span>
              </button>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">
                      Task Entry #{index + 1}
                    </h4>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove task row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Task Selector */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Assigned Task *
                    </label>
                    <select
                      required
                      value={item.taskId}
                      onChange={(e) =>
                        updateItem(index, "taskId", e.target.value)
                      }
                      className="w-full text-sm font-semibold border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {availableTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title} [{task.priority} Priority - Current: {task.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status achieved */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Updated Status *
                    </label>
                    <select
                      required
                      value={item.status}
                      onChange={(e) =>
                        updateItem(index, "status", e.target.value as any)
                      }
                      className="w-full text-sm font-semibold border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                {/* Hours Spent & Work Done */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Hours Spent *
                    </label>
                    <div className="relative rounded-xl shadow-2xs">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="24"
                        required
                        value={item.hoursSpent}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "hoursSpent",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        hrs
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Work Completed Today *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Describe what parts of this task you implemented, tested, or completed..."
                      value={item.workDone}
                      onChange={(e) =>
                        updateItem(index, "workDone", e.target.value)
                      }
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Blockers */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Blockers Encountered (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Waiting on API credentials, third party service downtime..."
                    value={item.blockers}
                    onChange={(e) =>
                      updateItem(index, "blockers", e.target.value)
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Submit Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Submitting updates your daily EOD record and automatically updates each task's status.
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => router.push("/employee/history")}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                View History
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>
                  {submitting
                    ? "Submitting..."
                    : existingReportId
                    ? "Update EOD Report"
                    : "Submit Daily EOD"}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function EmployeeEodPage() {
  return (
    <Suspense fallback={<div>Loading EOD form...</div>}>
      <EmployeeEodForm />
    </Suspense>
  );
}

