import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EodReport } from "@/models/EodReport";
import { EodReportItem } from "@/models/EodReportItem";
import "@/models/Task";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const reports = await EodReport.find({ employee: user.userId })
      .sort({ reportDate: -1, submittedAt: -1 })
      .lean();

    const reportIds = reports.map((r) => r._id);

    const items = await EodReportItem.find({ eodReport: { $in: reportIds } })
      .populate("task", "title priority status")
      .lean();

    const itemsMap = new Map();
    items.forEach((item: any) => {
      const repId = String(item.eodReport);
      if (!itemsMap.has(repId)) itemsMap.set(repId, []);
      itemsMap.get(repId).push({
        id: String(item._id),
        taskTitle: item.task ? item.task.title : "Task",
        taskPriority: item.task ? item.task.priority : "Medium",
        workDone: item.workDone,
        status: item.status,
        hoursSpent: item.hoursSpent,
        blockers: item.blockers || "",
      });
    });

    const formattedReports = reports.map((rep: any) => {
      const repItems = itemsMap.get(String(rep._id)) || [];
      const totalHours = repItems.reduce(
        (sum: number, it: any) => sum + (Number(it.hoursSpent) || 0),
        0
      );

      return {
        id: String(rep._id),
        reportDate: rep.reportDate,
        summary: rep.summary || "",
        submittedAt: rep.submittedAt,
        totalHours: Number(totalHours.toFixed(1)),
        itemsCount: repItems.length,
        items: repItems,
      };
    });

    return NextResponse.json({ reports: formattedReports });
  } catch (error: any) {
    console.error("Fetch EOD history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load EOD history" },
      { status: 500 }
    );
  }
}

