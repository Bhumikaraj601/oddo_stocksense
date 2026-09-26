import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, Layers, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PlaceholderViewProps {
  title: string;
  module: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  nextPhaseText?: string;
}

export function PlaceholderView({
  title,
  module,
  description,
  icon: Icon,
  features,
  nextPhaseText = "Full workflow and business logic will be implemented in Phase 2.",
}: PlaceholderViewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <CardContent className="p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-sm">
            <Icon className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 mb-3">
            <Layers className="w-3.5 h-3.5" />
            Phase 1 Foundation Ready • {module}
          </span>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            {description}
          </p>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 text-left mb-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Architectural Readiness & Models
            </h3>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="default">
              <Link href="/dashboard" className="gap-2">
                Return to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 sm:mt-0">
              {nextPhaseText}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
