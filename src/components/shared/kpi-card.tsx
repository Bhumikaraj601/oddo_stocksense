import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: "default" | "warning" | "danger" | "success" | "info";
  className?: string;
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: KpiCardProps) {
  const variantStyles = {
    default: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    info: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border-sky-100 dark:border-sky-900/50",
  };

  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <div className={cn("p-2.5 rounded-xl border", variantStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <h4 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</h4>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.isPositive
                  ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
