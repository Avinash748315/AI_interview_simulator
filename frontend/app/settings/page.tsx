"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Settings as SettingsIcon,
  Volume2,
  Cpu,
  Clock,
  Shield,
  LogOut,
  Sparkles,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [speechConfig, setSpeechConfig] = useState<any>(null);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [defaultDuration, setDefaultDuration] = useState("5");

  useEffect(() => {
    api.speech
      .config()
      .then((cfg) => setSpeechConfig(cfg))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <SettingsIcon className="h-7 w-7 text-brand-400" />
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure interview session defaults and speech engine parameters.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-8 shadow-xl">
        {/* Audio Preferences */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
            <Volume2 className="h-4 w-4" /> Audio & Speech
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer hover:border-slate-700 transition">
              <div>
                <span className="text-xs font-semibold text-white block">Auto-play AI Voice</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Asha automatically speaks questions aloud when presented
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoPlayAudio}
                onChange={(e) => setAutoPlayAudio(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>
        </div>

        {/* AI & Infrastructure Engine Diagnostics */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
            <Cpu className="h-4 w-4" /> AI Engine Configuration
          </h3>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">AI Reasoning Provider:</span>
              <span className="font-semibold text-brand-300 uppercase">
                {speechConfig?.ai_provider || "Local Adaptive Engine"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Speech-to-Text Engine:</span>
              <span className="font-semibold text-emerald-400 capitalize">
                {speechConfig?.stt_provider || "Web Speech API (Browser)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Text-to-Speech Voice:</span>
              <span className="font-semibold text-indigo-400 capitalize">
                {speechConfig?.tts_provider || "SpeechSynthesis (Asha Voice)"}
              </span>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Account Session
          </h3>

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950">
            <div>
              <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Signed in on this device</p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
