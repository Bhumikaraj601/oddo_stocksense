import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple className strings and tailwind classes cleanly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number with commas for readability.
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a date into a clean human-readable string.
 */
export function formatDate(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Generates human readable badges for operation statuses.
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status.toUpperCase()) {
    case "DRAFT":
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-slate-300 dark:border-slate-700",
      };
    case "WAITING":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800/50",
      };
    case "READY":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800/50",
      };
    case "DONE":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800/50",
      };
    case "CANCELED":
      return {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-700 dark:text-rose-400",
        border: "border-rose-200 dark:border-rose-800/50",
      };
    default:
      return {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-slate-300 dark:border-slate-700",
      };
  }
}
