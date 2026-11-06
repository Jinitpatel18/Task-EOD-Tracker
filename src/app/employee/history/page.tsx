"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  FilePlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EodHistoryItem {
  id: string;
  taskTitle: string;
  taskPriority: string;
  workDone: string;
  status: string;
  hoursSpent: number;
  blockers: string;
}

interface EodHistoryReport {
  id: string;
  reportDate: string;
  summary: string;
  submittedAt: string;
  totalHours: number;
  itemsCount: number;
  items: EodHistoryItem[];
}

export default function EmployeeEodHistoryPage() {
  const [reports, setReports] = useState<EodHistoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employee/eod-history");
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports(data.reports);
        // Expand first report by default
        if (data.reports.length > 0) {
          setExpandedMap({ [data.reports[0].id]: true });
        }
      }
    } catch {
      toast.error("Failed to load EOD history");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My EOD Submission History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your past daily end-of-day reports, hours spent, and logged progress.
          </p>
        </div>

        <Link
          href="/employee/eod"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shadow-sm transition-colors self-start sm:self-auto"
        >
          <FilePlus className="h-4 w-4" />
          <span>New Daily EOD</span>
        </Link>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-sm">
            Loading your EOD history...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <History className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              No EOD Reports Submitted Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't submitted any daily reports yet. Submit your first EOD report at the end of your workday.
            </p>
            <div className="pt-2">
              <Link
                href="/employee/eod"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
              >
                Submit First EOD Report
              </Link>
            </div>
          </div>
        ) : (
          reports.map((report) => {
            const isExpanded = expandedMap[report.id] ?? false;

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Header Card */}
                <div
                  onClick={() => toggleExpand(report.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        EOD for {report.reportDate}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Submitted: {format(new Date(report.submittedAt), "MMM dd, yyyy hh:mm a")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">
                        {report.totalHours} Hours
                      </div>
                      <div className="text-xs text-slate-500">
                        {report.itemsCount} tasks logged
                      </div>
                    </div>

                    <Link
                      href={`/employee/eod?date=${report.reportDate}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Edit this report"
                    >
                      <FileEdit className="h-4 w-4" />
                    </Link>

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
                    {report.summary && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                        <strong className="text-slate-900 font-semibold block mb-1">
                          General Summary:
                        </strong>
                        <p className="whitespace-pre-line">{report.summary}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Task Progress Details
                      </h4>

                      <div className="grid grid-cols-1 gap-3">
                        {report.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h5 className="text-sm font-bold text-slate-900">
                                {item.taskTitle}
                              </h5>
                              <div className="flex items-center gap-2">
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

                            <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <strong className="text-slate-900 font-semibold block mb-0.5">
                                Work Done:
                              </strong>
                              <p className="whitespace-pre-line">{item.workDone}</p>
                            </div>

                            {item.blockers && item.blockers.trim() && (
                              <div className="text-xs text-rose-800 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                                <div>
                                  <strong className="font-semibold block">
                                    Blockers:
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

