"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Sparkles,
  ArrowRight,
  Mic,
  FileText,
  Award,
  Zap,
  CheckCircle2,
  Brain,
  ShieldCheck,
  TrendingUp,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-brand-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-300 mb-8 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          <span>Next-Gen AI Interview Simulator · Voice & Text Modes</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Ace Your Next Interview With{" "}
          <span className="gradient-text">Adaptive AI Coaching</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Simulate realistic technical and behavioral interviews customized to your target role, company style, and resume. Get instant 7-dimension rubric feedback and personalized improvement plans.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={user ? "/interview/role" : "/signup"}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-600/30 hover:bg-brand-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {user ? "Start New Interview" : "Start Practicing Free"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-7 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            {user ? "View Dashboard" : "Sign In to Your Account"}
          </Link>
        </div>

        {/* Quick Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>2 Free Interview Credits Upon Registration</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Full PDF Evaluation Reports</span>
          </div>
        </div>

        {/* Live Simulator Preview Card */}
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-2xl shadow-brand-950/40 text-left">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80"></span>
              <span className="h-3 w-3 rounded-full bg-amber-500/80"></span>
              <span className="h-3 w-3 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 text-xs font-mono text-slate-400">Live Interview Room · Google Style</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Session Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Interviewer Pane */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
                  A
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Asha (AI Interviewer)</h4>
                  <p className="text-xs text-brand-400 font-medium">Question 2 of 5 · Technical Round</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-900/90 p-3 text-sm text-slate-200 border border-slate-800">
                &ldquo;You mentioned building a distributed rate limiter in your projects. How would you design a sliding window rate limiter that handles high concurrency across multiple server instances?&rdquo;
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1 text-brand-300">
                  <Mic className="h-3.5 w-3.5" /> Asha is listening...
                </span>
                <span className="font-mono text-slate-400">04:12 remaining</span>
              </div>
            </div>

            {/* Candidate Real-Time Feedback Pane */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Candidate Transcript</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Voice Recorded</span>
                </div>
                <p className="text-xs text-slate-300 italic bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                  &ldquo;I would use Redis sorted sets where each request adds a member with a timestamp score. Using a multi/exec transaction, we remove timestamps older than the window, count the remaining cardinality, and either allow or reject the request.&rdquo;
                </p>
              </div>

              <div className="rounded-lg bg-brand-950/40 border border-brand-500/20 p-2.5">
                <div className="flex items-center justify-between text-xs font-medium text-brand-200">
                  <span>Preliminary Rubric Score:</span>
                  <span className="font-bold text-emerald-400">8.8 / 10 (Strong)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Covers Redis sorted sets, transactions, and timestamp eviction cleanly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-2">Comprehensive System</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Engineered For Authentic Interview Practice
          </p>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Everything you need to transform interview anxiety into confidence, built on rigorous evaluation principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400 mb-5 border border-brand-500/30">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Resume-Personalized Questions</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload your PDF or DOCX resume. Clarivo extracts your actual skills, projects, tools, and coursework to ask targeted questions about your genuine experience.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 mb-5 border border-indigo-500/30">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Adaptive Follow-Up AI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unlike static mock interviews, our engine analyzes your response in real time. It challenges strong answers with architectural trade-offs and clarifies missing concepts.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 mb-5 border border-emerald-500/30">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Voice & Speech Recognition</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Speak naturally through your microphone with real-time speech-to-text and AI voice responses. Switch to text typing anytime if you are in a quiet room.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400 mb-5 border border-amber-500/30">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">7-Dimension Rubric Scoring</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Each answer is scored on technical correctness, relevance, conceptual understanding, completeness, clarity, communication, and problem solving.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 mb-5 border border-cyan-500/30">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Company Interview Styles</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Choose interview styles modeled after Google (complexity & algorithms), Amazon (leadership & deep dives), Razorpay (reliability & precision), Flipkart, and more.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 mb-5 border border-purple-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Downloadable PDF Reports</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every completed interview produces an official PDF report and an interactive study guide with model answers, mistakes flagged, and actionable improvement steps.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-950/80 via-slate-900 to-slate-950 p-8 sm:p-14 text-center shadow-2xl shadow-brand-900/30 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Practice Your Next Interview?
            </h2>
            <p className="mt-4 text-base text-slate-300">
              Create your account in 30 seconds. Choose your job role, upload your resume, and start your first simulated interview with Asha today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={user ? "/interview/role" : "/signup"}
                className="w-full sm:w-auto rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-600/40 hover:bg-brand-500 transition"
              >
                {user ? "Go to Interview Setup" : "Get Started Now (Free)"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
