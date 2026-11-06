import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { getSessionUser } from "@/lib/auth";

// GET /api/admin/tasks - List all tasks with filters & search
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {};

    if (employeeId && employeeId !== "all") {
      query.assignedTo = employeeId;
    }

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

    if (startDate || endDate) {
      query.assignedDate = {};
      if (startDate) {
        query.assignedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.assignedDate.$lte = end;
      }
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email role isActive")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 })
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
            isActive: task.assignedTo.isActive,
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
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error: any) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/admin/tasks - Create task
export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      title,
      description = "",
      assignedTo,
      priority = "Medium",
      assignedDate,
      dueDate,
      status = "Pending",
    } = await req.json();

    if (!title || !assignedTo || !assignedDate || !dueDate) {
      return NextResponse.json(
        { error: "Title, assigned employee, assignment date, and due date are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      assignedTo,
      assignedBy: admin.userId,
      assignedDate: new Date(assignedDate),
      dueDate: new Date(dueDate),
      comment: "",
    });

    const populatedTask: any = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .lean();

    return NextResponse.json(
      {
        success: true,
        task: {
          id: String(populatedTask._id),
          title: populatedTask.title,
          description: populatedTask.description,
          priority: populatedTask.priority,
          status: populatedTask.status,
          assignedTo: {
            id: String(populatedTask.assignedTo._id),
            name: populatedTask.assignedTo.name,
            email: populatedTask.assignedTo.email,
          },
          assignedBy: {
            id: String(populatedTask.assignedBy._id),
            name: populatedTask.assignedBy.name,
            email: populatedTask.assignedBy.email,
          },
          assignedDate: populatedTask.assignedDate,
          dueDate: populatedTask.dueDate,
          createdAt: populatedTask.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}

