"use client";

import * as React from "react";
import { Search, Bell, User as UserIcon, Database, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Search Input Placeholder */}
      <div className="flex items-center gap-4 w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products, SKUs, references..."
            className="pl-9 h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* DB Connection status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>PostgreSQL / Prisma</span>
          <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-0.5" />
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
        </button>

        {/* User profile dropdown pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800">
            WM
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
              Warehouse Manager
            </p>
            <p className="text-[10px] text-slate-500 leading-none mt-1">
              admin@stocksense.io
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
