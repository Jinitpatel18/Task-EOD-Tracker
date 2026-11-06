"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  ArrowRight,
  TrendingUp,
  History,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardData {
  pendingTasksCount: number;
  inProgressCount: number;
  completedCount: number;
  blockedCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
  hasSubmittedEodToday: boolean;
  todayEodId: string | null;
  recentTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    assignedDate: string;
    dueDate: string;
    assignedBy: string;
  }>;
}

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/employee/dashboard");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load employee dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Blocked":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Employee Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your assigned deliverables, submit daily EOD updates, and manage schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/employee/eod"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shadow-sm transition-colors"
          >
            <FilePlus className="h-4 w-4" />
            <span>
              {data?.hasSubmittedEodToday ? "Edit Today's EOD" : "Submit Daily EOD"}
            </span>
          </Link>
          <Link
            href="/employee/tasks"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-xs transition-colors"
          >
            <CheckSquare className="h-4 w-4 text-slate-500" />
            <span>My Tasks</span>
          </Link>
        </div>
      </div>

      {/* EOD Daily Status Alert Banner */}
      {!loading && (
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            data?.hasSubmittedEodToday
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`p-2.5 rounded-xl ${
                data?.hasSubmittedEodToday
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {data?.hasSubmittedEodToday ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {data?.hasSubmittedEodToday
                  ? "Today's EOD Report Submitted!"
                  : "Today's EOD Report Pending"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {data?.hasSubmittedEodToday
                  ? "You have submitted your daily report. You can edit it anytime before midnight."
                  : "Remember to log the tasks you worked on, hours spent, and any blockers before end of day."}
              </p>
            </div>
          </div>

          <Link
            href="/employee/eod"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 self-start sm:self-auto ${
              data?.hasSubmittedEodToday
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-amber-600 text-white hover:bg-amber-500 shadow-sm"
            }`}
          >
            {data?.hasSubmittedEodToday ? "View / Edit Report" : "Submit EOD Now"}
          </Link>
        </div>
      )}

      {/* Metric Cards Required by Prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: My Pending Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              My Pending Tasks
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.pendingTasksCount ?? 0}
            </span>
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
              {data?.inProgressCount ?? 0} in progress
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/employee/tasks?status=Pending"
              className="font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View pending <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Tasks Due Today */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tasks Due Today
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.dueTodayCount ?? 0}
            </span>
            {data?.dueTodayCount ? (
              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
                Urgent
              </span>
            ) : (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                Clear
              </span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/employee/tasks"
              className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              Check deadlines <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Tasks Due This Week */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Due This Week
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.dueThisWeekCount ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              upcoming
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/employee/calendar"
              className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Open schedule <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Completed Count */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completed Count
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              {loading ? "..." : data?.completedCount ?? 0}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              tasks done
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/employee/history"
              className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              My EOD history <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/employee/tasks"
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Manage My Tasks
              </h3>
              <p className="text-xs text-slate-500">
                Update task progress (Pending → In Progress → Completed) with comments.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/employee/calendar"
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                My Monthly Calendar
              </h3>
              <p className="text-xs text-slate-500">
                View assignment dates, deadlines, and daily task cards.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Assigned Tasks */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Upcoming Assigned Deliverables
            </h3>
            <p className="text-xs text-slate-500">
              Tasks assigned to you sorted by due date
            </p>
          </div>
          <Link
            href="/employee/tasks"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {data?.recentTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No active tasks assigned to you currently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Task</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Assigned Date</th>
                  <th className="px-6 py-3.5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getPriorityBadgeClass(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md ${getStatusBadgeClass(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {task.assignedDate
                        ? format(new Date(task.assignedDate), "MMM dd, yyyy")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-semibold">
                      {task.dueDate
                        ? format(new Date(task.dueDate), "MMM dd, yyyy")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

