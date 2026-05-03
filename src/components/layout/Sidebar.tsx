"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Trophy, BarChart3,
  BookOpen, LogOut, Calendar,
  Bell, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard",     label: "Bosh sahifa",      icon: LayoutDashboard, roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { href: "/students",      label: "Talabalar",         icon: Users,           roles: ["ADMIN", "TEACHER"] },
  { href: "/grades/new",    label: "Baho qo'shish",     icon: BookOpen,        roles: ["ADMIN", "TEACHER"] },
  { href: "/leaderboard",   label: "Reyting",           icon: Trophy,          roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { href: "/analytics",     label: "Tahlil",            icon: BarChart3,       roles: ["ADMIN", "TEACHER"] },
  { href: "/semesters",     label: "Semestrlar",        icon: Calendar,        roles: ["ADMIN", "TEACHER"] },
  { href: "/notifications", label: "Bildirishnomalar",  icon: Bell,            roles: ["ADMIN", "TEACHER"] },
  { href: "/audit-logs",    label: "Audit Jurnali",     icon: Shield,          roles: ["ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 dark:bg-gray-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
            {/* Kitob */}
            <rect x="5" y="6" width="22" height="20" rx="2" fill="white" fillOpacity="0.15"/>
            <rect x="5" y="6" width="22" height="20" rx="2" stroke="white" strokeWidth="1.5"/>
            <line x1="16" y1="6" x2="16" y2="26" stroke="white" strokeWidth="1.2" strokeOpacity="0.5"/>
            {/* Yulduz / Reyting belgisi */}
            <path d="M16 9 L17.2 12.6 L21 12.6 L18 14.8 L19.1 18.4 L16 16.2 L12.9 18.4 L14 14.8 L11 12.6 L14.8 12.6 Z"
              fill="white"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">EduRanking</p>
          <p className="text-xs text-gray-400">Baholash Tizimi</p>
        </div>
      </div>

      {/* Foydalanuvchi ma'lumotlari */}
      <div className="px-6 py-4 border-b border-gray-700">
        <p className="text-sm font-medium truncate">{user?.name}</p>
        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-blue-600">
          {user?.role === "ADMIN" ? "Administrator" : user?.role === "TEACHER" ? "O'qituvchi" : "Talaba"}
        </span>
      </div>

      {/* Navigatsiya */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Chiqish */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>
      </div>
    </aside>
  );
}
