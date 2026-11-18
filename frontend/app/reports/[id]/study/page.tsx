"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Award,
  Loader2,
} from "lucide-react";

export default function StudyGuidePage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id ? parseInt(params.id as string, 10) : null;

  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      router.push("/dashboard");
      return;
    }

    api.reports
      .studyGuide(reportId)
      .then((data) => {
        setGuide(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load study guide.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [reportId, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm text-slate-400">Loading interactive study guide...</p>
      </div>
    );
  }

  const items = guide?.items || [];
  const currentItem = items[currentIndex];

  if (!currentItem || items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 mb-4">No study flashcards available for this report.</p>
        <Link
          href={`/reports/${reportId}`}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Back to Report
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <Link
            href={`/reports/${reportId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Full Report
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-400" />
            Interview Study Guide & Flashcards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare your live interview answers against model senior engineering answers.
          </p>
        </div>

        {/* Counter */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-white">
          Card {currentIndex + 1} of {items.length}
        </div>
      </div>

      {/* Main Study Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Question Banner */}
        <div className="rounded-2xl border border-brand-500/30 bg-brand-950/30 p-5">
          <span className="text-[11px] font-bold text-brand-300 uppercase tracking-wider block mb-1">
            Interview Question
          </span>
          <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
            {currentItem.question}
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Candidate's Answer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Your Answer
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                    currentItem.score >= 7
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  Score: {currentItem.score} / 10
                </span>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed whitespace-pre-wrap">
                &ldquo;{currentItem.candidate_answer}&rdquo;
              </p>
            </div>
          </div>

          {/* Model Answer */}
          <div className="rounded-2xl border border-brand-500/30 bg-slate-950 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                  Model Reference Answer
                </span>
                <span className="rounded bg-brand-500/20 text-brand-300 px-2 py-0.5 text-[10px] font-semibold">
                  Gold Standard
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentItem.model_answer}
              </p>
            </div>
          </div>
        </div>

        {/* Tips Box */}
        {currentItem.tips && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-200">
            <Lightbulb className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold text-white">How to Ace this Topic: </span>
              <span>{currentItem.tips}</span>
            </div>
          </div>
        )}

        {/* Carousel Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Card
          </button>

          <div className="flex items-center gap-1">
            {items.map((_: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx ? "w-6 bg-brand-500" : "w-2 bg-slate-800 hover:bg-slate-700"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
            disabled={currentIndex === items.length - 1}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition"
          >
            Next Card <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
