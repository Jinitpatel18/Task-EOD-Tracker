import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { hashPassword } from "@/lib/auth";

// GET /api/admin/employees - List all employees with task stats
export async function GET() {
  try {
    await connectToDatabase();

    const employees = await User.find({ role: "EMPLOYEE" })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate tasks assigned and completed per employee
    const employeeStats = await Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          tasksAssigned: { $sum: 1 },
          tasksCompleted: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          tasksPending: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          tasksInProgress: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = new Map();
    employeeStats.forEach((stat) => {
      statsMap.set(String(stat._id), stat);
    });

    const enrichedEmployees = employees.map((emp) => {
      const stats = statsMap.get(String(emp._id)) || {
        tasksAssigned: 0,
        tasksCompleted: 0,
        tasksPending: 0,
        tasksInProgress: 0,
      };

      return {
        id: String(emp._id),
        name: emp.name,
        email: emp.email,
        role: emp.role,
        isActive: emp.isActive,
        joinedDate: emp.createdAt,
        tasksAssigned: stats.tasksAssigned,
        tasksCompleted: stats.tasksCompleted,
        tasksPending: stats.tasksPending,
        tasksInProgress: stats.tasksInProgress,
      };
    });

    return NextResponse.json({ employees: enrichedEmployees });
  } catch (error: any) {
    console.error("Fetch employees error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST /api/admin/employees - Add new employee
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = "EMPLOYEE", isActive = true } =
      await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json(
        { error: "An employee with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newEmployee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
      isActive: Boolean(isActive),
    });

    return NextResponse.json(
      {
        success: true,
        employee: {
          id: String(newEmployee._id),
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          isActive: newEmployee.isActive,
          joinedDate: newEmployee.createdAt,
          tasksAssigned: 0,
          tasksCompleted: 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}

