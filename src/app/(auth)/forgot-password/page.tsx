"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  KeyRound,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successData, setSuccessData] = React.useState<{
    message: string;
    devOtp?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to process request. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessData(data.data);
      setIsLoading(false);
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-2xl border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 mb-1">
            <KeyRound className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Enter your registered account email to receive a 6-digit verification code.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3.5 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-[11px] mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {successData ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verification Code Dispatched
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {successData.message}
                </p>

                {successData.devOtp && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 mb-1 flex items-center justify-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Development Mode Test OTP
                    </p>
                    <p className="text-2xl font-mono font-bold tracking-widest text-amber-950 dark:text-amber-100">
                      {successData.devOtp}
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                      (Logged to dev server console)
                    </p>
                  </div>
                )}
              </div>

              <Button asChild className="w-full h-10 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                <Link
                  href={`/reset-password?email=${encodeURIComponent(email)}`}
                  className="gap-2"
                >
                  Enter Verification Code <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Registered Email Address
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@stocksense.io"
                  className="bg-slate-50 dark:bg-slate-900/80 h-10 text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 text-sm font-semibold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating OTP...
                  </>
                ) : (
                  <>
                    Send Verification Code (OTP) <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-center pt-2 pb-6 border-t border-slate-100 dark:border-slate-800/80">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
