import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { EodReport } from "@/models/EodReport";

export async function GET() {
  try {
    await connectToDatabase();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayStr = new Date().toISOString().split("T")[0];

    const [
      totalEmployees,
      activeEmployees,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      blockedTasks,
      completedToday,
      eodSubmittedToday,
    ] = await Promise.all([
      User.countDocuments({ role: "EMPLOYEE" }),
      User.countDocuments({ role: "EMPLOYEE", isActive: true }),
      Task.countDocuments({}),
      Task.countDocuments({ status: "Pending" }),
      Task.countDocuments({ status: "In Progress" }),
      Task.countDocuments({ status: "Completed" }),
      Task.countDocuments({ status: "Blocked" }),
      Task.countDocuments({
        status: "Completed",
        updatedAt: { $gte: startOfToday, $lte: endOfToday },
      }),
      EodReport.countDocuments({ reportDate: todayStr }),
    ]);

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      blockedTasks,
      completedToday,
      eodSubmittedToday,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

