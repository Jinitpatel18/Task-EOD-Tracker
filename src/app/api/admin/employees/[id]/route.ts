import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { EodReport } from "@/models/EodReport";
import { EodReportItem } from "@/models/EodReportItem";
import { hashPassword } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/employees/[id] - Edit employee
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { name, email, password, isActive, role } = await req.json();

    await connectToDatabase();

    const employee = await User.findById(id);
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    if (name) employee.name = name.trim();
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      // Check if email taken by someone else
      const duplicate = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Email is already taken by another user" },
          { status: 409 }
        );
      }
      employee.email = normalizedEmail;
    }
    if (typeof isActive === "boolean") {
      employee.isActive = isActive;
    }
    if (role && (role === "ADMIN" || role === "EMPLOYEE")) {
      employee.role = role;
    }
    if (password && password.trim().length >= 6) {
      employee.passwordHash = await hashPassword(password.trim());
    }

    await employee.save();

    return NextResponse.json({
      success: true,
      employee: {
        id: String(employee._id),
        name: employee.name,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/employees/[id] - Delete employee
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const employee = await User.findById(id);
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Clean up or reassign tasks
    await Task.deleteMany({ assignedTo: id });

    // Clean up EOD reports & items
    const reports = await EodReport.find({ employee: id }).select("_id");
    const reportIds = reports.map((r) => r._id);
    if (reportIds.length > 0) {
      await EodReportItem.deleteMany({ eodReport: { $in: reportIds } });
      await EodReport.deleteMany({ employee: id });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Employee and associated records deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
