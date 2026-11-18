"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { api } from "@/lib/api";
import {
  Sparkles,
  Award,
  ArrowRight,
  FileText,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from "lucide-react";

function InterviewCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id");
  const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : null;

  const [loading, setLoading] = useState(true);
  const [reportId, setReportId] = useState<number | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    if (sessionId) {
      api.interviews
        .end(sessionId)
        .then((res) => {
          setReportId(res.report_id);
          setOverallScore(res.overall_score);
        })
        .catch((err) => {
          setError(err.message || "Failed to finalize interview report.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-emerald-400 text-white shadow-xl shadow-brand-500/30 mb-6">
          <Award className="h-10 w-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Interview Completed!
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Great job! Asha has evaluated your responses across all 7 rubric dimensions and generated your feedback scorecard.
        </p>

        {loading ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 py-6">
            <Loader2 className="h-7 w-7 animate-spin text-brand-400" />
            <p className="text-xs text-slate-400">Compiling rubric evaluation & study recommendations...</p>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {error}
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {overallScore != null && (
              <div className="rounded-2xl border border-brand-500/30 bg-brand-950/40 p-5">
                <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider block mb-1">
                  Overall Performance Score
                </span>
                <span className="text-4xl font-extrabold text-white">
                  {overallScore} <span className="text-lg text-slate-400 font-normal">/ 100</span>
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Detailed category scores, strong areas, and missing concepts are available in your report.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {reportId ? (
                <Link
                  href={`/reports/${reportId}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 hover:bg-brand-500 transition hover:scale-[1.02]"
                >
                  View Performance Report
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white hover:bg-brand-500 transition"
                >
                  Return to Dashboard
                </Link>
              )}

              <Link
                href="/interview/role"
                className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900 px-5 py-3.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Practice Another Round
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewCompletePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm text-slate-400">Loading completion details...</p>
        </div>
      }
    >
      <InterviewCompleteContent />
    </React.Suspense>
  );
}
