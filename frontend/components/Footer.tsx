"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Shield, Cpu, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white">
                Clarivo<span className="text-brand-400">.ai</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              AI-powered mock interview simulator for university graduates, freshers, and professionals.
              Adaptive follow-up questions, speech recognition, and instant rubric-based evaluation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/interview/role" className="hover:text-white transition">
                  Practice Interview
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Candidate Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Credit Packs & Pricing
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-white transition">
                  Interview History
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Project Info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Architecture</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1.5 text-xs text-slate-400">
                <Cpu className="h-3.5 w-3.5 text-brand-400" />
                Adaptive AI Engine (Local + Cloud)
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                7-Dimension Rubric Scoring
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition text-xs">
                  Privacy Policy & Audio Storage
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Clarivo AI Interview Simulator. Designed for engineering project demonstration.</p>
          <div className="flex items-center gap-1">
            Built with Next.js, FastAPI & SQLite
          </div>
        </div>
      </div>
    </footer>
  );
};
