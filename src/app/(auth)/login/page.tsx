import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Boxes, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md mb-2">
            <Boxes className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sign in to StockSense
          </CardTitle>
          <CardDescription className="text-xs">
            Role-Based Inventory & Warehouse Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 p-3.5 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication-Ready Architecture</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">
                User models, roles (Admin, Inventory Manager, Warehouse Staff),
                and Zod schemas are configured. Full auth session handling is
                scheduled for Phase 2.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="manager@stocksense.io"
                disabled
                className="bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                disabled
                className="bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          <Button asChild className="w-full mt-4">
            <Link href="/dashboard" className="gap-2">
              Enter Foundation Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
