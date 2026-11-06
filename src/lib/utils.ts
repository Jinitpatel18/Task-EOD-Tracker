import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isThisWeek } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "MMM dd, yyyy");
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "MMM dd, yyyy hh:mm a");
  } catch {
    return String(date);
  }
}

export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function isTaskDueToday(dueDate: Date | string): boolean {
  try {
    const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    return isToday(d);
  } catch {
    return false;
  }
}

export function isTaskDueThisWeek(dueDate: Date | string): boolean {
  try {
    const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    return isThisWeek(d, { weekStartsOn: 1 });
  } catch {
    return false;
  }
}

