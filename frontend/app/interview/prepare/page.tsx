"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { voice } from "@/lib/voice";
import {
  Mic,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Volume2,
  FileText,
  Loader2,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

export default function PrepareInterviewPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Config State
  const [role, setRole] = useState("Full Stack Developer");
  const [level, setLevel] = useState("fresher");
  const [company, setCompany] = useState("Google");
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(5);
  const [mode, setMode] = useState<"voice" | "text">("voice");

  // Mic test state
  const [micStatus, setMicStatus] = useState<"untested" | "checking" | "allowed" | "denied">("untested");
  const [ttsTested, setTtsTested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read selections from session storage
    const savedRole = sessionStorage.getItem("interview_role") || "Full Stack Developer";
    const savedLevel = sessionStorage.getItem("interview_level") || "fresher";
    const savedCompany = sessionStorage.getItem("interview_company") || "Google";
    const savedResume = sessionStorage.getItem("interview_resume_id");

    setRole(savedRole);
    setLevel(savedLevel);
    setCompany(savedCompany);
    if (savedResume) {
      setResumeId(parseInt(savedResume, 10));
    }
  }, []);

  const handleTestMic = async () => {
    setMicStatus("checking");
    const allowed = await voice.requestMicrophonePermission();
    if (allowed) {
      setMicStatus("allowed");
    } else {
      setMicStatus("denied");
      setMode("text"); // auto fallback to text if mic denied
    }
  };

  const handleTestSpeaker = () => {
    setTtsTested(true);
    voice.speak("Hello! I am Asha, your AI interviewer. Your audio output is working properly.");
  };

  const handleStartInterview = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Create interview session
      const session = await api.interviews.create({
        role,
        level,
        company,
        duration_minutes: duration as any,
        resume_id: resumeId,
      });

      // Save mode preference
      sessionStorage.setItem("interview_mode", mode);

      // Refresh credits state
      await refreshUser();

      // Redirect to live interview
      router.push(`/interview/live?session_id=${session.session_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start interview. Check available credits.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Step Header */}
      <div className="mb-8 text-center">
        <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
          Step 5 of 5 · Final Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          Prepare Your Interview Session
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          Confirm your interview duration, input mode, and test your audio before entering the live room with Asha.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Interview Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800/80">
            <span className="text-slate-400 block mb-0.5">Role</span>
            <span className="font-semibold text-white truncate block">{role}</span>
          </div>
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800/80">
            <span className="text-slate-400 block mb-0.5">Level</span>
            <span className="font-semibold text-white capitalize block">{level}</span>
          </div>
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800/80">
            <span className="text-slate-400 block mb-0.5">Company</span>
            <span className="font-semibold text-white block">{company} Style</span>
          </div>
          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800/80">
            <span className="text-slate-400 block mb-0.5">Resume</span>
            <span className="font-semibold text-brand-300 block">
              {resumeId ? "Attached" : "General"}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="space-y-6">
        {/* Duration Selection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-400" />
            Interview Duration & Question Count
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Select how much time you want to practice. Shorter rounds are ideal for quick drills.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { min: 5, q: 3, label: "5 Min (3 Qs)" },
              { min: 10, q: 5, label: "10 Min (5 Qs)" },
              { min: 15, q: 7, label: "15 Min (7 Qs)" },
              { min: 20, q: 10, label: "20 Min (10 Qs)" },
            ].map((d) => (
              <button
                key={d.min}
                type="button"
                onClick={() => setDuration(d.min)}
                className={`p-3.5 rounded-xl border text-center transition ${
                  duration === d.min
                    ? "border-brand-500 bg-brand-950/40 text-white font-bold ring-1 ring-brand-500"
                    : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="text-sm font-semibold">{d.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{d.q} interview questions</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Mic className="h-4 w-4 text-emerald-400" />
            Interview Interaction Mode
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Choose whether to speak your answers with your microphone or type them manually.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode("voice")}
              className={`p-4 rounded-xl border text-left transition ${
                mode === "voice"
                  ? "border-brand-500 bg-brand-950/40 ring-1 ring-brand-500"
                  : "border-slate-800 bg-slate-950 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Mic className="h-4 w-4 text-brand-400" /> Voice Mode (Recommended)
                </span>
                {mode === "voice" && <CheckCircle2 className="h-4 w-4 text-brand-400" />}
              </div>
              <p className="text-xs text-slate-400">
                Asha speaks questions aloud. You answer out loud with live speech-to-text transcription.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("text")}
              className={`p-4 rounded-xl border text-left transition ${
                mode === "text"
                  ? "border-brand-500 bg-brand-950/40 ring-1 ring-brand-500"
                  : "border-slate-800 bg-slate-950 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-400" /> Text Mode
                </span>
                {mode === "text" && <CheckCircle2 className="h-4 w-4 text-brand-400" />}
              </div>
              <p className="text-xs text-slate-400">
                Read questions on screen and type answers using your keyboard. Best for noisy or quiet areas.
              </p>
            </button>
          </div>
        </div>

        {/* Audio Equipment Test */}
        {mode === "voice" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-amber-400" />
              Microphone & Speaker Diagnostics
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Test your microphone permissions and audio output before the live room begins.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestMic}
                disabled={micStatus === "checking"}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition ${
                  micStatus === "allowed"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : micStatus === "denied"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                <Mic className="h-4 w-4" />
                {micStatus === "allowed"
                  ? "Microphone Allowed ✓"
                  : micStatus === "denied"
                  ? "Microphone Denied (Using Text)"
                  : "Test Microphone Permission"}
              </button>

              <button
                type="button"
                onClick={handleTestSpeaker}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                <Volume2 className="h-4 w-4 text-brand-400" />
                {ttsTested ? "Test Voice Again" : "Test AI Audio Output"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={() => router.push("/interview/company")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Company
        </button>

        <button
          type="button"
          onClick={handleStartInterview}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 hover:bg-brand-500 transition disabled:opacity-50 hover:scale-[1.02]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Initializing Live Room...
            </>
          ) : (
            <>
              Enter Live Interview Room
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
