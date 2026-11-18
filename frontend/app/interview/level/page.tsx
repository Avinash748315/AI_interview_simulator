"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function LevelSelectionPage() {
  const router = useRouter();
  const [level, setLevel] = useState<string>("fresher");

  useEffect(() => {
    const saved = sessionStorage.getItem("interview_level");
    if (saved) {
      setLevel(saved);
    }
  }, []);

  const handleNext = () => {
    sessionStorage.setItem("interview_level", level);
    router.push("/interview/company");
  };

  const levels = [
    {
      id: "internship",
      title: "Internship",
      subtitle: "College Students & Entry-Level Trainees",
      description:
        "Focuses on core CS coursework, OOP fundamentals, basic project structure, and willingness to learn.",
      icon: GraduationCap,
      color: "brand",
    },
    {
      id: "fresher",
      title: "Fresher",
      subtitle: "0 - 1 Years Experience (Campus Placements)",
      description:
        "Focuses on algorithmic reasoning, standard frameworks, API protocols, debugging, and clear conceptual explanations.",
      icon: Sparkles,
      color: "indigo",
    },
    {
      id: "experienced",
      title: "Experienced",
      subtitle: "2+ Years (Lateral / Mid-Senior)",
      description:
        "Deep dives into distributed architecture, edge cases, production scalability, performance trade-offs, and design patterns.",
      icon: Briefcase,
      color: "emerald",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Step Header */}
      <div className="mb-8 text-center">
        <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
          Step 3 of 5 · Difficulty Calibration
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          Choose Interview Level
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          The AI interviewer calibrates depth, rubric expectations, and follow-up strictness according to your selected tier.
        </p>
      </div>

      {/* Levels Cards */}
      <div className="space-y-4">
        {levels.map((lvl) => {
          const isSelected = level === lvl.id;
          const Icon = lvl.icon;

          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setLevel(lvl.id)}
              className={`w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "border-brand-500 bg-brand-950/40 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400 shrink-0 mt-0.5">
                <Icon className="h-6 w-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{lvl.title}</h3>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-brand-400">
                      <CheckCircle2 className="h-4 w-4" /> Selected
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-brand-300 mt-0.5">{lvl.subtitle}</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{lvl.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={() => router.push("/interview/role")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Role
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition"
        >
          Next: Choose Company Style
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
