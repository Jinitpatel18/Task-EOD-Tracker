import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { EodReportItem } from "@/models/EodReportItem";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/tasks/[id] - Update task
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (body.title) task.title = body.title.trim();
    if (typeof body.description === "string") task.description = body.description.trim();
    if (body.priority) task.priority = body.priority;
    if (body.status) task.status = body.status;
    if (body.assignedTo) task.assignedTo = body.assignedTo;
    if (body.assignedDate) task.assignedDate = new Date(body.assignedDate);
    if (body.dueDate) task.dueDate = new Date(body.dueDate);
    if (typeof body.comment === "string") task.comment = body.comment;

    await task.save();

    const populatedTask: any = await Task.findById(id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .lean();

    return NextResponse.json({
      success: true,
      task: {
        id: String(populatedTask._id),
        title: populatedTask.title,
        description: populatedTask.description,
        priority: populatedTask.priority,
        status: populatedTask.status,
        assignedTo: populatedTask.assignedTo
          ? {
              id: String(populatedTask.assignedTo._id),
              name: populatedTask.assignedTo.name,
              email: populatedTask.assignedTo.email,
            }
          : null,
        assignedBy: populatedTask.assignedBy
          ? {
              id: String(populatedTask.assignedBy._id),
              name: populatedTask.assignedBy.name,
              email: populatedTask.assignedBy.email,
            }
          : null,
        assignedDate: populatedTask.assignedDate,
        dueDate: populatedTask.dueDate,
        comment: populatedTask.comment || "",
        updatedAt: populatedTask.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tasks/[id] - Delete task
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Clean up associated EodReportItems
    await EodReportItem.deleteMany({ task: id });

    await Task.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Task and related report items deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
