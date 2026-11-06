# Team Task & EOD Tracker 📋🚀

A modern, full-stack team task assignment and daily End-of-Day (EOD) progress tracker built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Mongoose + MongoDB**.

---

## ✨ Features

### 🔐 1. Authentication & Role-Based Access Control
- **Dual Roles**: `ADMIN` and `EMPLOYEE`.
- **JWT + HTTP-Only Cookie Sessions**: Edge-compatible `jose` token signing and verification.
- **Password Security**: Passwords hashed with `bcryptjs`.
- **Route & API Protection**: Next.js middleware guards `/admin/*` and `/api/admin/*` against unauthorized or employee access, and protects employee endpoints.
- **Convenient Login Screen**: Includes **1-Click Quick Fill** test buttons for instantaneous login as Admin or Employees.

### 👔 2. Admin Workspace
- **Dashboard Overview**: Key metrics cards showing total active employees, total tasks, pending tasks, and tasks completed today.
- **Employee Management**:
  - Full employee table showing Name, Email, Role, Status, Joined Date, Assigned Tasks count, and Completed Tasks count.
  - Add new employees with initial password.
  - Edit employee details (name, email, role).
  - Toggle active/deactive status or delete employees.
- **Task Assignment & Management**:
  - Create tasks with Title, Description, Assignee (Employee dropdown), Priority (Low / Medium / High), Assignment Date, Due Date, and Status (Pending / In Progress / Completed / Blocked).
  - Search tasks by title or description.
  - Multi-filter tasks by Employee, Status, and Date Range.
  - Edit existing tasks or delete tasks.
- **EOD Reports Review**:
  - Browse end-of-day submissions with filters for specific employees and dates.
  - Inspect summary, individual task progress items, hours logged, and flagged blockers.
- **Monthly Assignment & Due Calendar**:
  - Full-month interactive grid showing both task assignment dates and deadlines.
  - **Admin Tracking ("Kis employee ko kis date ko kaam diya tha")**: Clicking any calendar date opens a side panel listing all tasks assigned or due on that specific date with employee names and details.
  - Filter calendar events by specific employee.

### 💼 3. Employee Workspace
- **Personal Dashboard**:
  - Personalized summary: Pending tasks, tasks due today/this week, and completed count.
  - Quick action to jump straight into today's EOD report.
- **My Tasks**:
  - View all assigned work with priority badges and deadlines.
  - Interactive status updater (`Pending` ➔ `In Progress` ➔ `Completed` / `Blocked`) with an optional progress comment.
- **Daily EOD Report Submission**:
  - Pick the report date (defaults to today).
  - Auto-loads all tasks assigned to the employee.
  - Per-task entry for work done today, updated status, hours spent, and any blockers faced.
  - Enforces one report per employee per day, with full editing capabilities until the end of the day.
- **My EOD History**:
  - Chronological history of all past submitted reports with hours breakdown and task logs.
- **Personal Calendar**:
  - Monthly calendar showing personal task assignment dates and deadlines.
  - Click any day to inspect assigned tasks and deadlines in the side panel.

---

## 🗄️ Database Models (Mongoose)

1. **User**: `name`, `email`, `passwordHash`, `role` (`ADMIN` | `EMPLOYEE`), `isActive`, `createdAt`, `updatedAt`
2. **Task**: `title`, `description`, `priority` (`Low` | `Medium` | `High`), `status` (`Pending` | `In Progress` | `Completed` | `Blocked`), `assignedTo` (ref User), `assignedBy` (ref User), `assignedDate`, `dueDate`, `comment`, `timestamps`
3. **EodReport**: `employee` (ref User), `reportDate` (`YYYY-MM-DD`), `summary`, `submittedAt`, compound unique index on `{ employee: 1, reportDate: 1 }`
4. **EodReportItem**: `eodReport` (ref EodReport), `task` (ref Task), `workDone`, `status`, `hoursSpent`, `blockers`

---

## 🔑 Default Seed Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Admin User | `admin@company.com` | `Admin@123` |
| **Employee** | John Doe | `john@company.com` | `Employee@123` |
| **Employee** | Sarah Connor | `sarah@company.com` | `Employee@123` |
| **Employee** | Mike Ross | `mike@company.com` | `Employee@123` |

