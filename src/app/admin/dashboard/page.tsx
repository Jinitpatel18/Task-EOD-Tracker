"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Calendar,
  UserPlus,
  PlusCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface AdminStats {
  totalEmployees: number;
  activeEmployees: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  blockedTasks: number;
  completedToday: number;
  eodSubmittedToday: number;
}

interface RecentTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  assignedTo: { name: string; email: string } | null;
  assignedDate: string;
  dueDate: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentTasks();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const res = await fetch("/api/admin/tasks");
      const data = await res.json();
      if (res.ok && data.tasks) {
        setRecentTasks(data.tasks.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to fetch recent tasks", err);
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
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time team task distribution and daily end-of-day submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/tasks?action=create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shadow-sm transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Assign Task</span>
          </Link>
          <Link
            href="/admin/employees?action=add"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-xs transition-colors"
          >
            <UserPlus className="h-4 w-4 text-slate-500" />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards Required by Prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Employees */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Employees
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : stats?.totalEmployees ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({stats?.activeEmployees ?? 0} active)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/admin/employees"
              className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Manage team <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Total Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : stats?.totalTasks ?? 0}
            </span>
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
              {stats?.inProgressTasks ?? 0} in progress
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/admin/tasks"
              className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all tasks <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Tasks Pending */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tasks Pending
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : stats?.pendingTasks ?? 0}
            </span>
            {stats?.blockedTasks ? (
              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
                {stats.blockedTasks} blocked
              </span>
            ) : null}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/admin/tasks?status=Pending"
              className="font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Filter pending <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Tasks Completed Today */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completed Today
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : stats?.completedToday ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              {stats?.completedTasks ?? 0} total completed
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/admin/eod"
              className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Today's EODs ({stats?.eodSubmittedToday ?? 0}) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/calendar"
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 text-white shadow-md hover:shadow-lg transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <Calendar className="h-7 w-7 text-indigo-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Monthly Schedule
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">
              Assignment Calendar
            </h3>
            <p className="mt-1 text-xs text-indigo-200/80">
              See which employee was assigned work on which date and deadlines.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-300 group-hover:text-white">
            <span>Open Interactive Calendar</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/eod"
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-md hover:shadow-lg transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <FileText className="h-7 w-7 text-blue-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Daily Submissions
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">
              Employee EOD Reports
            </h3>
            <p className="mt-1 text-xs text-slate-300/80">
              Inspect daily hours, achievements, work completed, and blockers.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-300 group-hover:text-white">
            <span>Review EOD Reports</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/employees"
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-md hover:shadow-lg transition-shadow group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <Users className="h-7 w-7 text-emerald-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Team Roster
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">
              Employee Performance
            </h3>
            <p className="mt-1 text-xs text-emerald-200/80">
              Track tasks assigned vs completed for each team member.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-300 group-hover:text-white">
            <span>View Employee List</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Tasks Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Assigned Tasks
            </h3>
            <p className="text-xs text-slate-500">
              Latest tasks created across all team members
            </p>
          </div>
          <Link
            href="/admin/tasks"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View all ({stats?.totalTasks ?? 0}) <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No tasks found. Click "Assign Task" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Task Title</th>
                  <th className="px-6 py-3.5">Assigned To</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Assigned Date</th>
                  <th className="px-6 py-3.5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4">
                      {task.assignedTo ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {task.assignedTo.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {task.assignedTo.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
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
                    <td className="px-6 py-4 text-xs text-slate-600">
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

