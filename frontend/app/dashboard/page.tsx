"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ScoreRing } from "@/components/ScoreRing";
import {
  PlayCircle,
  FileText,
  Award,
  TrendingUp,
  CreditCard,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      api.dashboard
        .get()
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          setError(err.message || "Failed to load dashboard.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm text-slate-400">Loading your candidate dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = data?.stats || { total_interviews: 0, average_score: null, highest_score: null, credits_remaining: 0 };
  const categories = data?.categories_avg || {};
  const recentSessions = data?.recent_sessions || [];
  const resume = data?.resume;
  const weakTopics = data?.weak_topics || [];
  const recommendedTopics = data?.recommended_topics || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Candidate Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user?.full_name}!
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-xl">
            Track your interview performance, practice adaptive technical and behavioral rounds, and target your weak topics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/interview/role"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition hover:scale-[1.02]"
          >
            <PlayCircle className="h-4 w-4" />
            Start Interview
          </Link>
          <Link
            href="/interview/resume"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/80 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            <FileText className="h-4 w-4 text-brand-400" />
            {resume ? "Update Resume" : "Upload Resume"}
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Interviews</p>
            <p className="text-3xl font-extrabold text-white mt-1">{stats.total_interviews}</p>
            <p className="text-[11px] text-slate-400 mt-1">Completed sessions</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400 border border-brand-500/20">
            <PlayCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Average Score</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {stats.average_score != null ? `${stats.average_score}` : "—"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Out of 100 points</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Highest Score</p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {stats.highest_score != null ? `${stats.highest_score}` : "—"}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1">Personal Best</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Available Credits</p>
            <p className="text-3xl font-extrabold text-white mt-1">{user?.credits ?? 0}</p>
            <Link href="/pricing" className="text-[11px] font-semibold text-brand-400 hover:text-brand-300">
              Get more credits &rarr;
            </Link>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/15 text-amber-400 border border-amber-500/20">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance by Rubric Dimension */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              Rubric Dimension Performance
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Average scores evaluated across all completed interview questions
            </p>

            {Object.keys(categories).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(categories).map(([dim, val]) => {
                  const num = Number(val);
                  let barColor = "bg-emerald-500";
                  if (num < 50) barColor = "bg-rose-500";
                  else if (num < 70) barColor = "bg-amber-500";

                  return (
                    <div key={dim}>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className="text-slate-200 capitalize">
                          {dim.replace("_", " ")}
                        </span>
                        <span className="text-slate-400">{num} / 100</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all duration-1000`}
                          style={{ width: `${Math.min(100, Math.max(5, num))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
                <TrendingUp className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">No interview data yet.</p>
                <p className="text-xs text-slate-400 mt-1">Complete your first practice interview to see rubric score analytics.</p>
              </div>
            )}
          </div>

          {/* Recent Interview History */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Recent Interview Sessions</h3>
                <p className="text-xs text-slate-400">Past rounds and performance reports</p>
              </div>
              <Link href="/history" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
                View all &rarr;
              </Link>
            </div>

            {recentSessions.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {recentSessions.map((s: any) => (
                  <div key={s.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">{s.role}</h4>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 uppercase">
                          {s.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.company} Style · {s.duration_minutes} min
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {s.overall_score != null ? (
                        <div className="text-right">
                          <span
                            className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${
                              s.overall_score >= 70
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : s.overall_score >= 50
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {s.overall_score} / 100
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Incomplete</span>
                      )}

                      {s.report_id ? (
                        <Link
                          href={`/reports/${s.report_id}`}
                          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                        >
                          Report
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
                <Calendar className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">No interviews recorded yet.</p>
                <Link
                  href="/interview/role"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
                >
                  Start Your First Interview
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-8">
          {/* Resume Status Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Active Resume</h3>
              <Link href="/interview/resume" className="text-xs font-medium text-brand-400 hover:underline">
                Manage
              </Link>
            </div>

            {resume ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/20 text-brand-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{resume.filename}</p>
                    <p className="text-[10px] text-slate-400">Parsed & active for questions</p>
                  </div>
                </div>

                {resume.skills && resume.skills.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 mb-2">Detected Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.skills.slice(0, 8).map((sk: string) => (
                        <span
                          key={sk}
                          className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                        >
                          {sk}
                        </span>
                      ))}
                      {resume.skills.length > 8 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{resume.skills.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center">
                <FileText className="h-7 w-7 mx-auto text-slate-600 mb-2" />
                <p className="text-xs text-slate-300 font-medium">No resume uploaded</p>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">
                  Upload a PDF/DOCX resume to generate personalized interview questions based on your projects.
                </p>
                <Link
                  href="/interview/resume"
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Upload Resume
                </Link>
              </div>
            )}
          </div>

          {/* Actionable Recommendations */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Focus Areas & Study Plan
            </h3>

            {weakTopics.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Topics scored below rubric line in recent interviews:
                </p>
                <div className="space-y-2">
                  {weakTopics.map((topic: string) => (
                    <div
                      key={topic}
                      className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-300"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="font-medium">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-400">
                <p>
                  No specific weak topics identified yet. Practice more rounds across technical fundamentals, system design, and behavioral questions.
                </p>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/interview/role"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              >
                Launch Targeted Practice Round
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
