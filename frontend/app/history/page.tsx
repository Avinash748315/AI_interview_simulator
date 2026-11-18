"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  History as HistoryIcon,
  Search,
  ArrowRight,
  Calendar,
  Clock,
  PlayCircle,
  Loader2,
  FileText,
} from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      api.interviews
        .history()
        .then((res) => {
          setSessions(res);
        })
        .catch((err) => {
          console.error("Failed to load interview history", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, authLoading, router]);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.company.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === "completed") {
      return s.status === "completed";
    }
    if (statusFilter === "incomplete") {
      return s.status !== "completed";
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm text-slate-400">Loading your interview sessions history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <HistoryIcon className="h-7 w-7 text-brand-400" />
            Interview History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review your past mock interviews, scores, and progress over time.
          </p>
        </div>

        <Link
          href="/interview/role"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/30 hover:bg-brand-500 transition self-start sm:self-auto"
        >
          <PlayCircle className="h-4 w-4" />
          Start New Interview
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role or company..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "completed"
                ? "bg-brand-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Completed ({sessions.filter((s) => s.status === "completed").length})
          </button>
        </div>
      </div>

      {/* History List */}
      {filteredSessions.length > 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden divide-y divide-slate-800 shadow-xl">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{session.role}</h3>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
                    {session.level}
                  </span>
                  <span className="rounded bg-brand-950 text-brand-300 border border-brand-500/20 px-2 py-0.5 text-[10px] font-semibold">
                    {session.company} Style
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {session.duration_minutes} min duration
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status and Action */}
              <div className="flex items-center gap-3">
                {session.overall_score != null ? (
                  <span
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${
                      session.overall_score >= 70
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : session.overall_score >= 50
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    Score: {session.overall_score} / 100
                  </span>
                ) : (
                  <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-400 italic">
                    {session.status}
                  </span>
                )}

                {session.report_id ? (
                  <Link
                    href={`/reports/${session.report_id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-600/20 border border-brand-500/30 px-3.5 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-600 hover:text-white transition"
                  >
                    View Report <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <Link
                    href={`/interview/live?session_id=${session.id}`}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                  >
                    Resume <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
          <HistoryIcon className="h-10 w-10 mx-auto text-slate-600 mb-3" />
          <p className="text-base font-semibold text-slate-200">No interview sessions found.</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Once you complete a practice round, your questions, answers, and scores will be stored here permanently.
          </p>
          <Link
            href="/interview/role"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-500"
          >
            Start Your First Practice Interview
          </Link>
        </div>
      )}
    </div>
  );
}
