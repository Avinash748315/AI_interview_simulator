"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Compass,
} from "lucide-react";

export default function CompanySelectionPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>("Google");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem("interview_company");
    if (saved) {
      setSelectedCompany(saved);
    }

    api.interviews
      .catalog()
      .then((data) => {
        setCatalog(data);
      })
      .catch((err) => {
        console.error("Failed to load catalog", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const companies = catalog?.companies || [];

  const handleNext = () => {
    sessionStorage.setItem("interview_company", selectedCompany);
    router.push("/interview/prepare");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm text-slate-400">Loading interview styles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
          Step 4 of 5 · Interview Culture & Style
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          Select Company Interview Style
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          Different tech giants emphasize distinct evaluation heuristics. Choose a style to tailor the questioning rubric.
        </p>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {companies.map((c: any) => {
          const isSelected = selectedCompany === c.id;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCompany(c.id)}
              className={`flex flex-col justify-between p-5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "border-brand-500 bg-brand-950/40 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-brand-400 font-bold text-base">
                    {c.name.charAt(0)}
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-brand-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white">{c.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed capitalize">
                  {c.style}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                Public interview rubric
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={() => router.push("/interview/level")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Level
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition"
        >
          Next: Pre-Interview Checks
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
