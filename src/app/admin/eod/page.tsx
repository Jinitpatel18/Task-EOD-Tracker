"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Filter,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EodItem {
  id: string;
  task: {
    id: string;
    title: string;
    priority: string;
    currentStatus: string;
  };
  workDone: string;
  status: string;
  hoursSpent: number;
  blockers: string;
}

interface EodReport {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  } | null;
  reportDate: string;
  summary: string;
  submittedAt: string;
  totalHours: number;
  itemsCount: number;
  items: EodItem[];
}

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

function AdminEodContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const [reports, setReports] = useState<EodReport[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(dateParam || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Accordion toggle
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [employeeFilter, dateFilter, startDate, endDate]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (res.ok && data.employees) {
        setEmployees(data.employees);
      }
    } catch {
      console.error("Failed to load employees for filter");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (employeeFilter !== "all") params.set("employeeId", employeeFilter);
      if (dateFilter) params.set("date", dateFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/admin/eod-reports?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports(data.reports);
        // Expand all by default
        const expandMap: Record<string, boolean> = {};
        data.reports.forEach((r: EodReport) => {
          expandMap[r.id] = true;
        });
        setExpandedReports(expandMap);
      }
    } catch {
      toast.error("Failed to load EOD reports");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReports((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetFilters = () => {
    setEmployeeFilter("all");
    setDateFilter("");
    setStartDate("");
    setEndDate("");
  };

  const totalLoggedHours = reports.reduce(
    (sum, r) => sum + (Number(r.totalHours) || 0),
    0
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            End-of-Day (EOD) Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review submitted daily progress, hours spent on tasks, work completed, and blockers.
          </p>
        </div>

        {/* Quick Metrics Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Total Logged:</span>
            <span className="font-bold text-indigo-600 text-sm">
              {totalLoggedHours.toFixed(1)} hrs
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Submissions:</span>
            <span className="font-bold text-slate-900 text-sm">
              {reports.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Employee
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Specific Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setStartDate("");
                setEndDate("");
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Date Range (From)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateFilter("");
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Date Range (To)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateFilter("");
                }}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <button
              onClick={resetFilters}
              title="Reset filters"
              className="p-2 border border-slate-300 text-slate-500 hover:bg-slate-50 rounded-lg self-end"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-sm">
            Loading EOD submissions...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-sm">
            No EOD reports found for the selected criteria.
          </div>
        ) : (
          reports.map((report) => {
            const isExpanded = expandedReports[report.id] ?? true;

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Report Header Card */}
                <div
                  onClick={() => toggleExpand(report.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
                      {report.employee?.name ? report.employee.name.charAt(0).toUpperCase() : "E"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {report.employee?.name || "Unknown Employee"}
                        </h3>
                        <span className="text-xs text-slate-400">
                          ({report.employee?.email})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Report Date: {report.reportDate}
                        </span>
                        <span>
                          Submitted: {format(new Date(report.submittedAt), "MMM dd, yyyy hh:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">
                        {report.totalHours} Hours
                      </div>
                      <div className="text-xs text-slate-500">
                        {report.itemsCount} {report.itemsCount === 1 ? "task" : "tasks"} logged
                      </div>
                    </div>

                    <button
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/40 space-y-4">
                    {/* General Summary */}
                    {report.summary && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-900 block mb-1">
                          General Day Summary:
                        </span>
                        <p className="whitespace-pre-line">{report.summary}</p>
                      </div>
                    )}

                    {/* Task Breakdown Required by Prompt */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Tasks Worked On ({report.items.length})
                      </h4>

                      <div className="grid grid-cols-1 gap-3">
                        {report.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">
                                  #{idx + 1}
                                </span>
                                <h5 className="text-sm font-bold text-slate-900">
                                  {item.task.title}
                                </h5>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                                    item.task.priority
                                  )}`}
                                >
                                  {item.task.priority}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${getStatusBadgeClass(
                                    item.status
                                  )}`}
                                >
                                  {item.status}
                                </span>
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-500" />
                                  {item.hoursSpent} hrs
                                </span>
                              </div>
                            </div>

                            {/* Work Done */}
                            <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <strong className="text-slate-900 font-semibold block mb-0.5">
                                Work Completed:
                              </strong>
                              <p className="whitespace-pre-line">{item.workDone}</p>
                            </div>

                            {/* Blockers */}
                            {item.blockers && item.blockers.trim() && (
                              <div className="text-xs text-rose-800 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                                <div>
                                  <strong className="font-semibold block">
                                    Blockers Reported:
                                  </strong>
                                  <p>{item.blockers}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AdminEodPage() {
  return (
    <Suspense fallback={<div>Loading EOD reports...</div>}>
      <AdminEodContent />
    </Suspense>
  );
}

