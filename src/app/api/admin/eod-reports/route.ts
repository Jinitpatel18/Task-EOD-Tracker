import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EodReport } from "@/models/EodReport";
import { EodReportItem } from "@/models/EodReportItem";
import "@/models/User";
import "@/models/Task";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {};

    if (employeeId && employeeId !== "all") {
      query.employee = employeeId;
    }

    if (date) {
      query.reportDate = date;
    } else if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) query.reportDate.$gte = startDate;
      if (endDate) query.reportDate.$lte = endDate;
    }

    const reports = await EodReport.find(query)
      .populate("employee", "name email role isActive")
      .sort({ reportDate: -1, submittedAt: -1 })
      .lean();

    const reportIds = reports.map((r) => r._id);

    // Fetch items for all these reports
    const items = await EodReportItem.find({ eodReport: { $in: reportIds } })
      .populate("task", "title priority status")
      .lean();

    const itemsMap = new Map();
    items.forEach((item: any) => {
      const repId = String(item.eodReport);
      if (!itemsMap.has(repId)) itemsMap.set(repId, []);
      itemsMap.get(repId).push({
        id: String(item._id),
        task: item.task
          ? {
              id: String(item.task._id),
              title: item.task.title,
              priority: item.task.priority,
              currentStatus: item.task.status,
            }
          : { id: "deleted", title: "Deleted Task", priority: "Low", currentStatus: "Unknown" },
        workDone: item.workDone,
        status: item.status,
        hoursSpent: item.hoursSpent,
        blockers: item.blockers || "",
      });
    });

    const enrichedReports = reports.map((report: any) => {
      const reportItems = itemsMap.get(String(report._id)) || [];
      const totalHours = reportItems.reduce(
        (sum: number, it: any) => sum + (Number(it.hoursSpent) || 0),
        0
      );

      return {
        id: String(report._id),
        employee: report.employee
          ? {
              id: String(report.employee._id),
              name: report.employee.name,
              email: report.employee.email,
              isActive: report.employee.isActive,
            }
          : null,
        reportDate: report.reportDate,
        summary: report.summary || "",
        submittedAt: report.submittedAt,
        totalHours: Number(totalHours.toFixed(1)),
        itemsCount: reportItems.length,
        items: reportItems,
      };
    });

    return NextResponse.json({ reports: enrichedReports });
  } catch (error: any) {
    console.error("Fetch EOD reports error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch EOD reports" },
      { status: 500 }
    );
  }
}

