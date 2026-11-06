"use client";

import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed" | "Blocked";
  assignedDate: string | Date;
  dueDate: string | Date;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedBy?: {
    name: string;
  } | null;
  comment?: string;
}

interface CalendarViewProps {
  tasks: CalendarTask[];
  isAdmin?: boolean;
  employees?: Array<{ id: string; name: string }>;
  selectedEmployeeId?: string;
  onEmployeeFilterChange?: (employeeId: string) => void;
}

export default function CalendarView({
  tasks,
  isAdmin = false,
  employees = [],
  selectedEmployeeId = "all",
  onEmployeeFilterChange,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(true);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    setIsSidePanelOpen(true);
  };

  // Calendar matrix calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;

  // Helper to parse dates safely
  const parseTaskDate = (d: string | Date) => {
    return typeof d === "string" ? parseISO(d) : new Date(d);
  };

  // Normalize date to YYYY-MM-DD
  const toDateKey = (d: Date) => format(d, "yyyy-MM-dd");

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  // Find tasks assigned or due on a given day
  const getTasksForDay = (date: Date) => {
    const dateKey = toDateKey(date);

    const assignedTasks = tasks.filter((t) => {
      try {
        return toDateKey(parseTaskDate(t.assignedDate)) === dateKey;
      } catch {
        return false;
      }
    });

    const dueTasks = tasks.filter((t) => {
      try {
        return toDateKey(parseTaskDate(t.dueDate)) === dateKey;
      } catch {
        return false;
      }
    });

    return { assignedTasks, dueTasks };
  };

  const selectedDayInfo = selectedDate ? getTasksForDay(selectedDate) : null;

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
    <div className="relative flex flex-col xl:flex-row gap-6">
      {/* Main Calendar View */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header with Month Nav & Filters */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <p className="text-xs text-slate-500">
                Click any day to see work assigned and due
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isAdmin && employees.length > 0 && onEmployeeFilterChange && (
              <select
                value={selectedEmployeeId}
                onChange={(e) => onEmployeeFilterChange(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Today
            </button>

            <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-xs">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-l-lg border-r border-slate-200"
                aria-label="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-r-lg"
                aria-label="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
            <span>Task Assigned Date</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span>Task Due Date</span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50/50 text-xs font-semibold text-slate-500 py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Month Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 flex-1">
          {rows.flat().map((d, index) => {
            const isCurrentMonth = isSameMonth(d, monthStart);
            const isDaySelected = selectedDate && isSameDay(d, selectedDate);
            const isCurrentDay = isToday(d);
            const { assignedTasks, dueTasks } = getTasksForDay(d);
            const totalCount = assignedTasks.length + dueTasks.length;

            return (
              <div
                key={index}
                onClick={() => {
                  setSelectedDate(d);
                  setIsSidePanelOpen(true);
                }}
                className={`min-h-[96px] sm:min-h-[115px] p-1.5 sm:p-2 cursor-pointer transition-all flex flex-col justify-between ${
                  !isCurrentMonth ? "bg-slate-50/60 text-slate-400" : "bg-white"
                } ${
                  isDaySelected
                    ? "ring-2 ring-indigo-600 ring-inset bg-indigo-50/30"
                    : "hover:bg-slate-50/80"
                }`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold rounded-full h-6 w-6 ${
                      isCurrentDay
                        ? "bg-indigo-600 text-white"
                        : isDaySelected
                        ? "text-indigo-700 font-extrabold"
                        : isCurrentMonth
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {format(d, "d")}
                  </span>

                  {totalCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                      {totalCount}
                    </span>
                  )}
                </div>

                {/* Task Indicators */}
                <div className="mt-1 space-y-1 overflow-hidden flex-1">
                  {/* Assigned indicator */}
                  {assignedTasks.slice(0, 2).map((t) => (
                    <div
                      key={`as-${t.id}`}
                      className="truncate text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200"
                      title={`Assigned: ${t.title} (${t.assignedTo?.name || "Employee"})`}
                    >
                      <span className="font-semibold text-indigo-900">
                        {isAdmin ? `Assigned to ${t.assignedTo?.name || "Emp"}:` : "Assigned:"}
                      </span>{" "}
                      {t.title}
                    </div>
                  ))}

                  {/* Due indicator */}
                  {dueTasks.slice(0, 2).map((t) => (
                    <div
                      key={`due-${t.id}`}
                      className="truncate text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200"
                      title={`Due: ${t.title} (${t.assignedTo?.name || "Employee"})`}
                    >
                      <span className="font-semibold text-amber-900">
                        Due:
                      </span>{" "}
                      {t.title}
                    </div>
                  ))}

                  {totalCount > 4 && (
                    <div className="text-[9px] text-slate-500 font-medium pl-1">
                      +{totalCount - 4} more...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Panel for Day Details */}
      {isSidePanelOpen && selectedDate && (
        <aside className="w-full xl:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col self-start shrink-0">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Day Schedule
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                {format(selectedDate, "EEEE, MMMM dd, yyyy")}
              </h3>
            </div>
            <button
              onClick={() => setIsSidePanelOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-6 overflow-y-auto max-h-[600px] pr-1">
            {/* Section 1: Tasks Assigned On This Date (Admin key requirement) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  Tasks Assigned on this Date ({selectedDayInfo?.assignedTasks.length || 0})
                </h4>
              </div>

              {selectedDayInfo?.assignedTasks.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center border border-slate-100">
                  <p className="text-xs text-slate-500">
                    No tasks were assigned to anyone on this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayInfo?.assignedTasks.map((t) => (
                    <div
                      key={`panel-as-${t.id}`}
                      className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-sm font-semibold text-slate-900 leading-snug">
                          {t.title}
                        </h5>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {t.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-indigo-100/80 flex flex-col gap-1.5 text-xs text-slate-600">
                        {t.assignedTo && (
                          <div className="flex items-center gap-1.5 font-medium text-indigo-950">
                            <User className="h-3.5 w-3.5 text-indigo-600" />
                            <span>
                              Assigned to:{" "}
                              <strong className="text-slate-900">
                                {t.assignedTo.name}
                              </strong>{" "}
                              ({t.assignedTo.email})
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Due:{" "}
                            {format(parseTaskDate(t.dueDate), "MMM dd, yyyy")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold ${getStatusBadgeClass(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Tasks Due On This Date */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Tasks Due on this Date ({selectedDayInfo?.dueTasks.length || 0})
                </h4>
              </div>

              {selectedDayInfo?.dueTasks.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center border border-slate-100">
                  <p className="text-xs text-slate-500">
                    No task deadlines fall on this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayInfo?.dueTasks.map((t) => (
                    <div
                      key={`panel-due-${t.id}`}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-sm font-semibold text-slate-900 leading-snug">
                          {t.title}
                        </h5>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {t.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-amber-200/80 flex flex-col gap-1.5 text-xs text-slate-600">
                        {t.assignedTo && (
                          <div className="flex items-center gap-1.5 font-medium text-amber-950">
                            <User className="h-3.5 w-3.5 text-amber-600" />
                            <span>
                              Assignee:{" "}
                              <strong className="text-slate-900">
                                {t.assignedTo.name}
                              </strong>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Assigned on:{" "}
                            {format(parseTaskDate(t.assignedDate), "MMM dd, yyyy")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold ${getStatusBadgeClass(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

