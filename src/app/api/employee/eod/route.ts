import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { EodReport } from "@/models/EodReport";
import { EodReportItem } from "@/models/EodReportItem";
import { getSessionUser } from "@/lib/auth";

// GET /api/employee/eod - Get EOD report for a given date + available assigned tasks
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const dateParam =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Check if an EOD report already exists for this date
    const existingReport = await EodReport.findOne({
      employee: user.userId,
      reportDate: dateParam,
    }).lean();

    let items: any[] = [];
    if (existingReport) {
      const dbItems = await EodReportItem.find({
        eodReport: (existingReport as any)._id,
      })
        .populate("task", "title priority status")
        .lean();

      items = dbItems.map((item: any) => ({
        id: String(item._id),
        taskId: item.task ? String(item.task._id) : String(item.task),
        taskTitle: item.task ? item.task.title : "Task",
        taskPriority: item.task ? item.task.priority : "Medium",
        workDone: item.workDone,
        status: item.status,
        hoursSpent: item.hoursSpent,
        blockers: item.blockers || "",
      }));
    }

    // Get all assigned tasks for this employee to show in dropdown or pre-fill
    const assignedTasks = await Task.find({
      assignedTo: user.userId,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const formattedAssignedTasks = assignedTasks.map((t: any) => ({
      id: String(t._id),
      title: t.title,
      priority: t.priority,
      status: t.status,
      assignedDate: t.assignedDate,
      dueDate: t.dueDate,
    }));

    return NextResponse.json({
      reportDate: dateParam,
      report: existingReport
        ? {
            id: String((existingReport as any)._id),
            reportDate: (existingReport as any).reportDate,
            summary: (existingReport as any).summary || "",
            submittedAt: (existingReport as any).submittedAt,
            items,
          }
        : null,
      availableTasks: formattedAssignedTasks,
    });
  } catch (error: any) {
    console.error("Employee EOD fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch EOD report data" },
      { status: 500 }
    );
  }
}

// POST /api/employee/eod - Create or update EOD report
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportDate, summary = "", items = [] } = await req.json();

    if (!reportDate) {
      return NextResponse.json(
        { error: "Report date is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Please add at least one task entry in your EOD report" },
        { status: 400 }
      );
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.taskId || !it.workDone || !it.workDone.trim()) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Please select a task and describe work done` },
          { status: 400 }
        );
      }
      if (typeof it.hoursSpent !== "number" || it.hoursSpent <= 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Hours spent must be greater than 0` },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    // Check if an EOD report already exists for this employee on this date
    let report = await EodReport.findOne({
      employee: user.userId,
      reportDate,
    });

    if (report) {
      // Edit existing report
      report.summary = summary.trim();
      report.submittedAt = new Date();
      await report.save();

      // Remove previous items and recreate fresh items
      await EodReportItem.deleteMany({ eodReport: report._id });
    } else {
      // Create new report
      report = await EodReport.create({
        employee: user.userId,
        reportDate,
        summary: summary.trim(),
        submittedAt: new Date(),
      });
    }

    // Create report items and update task statuses
    for (const it of items) {
      await EodReportItem.create({
        eodReport: report._id,
        task: it.taskId,
        workDone: it.workDone.trim(),
        status: it.status,
        hoursSpent: Number(it.hoursSpent),
        blockers: it.blockers ? it.blockers.trim() : "",
      });

      // Update the underlying task's status and comment
      await Task.findOneAndUpdate(
        { _id: it.taskId, assignedTo: user.userId },
        {
          status: it.status,
          comment: `[EOD ${reportDate}] ${it.workDone.trim()}`,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "EOD report submitted successfully!",
      reportId: String(report._id),
      reportDate,
    });
  } catch (error: any) {
    console.error("Employee EOD submit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit EOD report" },
      { status: 500 }
    );
  }
}

