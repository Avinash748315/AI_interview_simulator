"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ScoreRing } from "@/components/ScoreRing";
import {
  Download,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Share2,
} from "lucide-react";

export default function PerformanceReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id ? parseInt(params.id as string, 10) : null;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  useEffect(() => {
    if (!reportId) {
      router.push("/dashboard");
      return;
    }

    api.reports
      .get(reportId)
      .then((data) => {
        setReport(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load interview report.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [reportId, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm text-slate-400">Loading comprehensive performance report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-400 mb-4">{error || "Report not found."}</p>
        <Link
          href="/dashboard"
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const categories = report.categories || {};
  const recommendations = report.recommendations || {};
  const questions = report.questions || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to History
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Interview Performance Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {report.role} · {report.level} · {report.company} Style · {report.duration_minutes} min ·{" "}
            {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={api.reports.downloadPdfUrl(report.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition shadow-sm"
          >
            <Download className="h-4 w-4 text-brand-400" />
            Download PDF
          </a>

          <Link
            href={`/reports/${report.id}/study`}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-500 transition shadow-md shadow-brand-600/30"
          >
            <BookOpen className="h-4 w-4" />
            Interactive Study Guide
          </Link>
        </div>
      </div>

      {/* Overview Cards (Score & Quick Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Gauge */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <ScoreRing score={report.overall_score} size={140} strokeWidth={12} label="Overall Rubric Score" />
          <span className="mt-3 text-xs font-semibold text-slate-300">
            {report.overall_score >= 70
              ? "Strong Performance · Placement Ready"
              : report.overall_score >= 50
              ? "Moderate · Concept Polish Required"
              : "Needs Revision Before Real Interviews"}
          </span>
        </div>

        {/* Summary Breakdown */}
        <div className="glass-panel rounded-2xl p-6 md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Round Metrics</h3>
            <p className="text-xs text-slate-400 mb-4">
              Answers scoring 7 or higher meet standard industry placement bar.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Total Questions</span>
                <span className="text-xl font-bold text-white">{report.total_questions}</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-xs text-emerald-400 block mb-1">Strong Answers</span>
                <span className="text-xl font-bold text-emerald-400">{report.correct_count}</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-xs text-amber-400 block mb-1">Needs Improvement</span>
                <span className="text-xl font-bold text-amber-400">{report.needs_improvement}</span>
              </div>
            </div>
          </div>

          {/* Recommendations Banner */}
          {recommendations.next_difficulty && (
            <div className="mt-4 rounded-xl bg-brand-950/40 border border-brand-500/20 p-3 text-xs text-brand-200 flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 shrink-0 text-brand-400 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Next Step Recommendation: </span>
                <span>{recommendations.next_difficulty}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7-Dimension Rubric Category Scores */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-1">Rubric Dimension Breakdown</h3>
        <p className="text-xs text-slate-400 mb-6">
          Evaluated according to technical correctness, conceptual depth, relevance, communication, and problem-solving
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categories).map(([dim, val]) => {
            const num = Number(val);
            let badgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            if (num < 50) badgeBg = "bg-rose-500/10 text-rose-400 border-rose-500/20";
            else if (num < 70) badgeBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";

            return (
              <div key={dim} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 capitalize">
                    {dim.replace("_", " ")}
                  </span>
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${badgeBg}`}>
                    {num} / 100
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      num >= 70 ? "bg-emerald-500" : num >= 50 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, num))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Practice Drill Questions */}
      {recommendations.practice_questions?.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Recommended Practice Drill Questions
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Topics and questions identified from this round for your next practice interview
          </p>

          <ul className="space-y-2 text-xs text-slate-300">
            {recommendations.practice_questions.map((pq: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600/20 text-brand-400 font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{pq}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Question & Answer Evaluation Accordion */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Question-by-Question Evaluation</h3>
        <p className="text-xs text-slate-400 -mt-2">
          Click on any question to inspect your transcript, strengths, missing concepts, and ideal model answers.
        </p>

        <div className="space-y-3">
          {questions.map((q: any, index: number) => {
            const isExpanded = expandedQuestion === index;
            const score = q.score != null ? q.score : 0;

            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg transition"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/50 transition gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-brand-300 shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white leading-snug">{q.question}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">{q.topic}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                        score >= 7
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : score >= 5
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {score} / 10
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-5 space-y-4 bg-slate-950/40 text-xs">
                    {/* Candidate Answer */}
                    <div>
                      <span className="font-semibold text-slate-400 block mb-1">Your Answer:</span>
                      <p className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 italic leading-relaxed">
                        &ldquo;{q.answer}&rdquo;
                      </p>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                        </span>
                        <ul className="space-y-1 text-slate-300 list-disc list-inside">
                          {q.strengths?.length > 0 ? (
                            q.strengths.map((str: string, i: number) => <li key={i}>{str}</li>)
                          ) : (
                            <li>The response was recorded.</li>
                          )}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2">
                        <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> Weaknesses / Missing Concepts
                        </span>
                        <ul className="space-y-1 text-slate-300 list-disc list-inside">
                          {q.weaknesses?.length > 0 || q.missing_concepts?.length > 0 ? (
                            <>
                              {q.weaknesses?.map((w: string, i: number) => (
                                <li key={`w-${i}`}>{w}</li>
                              ))}
                              {q.missing_concepts?.map((m: string, i: number) => (
                                <li key={`m-${i}`}>Missing: {m}</li>
                              ))}
                            </>
                          ) : (
                            <li>No major conceptual gaps identified.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Model Ideal Answer */}
                    {q.ideal_answer && (
                      <div>
                        <span className="font-semibold text-brand-300 block mb-1">
                          Model Reference Answer (How a Senior Engineer Answers):
                        </span>
                        <p className="bg-brand-950/20 border border-brand-500/20 p-3.5 rounded-xl text-slate-200 leading-relaxed">
                          {q.ideal_answer}
                        </p>
                      </div>
                    )}

                    {/* Suggestion */}
                    {q.suggestion && (
                      <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-amber-200">
                        <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white">Actionable Tip: </span>
                          <span>{q.suggestion}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
