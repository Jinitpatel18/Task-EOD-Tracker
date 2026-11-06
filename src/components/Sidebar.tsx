"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  Calendar,
  FilePlus,
  History,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

interface SidebarProps {
  role: "ADMIN" | "EMPLOYEE";
  userName?: string;
  userEmail?: string;
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    userName && userEmail ? { name: userName, email: userEmail } : null
  );

  useEffect(() => {
    if (!userName) {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser({ name: data.user.name, email: data.user.email });
          }
        })
        .catch(() => {});
    }
  }, [userName]);

  const adminLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Employees", href: "/admin/employees", icon: Users },
    { label: "Tasks", href: "/admin/tasks", icon: CheckSquare },
    { label: "EOD Reports", href: "/admin/eod", icon: FileText },
    { label: "Calendar", href: "/admin/calendar", icon: Calendar },
  ];

  const employeeLinks = [
    { label: "My Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
    { label: "My Tasks", href: "/employee/tasks", icon: CheckSquare },
    { label: "Submit EOD", href: "/employee/eod", icon: FilePlus },
    { label: "EOD History", href: "/employee/history", icon: History },
    { label: "My Calendar", href: "/employee/calendar", icon: Calendar },
  ];

  const links = role === "ADMIN" ? adminLinks : employeeLinks;

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/login");
        router.refresh();
      }
    } catch {
      toast.error("Failed to log out");
    }
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* App Branding */}
        <div className="flex items-center gap-3 px-2 py-4 border-b border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Task & EOD
            </h1>
            <span className="text-xs font-medium text-slate-500">
              {role === "ADMIN" ? "Admin Workspace" : "Employee Portal"}
            </span>
          </div>
        </div>

        {/* Role Pill */}
        <div className="mt-4 px-2">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              role === "ADMIN"
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}
          >
            {role === "ADMIN" ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <UserIcon className="h-3.5 w-3.5" />
            )}
            {role} ACCOUNT
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-slate-200 pt-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user?.name || "User"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email || ""}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white z-30">
        {navContent}
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <CheckSquare className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-900 text-sm">
            Task & EOD Tracker
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-white shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}

