import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { EodReport } from "@/models/EodReport";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Calculate end of this week (Sunday)
    const dayOfWeek = now.getDay();
    const daysUntilEndOfWeek = (7 - dayOfWeek) % 7;
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilEndOfWeek, 23, 59, 59, 999);

    const [
      pendingTasksCount,
      inProgressCount,
      completedCount,
      blockedCount,
      dueTodayCount,
      dueThisWeekCount,
      todayEodReport,
      recentTasks,
    ] = await Promise.all([
      Task.countDocuments({ assignedTo: user.userId, status: "Pending" }),
      Task.countDocuments({ assignedTo: user.userId, status: "In Progress" }),
      Task.countDocuments({ assignedTo: user.userId, status: "Completed" }),
      Task.countDocuments({ assignedTo: user.userId, status: "Blocked" }),
      Task.countDocuments({
        assignedTo: user.userId,
        dueDate: { $gte: startOfToday, $lte: endOfToday },
        status: { $ne: "Completed" },
      }),
      Task.countDocuments({
        assignedTo: user.userId,
        dueDate: { $gte: startOfToday, $lte: endOfWeek },
        status: { $ne: "Completed" },
      }),
      EodReport.findOne({ employee: user.userId, reportDate: todayStr }).lean(),
      Task.find({ assignedTo: user.userId })
        .populate("assignedBy", "name email")
        .sort({ dueDate: 1, createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      pendingTasksCount,
      inProgressCount,
      completedCount,
      blockedCount,
      dueTodayCount,
      dueThisWeekCount,
      hasSubmittedEodToday: !!todayEodReport,
      todayEodId: todayEodReport ? String((todayEodReport as any)._id) : null,
      recentTasks: recentTasks.map((t: any) => ({
        id: String(t._id),
        title: t.title,
        priority: t.priority,
        status: t.status,
        assignedDate: t.assignedDate,
        dueDate: t.dueDate,
        assignedBy: t.assignedBy ? t.assignedBy.name : "Admin",
      })),
    });
  } catch (error: any) {
    console.error("Employee dashboard stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

