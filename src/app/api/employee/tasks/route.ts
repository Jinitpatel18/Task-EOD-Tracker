import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { getSessionUser } from "@/lib/auth";

// GET /api/employee/tasks - List assigned tasks for current employee
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const query: any = { assignedTo: user.userId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { description: regex }];
    }

    const tasks = await Task.find(query)
      .populate("assignedBy", "name email")
      .sort({ dueDate: 1, createdAt: -1 })
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
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error: any) {
    console.error("Employee tasks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

