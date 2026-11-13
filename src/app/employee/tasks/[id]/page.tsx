"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Flag,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EmployeeTask {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed" | "Blocked";
  assignedDate: string;
  dueDate: string;
  comment: string;
  assignedBy: string;
  updatedAt: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const [task, setTask] = useState<EmployeeTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [statusValue, setStatusValue] = useState<string>("Pending");
  const [commentValue, setCommentValue] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employee/tasks/${taskId}`);
      const data = await res.json();
      if (res.ok && data.task) {
        setTask(data.task);
        setStatusValue(data.task.status);
        setCommentValue(data.task.comment || "");
      } else {
        toast.error(data.error || "Task not found");
        router.push("/employee/tasks");
      }
    } catch {
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/employee/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue, comment: commentValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update task");
        setSubmitting(false);
        return;
      }
      toast.success("Task updated successfully!");
      setIsUpdateModalOpen(false);
      setTask((prev) => prev ? { ...prev, status: statusValue, comment: commentValue } : prev);
    } catch {
      toast.error("Network error updating task");
    } finally {
      setSubmitting(false);
    }
  };

  const quickChangeStatus = async (newStatus: string) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/employee/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Moved to ${newStatus}`);
        setTask((prev) => prev ? { ...prev, status: newStatus } : prev);
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "High":
        return {
          bg: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-700",
          dot: "bg-rose-500",
          icon: AlertCircle,
        };
      case "Medium":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          dot: "bg-amber-500",
          icon: Clock,
        };
      default:
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Completed":
        return { bg: "bg-emerald-100", text: "text-emerald-800", label: "Completed" };
      case "In Progress":
        return { bg: "bg-blue-100", text: "text-blue-800", label: "In Progress" };
      case "Blocked":
        return { bg: "bg-rose-100", text: "text-rose-800", label: "Blocked" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-700", label: "Pending" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Task not found.</p>
        <button
          onClick={() => router.push("/employee/tasks")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  const priorityCfg = getPriorityConfig(task.priority);
  const statusCfg = getStatusConfig(task.status);
  const PriorityIcon = priorityCfg.icon;

  const daysUntilDue = task.dueDate
    ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/employee/tasks")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Tasks
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {task.title}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${priorityCfg.bg} ${priorityCfg.border} ${priorityCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                {task.priority} Priority
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-md ${statusCfg.bg} ${statusCfg.text}`}>
                {task.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Assigned by {task.assignedBy}
              </span>
              {task.updatedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Updated {format(new Date(task.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setStatusValue(task.status);
              setCommentValue(task.comment || "");
              setIsUpdateModalOpen(true);
            }}
            className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition-colors"
          >
            Update Status
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description - Left span */}
        <div className="lg:col-span-2 space-y-6">
          {task.description && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Flag className="h-4 w-4 text-indigo-500" />
                Description
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Pending", "In Progress", "Completed", "Blocked"].map((st) => (
                <button
                  key={st}
                  onClick={() => quickChangeStatus(st)}
                  disabled={task.status === st}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    task.status === st
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm cursor-default"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Dates & Info */}
        <div className="space-y-6">
          {/* Due Date Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Timeline
            </h2>
            <div className="space-y-4">
              {task.assignedDate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Assigned</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {format(new Date(task.assignedDate), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Due Date</span>
                  <span className={`text-xs font-bold ${daysUntilDue !== null && daysUntilDue < 0 ? "text-rose-600" : daysUntilDue !== null && daysUntilDue <= 2 ? "text-amber-600" : "text-slate-800"}`}>
                    {format(new Date(task.dueDate), "MMM dd, yyyy")}
                    {daysUntilDue !== null && (
                      <span className="ml-1 text-[10px] font-normal">
                        ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? "Today" : `${daysUntilDue}d left`})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Comment Card */}
          {task.comment && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                Progress Note
              </h2>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "{task.comment}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsUpdateModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Update Task
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                  {task.title}
                </h3>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Set Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Pending", "In Progress", "Completed", "Blocked"].map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setStatusValue(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                        statusValue === st
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Progress Comment
                </label>
                <textarea
                  rows={3}
                  placeholder="What did you work on? Any blockers?"
                  value={commentValue}
                  onChange={(e) => setCommentValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
