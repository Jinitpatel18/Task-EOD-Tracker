import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { getSessionUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/employee/task-detail/:id - Fetch a single task by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const task = await Task.findOne({ _id: id, assignedTo: user.userId })
      .populate<{ assignedBy: { name: string; email: string } }>("assignedBy", "name email")
      .lean();

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or not assigned to you" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      task: {
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
      },
    });
  } catch (error: any) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/employee/task-detail/:id - Update task status and comment
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, comment } = await req.json();

    await connectToDatabase();

    const task = await Task.findOne({ _id: id, assignedTo: user.userId });
    if (!task) {
      return NextResponse.json(
        { error: "Task not found or not assigned to you" },
        { status: 404 }
      );
    }

    if (status) {
      const validStatuses = ["Pending", "In Progress", "Completed", "Blocked"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      task.status = status;
    }

    if (typeof comment === "string") {
      task.comment = comment.trim();
    }

    await task.save();

    return NextResponse.json({
      success: true,
      task: {
        id: String(task._id),
        title: task.title,
        status: task.status,
        comment: task.comment,
        updatedAt: task.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Update task status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
