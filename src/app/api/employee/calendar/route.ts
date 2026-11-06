import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const yearMonth = searchParams.get("month"); // e.g. "2026-11"

    const query: any = { assignedTo: user.userId };

    if (yearMonth) {
      const [year, month] = yearMonth.split("-").map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      query.$or = [
        { assignedDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { dueDate: { $gte: startOfMonth, $lte: endOfMonth } },
      ];
    }

    const tasks = await Task.find(query)
      .populate("assignedBy", "name email")
      .sort({ assignedDate: 1 })
      .lean();

    const formattedTasks = tasks.map((task: any) => ({
      id: String(task._id),
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      assignedDate: task.assignedDate,
      dueDate: task.dueDate,
      comment: task.comment || "",
      assignedBy: task.assignedBy ? task.assignedBy.name : "Admin",
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error: any) {
    console.error("Employee calendar error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load calendar events" },
      { status: 500 }
    );
  }
}

