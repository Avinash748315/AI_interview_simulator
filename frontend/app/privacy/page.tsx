"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, FileText, Mic, Database } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-3 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
          Privacy & Data Security Policy
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Last updated: November 2026 · Clarivo AI Interview Simulator
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed shadow-xl">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Mic className="h-4 w-4 text-brand-400" /> 1. Audio and Voice Recording
          </h2>
          <p className="text-xs text-slate-400">
            During live mock interview rounds, voice recording is processed directly on your device using the browser Web Speech API or secure backend transcription endpoints. Voice audio is used exclusively to generate candidate transcripts for question evaluation and is never sold or used for public training.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-400" /> 2. Resume Data Extraction
          </h2>
          <p className="text-xs text-slate-400">
            When you upload a PDF or DOCX resume, our parser extracts factual information including technical skills, projects, and education. This data is linked solely to your authenticated candidate profile to generate tailored interview questions. You may delete your uploaded resumes at any time from the resume management panel.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-400" /> 3. Persistent Evaluation & Reports
          </h2>
          <p className="text-xs text-slate-400">
            Interview sessions, rubric scores, question transcripts, and generated study guides are stored persistently in your local SQLite database with relational integrity and cascade constraints.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-brand-400" /> 4. Authentication & Security
          </h2>
          <p className="text-xs text-slate-400">
            Passwords are salted and hashed using bcrypt before database storage. User sessions are secured with HS256 signed JSON Web Tokens (JWT) containing token versioning for instant logout revocation.
          </p>
        </section>
      </div>
    </div>
  );
}
