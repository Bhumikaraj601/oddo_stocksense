"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Settings,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shuffle,
  SlidersHorizontal,
  History,
  Building2,
  ChevronDown,
} from "lucide-react";

interface NavItemChild {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  children?: NavItemChild[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Operations",
    href: "/operations",
    icon: ArrowLeftRight,
    children: [
      {
        title: "Receipts",
        href: "/operations/receipts",
        icon: ArrowDownToLine,
      },
      {
        title: "Delivery Orders",
        href: "/operations/deliveries",
        icon: ArrowUpFromLine,
      },
      {
        title: "Internal Transfers",
        href: "/operations/transfers",
        icon: Shuffle,
      },
      {
        title: "Adjustments",
        href: "/operations/adjustments",
        icon: SlidersHorizontal,
      },
      {
        title: "Move History",
        href: "/operations/ledger",
        icon: History,
      },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    children: [
      {
        title: "Warehouses & Locs",
        href: "/settings/warehouses",
        icon: Building2,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    Operations: true,
    Settings: true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Boxes className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            StockSense
            <span className="text-[10px] uppercase font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">Inventory System</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isActive =
            pathname === item.href ||
            (hasChildren && item.children?.some((child) => pathname === child.href));
          const isOpen = openSections[item.title] ?? true;

          if (hasChildren) {
            return (
              <div key={item.title} className="space-y-1">
                <button
                  onClick={() => toggleSection(item.title)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-slate-400 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="pl-6 space-y-1 pt-1 border-l border-slate-200 dark:border-slate-800 ml-4">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                            isChildActive
                              ? "bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900"
                          )}
                        >
                          <ChildIcon className="w-3.5 h-3.5" />
                          <span>{child.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer / Status Indicator */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              Odoo Hackathon
            </p>
            <p className="text-[11px] text-slate-500 truncate">Phase 1 Foundation</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
