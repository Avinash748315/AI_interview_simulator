"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Briefcase,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Code,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("Full Stack Developer");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore saved choice if any
    const saved = sessionStorage.getItem("interview_role");
    if (saved) {
      setSelectedRole(saved);
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

  const roles: string[] = catalog?.roles || [];
  const techRoles: string[] = catalog?.technical_roles || [];

  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter === "tech") {
      return techRoles.includes(role);
    }
    if (categoryFilter === "non-tech") {
      return !techRoles.includes(role);
    }
    return true;
  });

  const handleNext = () => {
    if (!selectedRole) return;
    sessionStorage.setItem("interview_role", selectedRole);
    router.push("/interview/level");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm text-slate-400">Loading role catalog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Progress Header */}
      <div className="mb-8 text-center">
        <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
          Step 2 of 5 · Role Selection
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          Select Your Target Job Role
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          Choose from over 37 technical and business roles to customize the question bank and rubric criteria.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles (e.g. React, DevOps, AI)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              categoryFilter === "all" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All Roles ({roles.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("tech")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              categoryFilter === "tech" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Engineering & Tech
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("non-tech")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              categoryFilter === "non-tech" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Product & Business
          </button>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
        {filteredRoles.map((role) => {
          const isSelected = selectedRole === role;
          const isTech = techRoles.includes(role);

          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`flex items-start justify-between p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-brand-500 bg-brand-950/40 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isTech ? (
                    <Code className="h-4 w-4 text-brand-400 shrink-0" />
                  ) : (
                    <Briefcase className="h-4 w-4 text-amber-400 shrink-0" />
                  )}
                  <h3 className="text-sm font-semibold text-white">{role}</h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {isTech ? "Technical Architecture & Coding" : "Core Competency & Judgment"}
                </span>
              </div>

              {isSelected && (
                <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={() => router.push("/interview/resume")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Resume
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedRole}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition disabled:opacity-40"
        >
          Next: Choose Level
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