*(On the `/login` page, you can also click the quick-login demo pills to fill these credentials with a single click!)*

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **MongoDB** instance:
  - Either a local MongoDB server (`mongodb://127.0.0.1:27017/task_tracker_db`), or
  - A free cloud database cluster from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### 2. Configure Environment Variables
Verify or edit `.env` in the project root:

```env
# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb://127.0.0.1:27017/task_tracker_db
# For Atlas, use: mongodb+srv://<username>:<password>@cluster0.mongodb.net/task_tracker?retryWrites=true&w=majority

# JWT Authentication Secret
JWT_SECRET=super_secret_eod_tracker_jwt_key_2026_xyz987654321

# App URL
NEXT_PUBLIC_APP_NAME="Team Task & EOD Tracker"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Seed the Database
Populate default users (Admin + 3 employees), initial tasks across calendar dates, and sample EOD reports:

```bash
npm run seed
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
Task-manager/
├── .env                         # Environment variables (MONGODB_URI, JWT_SECRET)
├── .env.example                 # Example environment template
├── next.config.mjs              # Next.js 15 configuration
├── package.json                 # Project dependencies & scripts
├── postcss.config.js            # PostCSS plugins
├── tailwind.config.ts           # Tailwind CSS styling configuration
├── tsconfig.json                # TypeScript compiler configuration
├── global.d.ts                  # Ambient module declarations
├── scripts/
│   └── seed.mjs                 # MongoDB seeding script (Admin, Employees, Tasks, EOD)
└── src/
    ├── middleware.ts            # Route protection & role redirection middleware
    ├── app/
    │   ├── layout.tsx           # Root layout with Sonner toaster & typography
    │   ├── page.tsx             # Root page (auto-redirects to /admin or /employee)
    │   ├── login/
    │   │   └── page.tsx         # Login page with 1-click test credentials
    │   ├── admin/
    │   │   ├── layout.tsx       # Admin sidebar & header shell
    │   │   ├── dashboard/       # Metrics cards & recent activity
    │   │   ├── employees/       # Employee CRUD & task statistics table
    │   │   ├── tasks/           # Task creation, editing, filters & search
    │   │   ├── eod/             # Employee EOD reports inspection
    │   │   └── calendar/        # Monthly calendar with day side-panel
    │   ├── employee/
    │   │   ├── layout.tsx       # Employee sidebar shell
    │   │   ├── dashboard/       # Personal task summaries & quick actions
    │   │   ├── tasks/           # Assigned tasks & status updater
    │   │   ├── eod/             # Daily EOD submission form
    │   │   ├── history/         # Past EOD reports history
    │   │   └── calendar/        # Personal monthly assignment & due calendar
    │   └── api/
    │       ├── auth/
    │       │   ├── login/       # POST: Validate password & issue JWT
    │       │   ├── logout/      # POST: Clear session cookie
    │       │   └── me/          # GET: Fetch authenticated user
    │       ├── admin/
    │       │   ├── stats/       # GET: Summary dashboard metrics
    │       │   ├── employees/   # GET/POST: List and create employees
    │       │   │   └── [id]/    # PUT/DELETE: Update and delete employee
    │       │   ├── tasks/       # GET/POST: Filtered task list and assignment
    │       │   │   └── [id]/    # PUT/DELETE: Update and delete task
    │       │   ├── eod-reports/ # GET: Review submitted EOD reports
    │       │   └── calendar/    # GET: Tasks for monthly calendar view
    │       └── employee/
    │           ├── dashboard/   # GET: Personal task stats
    │           ├── tasks/       # GET: Assigned tasks
    │           │   └── [id]/    # PATCH: Update status & comment
    │           ├── eod/         # GET/POST: Fetch or submit today's EOD
    │           ├── eod-history/ # GET: Past EOD reports
    │           └── calendar/    # GET: Personal calendar tasks
    ├── components/
    │   ├── Sidebar.tsx          # Responsive navigation sidebar & mobile drawer
    │   └── CalendarView.tsx     # Monthly calendar grid with day inspection drawer
    ├── lib/
    │   ├── auth.ts              # Password hashing & JWT token session helpers
    │   ├── mongodb.ts           # Mongoose singleton connection manager
    │   └── utils.ts             # Tailwind class merging & date formatters
    └── models/
        ├── User.ts              # User schema & model
        ├── Task.ts              # Task schema & model
        ├── EodReport.ts         # EOD Report schema & model
        └── EodReportItem.ts     # EOD Report Item schema & model
```

