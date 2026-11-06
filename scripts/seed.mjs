import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env file automatically in Node
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // ignore if not present
  }
}

const MONGODB_URI =
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/task_tracker_db";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "EMPLOYEE"], default: "EMPLOYEE" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["Pending", "In Progress", "Completed", "Blocked"], default: "Pending" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

const EodReportSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportDate: { type: String, required: true },
    summary: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
EodReportSchema.index({ employee: 1, reportDate: 1 }, { unique: true });

const EodReportItemSchema = new mongoose.Schema(
  {
    eodReport: { type: mongoose.Schema.Types.ObjectId, ref: "EodReport", required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    workDone: { type: String, required: true },
    status: { type: String, enum: ["Pending", "In Progress", "Completed", "Blocked"], required: true },
    hoursSpent: { type: Number, required: true, default: 1 },
    blockers: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
const EodReport = mongoose.models.EodReport || mongoose.model("EodReport", EodReportSchema);
const EodReportItem = mongoose.models.EodReportItem || mongoose.model("EodReportItem", EodReportItemSchema);

async function seed() {
  console.log("🌱 Connecting to MongoDB at:", MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      dbName: "task_tracker_db",
    });
    console.log(" Connected to MongoDB successfully!");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    console.log("\n💡 Tip: Make sure MongoDB is running locally or set MONGODB_URI in .env to a MongoDB Atlas cluster.");
    process.exit(1);
  }

  try {
    console.log(" Cleaning existing test data...");
    await User.deleteMany({});
    await Task.deleteMany({});
    await EodReport.deleteMany({});
    await EodReportItem.deleteMany({});

    console.log(" Creating default accounts...");
    const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
    const empPasswordHash = await bcrypt.hash("Employee@123", 10);

    const admin = await User.create({
      name: "Admin User",
      email: "admin@company.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
    });

    const emp1 = await User.create({
      name: "John Doe",
      email: "john@company.com",
      passwordHash: empPasswordHash,
      role: "EMPLOYEE",
      isActive: true,
    });

    const emp2 = await User.create({
      name: "Sarah Connor",
      email: "sarah@company.com",
      passwordHash: empPasswordHash,
      role: "EMPLOYEE",
      isActive: true,
    });

    const emp3 = await User.create({
      name: "Mike Ross",
      email: "mike@company.com",
      passwordHash: empPasswordHash,
      role: "EMPLOYEE",
      isActive: true,
    });

    console.log("✅ Seeded Admin: admin@company.com / Admin@123");
    console.log("✅ Seeded Employees (Password: Employee@123):");
    console.log("   - john@company.com (John Doe)");
    console.log("   - sarah@company.com (Sarah Connor)");
    console.log("   - mike@company.com (Mike Ross)");

    const today = new Date();
    const getFormattedDate = (d) => d.toISOString().split("T")[0];

    // Seed tasks with dates around today for calendar visibility
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 5);

    console.log(" Creating initial tasks...");
    const task1 = await Task.create({
      title: "Design Login & Authentication Flow",
      description: "Implement responsive login screen with session cookies and role checks.",
      priority: "High",
      status: "Completed",
      assignedTo: emp1._id,
      assignedBy: admin._id,
      assignedDate: yesterday,
      dueDate: today,
      comment: "Completed responsive UI and JWT integration.",
    });

    const task2 = await Task.create({
      title: "Build Employee EOD Submission Form",
      description: "Allow employees to submit daily work, hours, and blockers.",
      priority: "High",
      status: "In Progress",
      assignedTo: emp1._id,
      assignedBy: admin._id,
      assignedDate: today,
      dueDate: tomorrow,
      comment: "Form layout ready, adding validation.",
    });

    const task3 = await Task.create({
      title: "Setup MongoDB Aggregations for Admin Stats",
      description: "Write queries for total employees, task status counts, and completed today.",
      priority: "Medium",
      status: "Pending",
      assignedTo: emp2._id,
      assignedBy: admin._id,
      assignedDate: today,
      dueDate: nextWeek,
    });

    const task4 = await Task.create({
      title: "Create Interactive Monthly Calendar View",
      description: "Display tasks on their assignment date and due date with side drawer.",
      priority: "High",
      status: "In Progress",
      assignedTo: emp3._id,
      assignedBy: admin._id,
      assignedDate: yesterday,
      dueDate: tomorrow,
      comment: "Working on month navigation and day click handler.",
    });

    const task5 = await Task.create({
      title: "Implement API Route Role-Based Middleware",
      description: "Ensure employees cannot access admin endpoints or view other employee logs.",
      priority: "Low",
      status: "Completed",
      assignedTo: emp2._id,
      assignedBy: admin._id,
      assignedDate: yesterday,
      dueDate: today,
      comment: "All routes verified and covered.",
    });

    console.log("✅ Seeded 5 sample tasks.");

    // Seed sample EOD report for yesterday
    const yesterdayStr = getFormattedDate(yesterday);
    const eod1 = await EodReport.create({
      employee: emp1._id,
      reportDate: yesterdayStr,
      summary: "Completed authentication setup and started EOD form.",
      submittedAt: yesterday,
    });

    await EodReportItem.create({
      eodReport: eod1._id,
      task: task1._id,
      workDone: "Wrote login form, error alerts, and JWT cookie handlers.",
      status: "Completed",
      hoursSpent: 5.5,
      blockers: "None",
    });

    await EodReportItem.create({
      eodReport: eod1._id,
      task: task2._id,
      workDone: "Sketched initial wireframe and state management.",
      status: "In Progress",
      hoursSpent: 2.5,
      blockers: "Waiting on final schema definition for EOD items.",
    });

    console.log("✅ Seeded sample EOD report for John Doe.");
    console.log("\n🎉 Database seeded successfully!");
  } catch (err) {
    console.error("❌ Error while seeding database:", err);
  } finally {
    await mongoose.disconnect();
    console.log(" Closed MongoDB connection.");
  }
}

seed();

