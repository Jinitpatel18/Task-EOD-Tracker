import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import "@/models/User";

// GET /api/admin/calendar
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const yearMonth = searchParams.get("month"); // e.g. "2026-11"

    const query: any = {};
    if (employeeId && employeeId !== "all") {
      query.assignedTo = employeeId;
    }

    if (yearMonth) {
      const [year, month] = yearMonth.split("-").map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      // Tasks where assignedDate OR dueDate falls in this month
      query.$or = [
        { assignedDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { dueDate: { $gte: startOfMonth, $lte: endOfMonth } },
      ];
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email role isActive")
      .populate("assignedBy", "name email")
      .sort({ assignedDate: 1 })
      .lean();

    const formattedTasks = tasks.map((task: any) => ({
      id: String(task._id),
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo
        ? {
            id: String(task.assignedTo._id),
            name: task.assignedTo.name,
            email: task.assignedTo.email,
          }
        : null,
      assignedBy: task.assignedBy
        ? {
            id: String(task.assignedBy._id),
            name: task.assignedBy.name,
            email: task.assignedBy.email,
          }
        : null,
      assignedDate: task.assignedDate,
      dueDate: task.dueDate,
      comment: task.comment || "",
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error: any) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load calendar events" },
      { status: 500 }
    );
  }
}

