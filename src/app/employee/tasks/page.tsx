"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckSquare,
  Search,
  Clock,
  Calendar,
  MessageSquare,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Flag,
  User,
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

function TasksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get("status");
  const viewTaskId = searchParams.get("view"); // View task detail via query param

  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentViewTask, setCurrentViewTask] = useState<EmployeeTask | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(statusParam || "all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);

  // Modal State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);
  const [statusValue, setStatusValue] = useState<string>("Pending");
  const [commentValue, setCommentValue] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  // Load task detail when ?view=id is present
  useEffect(() => {
    if (viewTaskId && !currentViewTask) {
      loadTaskDetail(viewTaskId);
    }
  }, [viewTaskId]);

  const loadTaskDetail = async (taskId: string) => {
    try {
      setTaskLoading(true);
      const res = await fetch(`/api/employee/task-detail/${taskId}`);
      const data = await res.json();
      if (res.ok && data.task) {
        setCurrentViewTask(data.task);
        setStatusValue(data.task.status);
        setCommentValue(data.task.comment || "");
      } else {
        toast.error(data.error || "Task not found");
        router.push("/employee/tasks", { scroll: false });
      }
    } catch {
      toast.error("Failed to load task");
    } finally {
      setTaskLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/employee/tasks?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.tasks) {
        let filtered = data.tasks;
        if (!showCompleted) {
          filtered = filtered.filter((t: EmployeeTask) => t.status !== "Completed");
        }
        setTasks(filtered);
      }
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const openUpdateModal = (task: EmployeeTask) => {
    setSelectedTask(task);
    setStatusValue(task.status);
    setCommentValue(task.comment || "");
    setIsUpdateModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/employee/task-detail/${selectedTask.id}`, {
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
      setSelectedTask(null);
      fetchTasks();
      // Update current view task if it's the same
      if (currentViewTask && currentViewTask.id === selectedTask.id) {
        setCurrentViewTask((prev) => prev ? { ...prev, status: statusValue, comment: commentValue } : prev);
      }
    } catch {
      toast.error("Network error updating task");
    } finally {
      setSubmitting(false);
    }
  };

  const quickChangeStatus = async (task: EmployeeTask, newStatus: string) => {
    try {
      const res = await fetch(`/api/employee/task-detail/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Task moved to ${newStatus}`);
        fetchTasks();
        if (currentViewTask && currentViewTask.id === task.id) {
          setCurrentViewTask((prev) => prev ? { ...prev, status: newStatus } : prev);
        }
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
        return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" };
      case "Medium":
        return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" };
      default:
        return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Completed":
        return { bg: "bg-emerald-100", text: "text-emerald-800" };
      case "In Progress":
        return { bg: "bg-blue-100", text: "text-blue-800" };
      case "Blocked":
        return { bg: "bg-rose-100", text: "text-rose-800" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-700" };
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const closeTaskDetail = () => {
    setCurrentViewTask(null);
    router.push("/employee/tasks", { scroll: false });
  };

  const viewTask = (task: EmployeeTask) => {
    setCurrentViewTask(task);
    setStatusValue(task.status);
    setCommentValue(task.comment || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Task Detail View */}
      {currentViewTask && (
        <>
          <button
            onClick={closeTaskDetail}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Tasks
          </button>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Loading state for task detail */}
            {taskLoading ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          {currentViewTask.title}
                        </h1>
                        {(() => {
                          const pc = getPriorityConfig(currentViewTask.priority);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${pc.bg} ${pc.border} ${pc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                              {currentViewTask.priority} Priority
                            </span>
                          );
                        })()}
                        {(() => {
                          const sc = getStatusConfig(currentViewTask.status);
                          return (
                            <span className={`text-xs font-bold px-3 py-1 rounded-md ${sc.bg} ${sc.text}`}>
                              {currentViewTask.status}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          Assigned by {currentViewTask.assignedBy}
                        </span>
                        {currentViewTask.updatedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Updated {format(new Date(currentViewTask.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setStatusValue(currentViewTask.status);
                        setCommentValue(currentViewTask.comment || "");
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
                  {/* Description & Actions */}
                  <div className="lg:col-span-2 space-y-6">
                    {currentViewTask.description && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Flag className="h-4 w-4 text-indigo-500" />
                          Description
                        </h2>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {currentViewTask.description}
                        </p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-indigo-500" />
                        Quick Actions
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {["Pending", "In Progress", "Completed", "Blocked"].map((st) => (
                          <button
                            key={st}
                            onClick={() => quickChangeStatus(currentViewTask, st)}
                            disabled={currentViewTask.status === st}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                              currentViewTask.status === st
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

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Timeline */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        Timeline
                      </h2>
                      <div className="space-y-4">
                        {currentViewTask.assignedDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Assigned</span>
                            <span className="text-xs font-semibold text-slate-800">
                              {format(new Date(currentViewTask.assignedDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                        {currentViewTask.dueDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Due Date</span>
                            <span className={`text-xs font-bold ${
                              (() => {
                                const d = getDaysUntilDue(currentViewTask.dueDate);
                                return d !== null && d < 0 ? "text-rose-600" : d !== null && d <= 2 ? "text-amber-600" : "text-slate-800";
                              })()
                            }`}>
                              {format(new Date(currentViewTask.dueDate), "MMM dd, yyyy")}
                              {getDaysUntilDue(currentViewTask.dueDate) !== null && (
                                <span className="ml-1 text-[10px] font-normal">
                                  {(() => {
                                    const d = getDaysUntilDue(currentViewTask.dueDate);
                                    return d !== null && `${d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Today" : `${d}d left`}`;
                                  })()}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    {currentViewTask.comment && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-indigo-500" />
                          Progress Note
                        </h2>
                        <p className="text-sm text-slate-700 italic leading-relaxed">
                          "{currentViewTask.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Task List */}
      {!currentViewTask && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <CheckSquare className="h-7 w-7 text-indigo-600" />
                My Assigned Tasks
              </h1>
              <p className="text-sm text-slate-500 mt-1 ml-10">
                Click on any task to view details and update your progress
              </p>
            </div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`ml-10 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors self-start sm:self-auto ${
                showCompleted
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {showCompleted ? "Hide Completed" : "Show Completed"}
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search my tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto self-end sm:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setShowCompleted(false);
                  fetchTasks();
                }}
                title="Reset filters"
                className="p-1.5 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {!loading && tasks.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
              <span className="font-semibold">{tasks.length}</span> task{tasks.length !== 1 ? "s" : ""} shown
              {tasks.some((t) => t.status !== "Completed") && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  {tasks.filter((t) => t.status !== "Completed").length} active
                </span>
              )}
            </div>
          )}

          {/* Tasks Grid */}
          {loading ? (
            <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-sm">
              Loading assigned tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-sm space-y-3">
              <div className="text-4xl">📋</div>
              <p>No tasks found matching your filters.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setShowCompleted(false);
                  fetchTasks();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tasks.map((task) => {
                const priorityCfg = getPriorityConfig(task.priority);
                const statusCfg = getStatusConfig(task.status);
                const daysLeft = getDaysUntilDue(task.dueDate);

                return (
                  <div
                    key={task.id}
                    onClick={() => viewTask(task)}
                    className="group block bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-lg hover:border-indigo-200 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityCfg.bg} ${priorityCfg.border} ${priorityCfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                            {task.priority}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-1">
                          {task.title}
                        </h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {task.comment && (
                      <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="line-clamp-2 italic">"{task.comment}"</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Due: {format(new Date(task.dueDate), "MMM dd")}
                          {daysLeft !== null && daysLeft < 0 && (
                            <span className="text-rose-600 font-semibold">({Math.abs(daysLeft)}d overdue)</span>
                          )}
                          {daysLeft !== null && daysLeft >= 0 && daysLeft <= 2 && (
                            <span className="text-amber-600 font-semibold">({daysLeft === 0 ? "Today" : `${daysLeft}d`})</span>
                          )}
                        </span>
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${statusCfg.bg} ${statusCfg.text}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && selectedTask && (
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
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Status
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
                  Progress Comment / Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Share what you worked on, status updates, or blockers encountered..."
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

export default function EmployeeTasksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Clock className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
      <TasksContent />
    </Suspense>
  );
}
