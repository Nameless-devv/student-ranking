"use client";

import { Bell, Sun, Moon, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sras_theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sras_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sras_theme", "light");
    }
  };

  return (
    <header className="flex items-center justify-between border-b bg-white dark:bg-gray-900 px-6 py-3">
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleDark} title="Qorong'u rejimni o'zgartirish">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" title="Bildirishnomalar">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
