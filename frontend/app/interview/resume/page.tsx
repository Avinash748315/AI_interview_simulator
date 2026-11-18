"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Trash2,
  Sparkles,
} from "lucide-react";

export default function ResumePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [existingResume, setExistingResume] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.resumes
      .latest()
      .then((res) => {
        setExistingResume(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const result = await api.resumes.upload(file);
      setExistingResume(result);
    } catch (err: any) {
      setError(err.message || "Failed to upload and parse resume.");
    } finally {
      setUploading(false);
    }
  };

  const handleContinueWithResume = () => {
    if (existingResume?.id) {
      sessionStorage.setItem("interview_resume_id", String(existingResume.id));
    }
    router.push("/interview/role");
  };

  const handleContinueWithoutResume = () => {
    sessionStorage.removeItem("interview_resume_id");
    router.push("/interview/role");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Progress Steps Header */}
      <div className="mb-8 text-center">
        <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
          Step 1 of 5 · Resume Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          Upload Your Resume
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          Clarivo extracts your actual projects, coursework, and skills to ask personalized interview questions just like real tech interviewers.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/60 p-8 text-center hover:border-brand-500/50 transition">
        <input
          type="file"
          id="resumeInput"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="resumeInput"
          className="cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-400 border border-brand-500/25">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-brand-400" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {uploading ? "Analyzing resume contents with AI..." : "Click to upload your resume (PDF or DOCX)"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Maximum file size: 5MB</p>
          </div>
        </label>
      </div>

      {/* Active Parsed Resume Card */}
      {existingResume && (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {existingResume.filename}
                  <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {(existingResume.size_bytes / 1024).toFixed(1)} KB · Uploaded {new Date(existingResume.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          {existingResume.analysis && (
            <div className="space-y-4">
              {existingResume.analysis.summary && (
                <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <span className="font-semibold text-brand-300">Summary: </span>
                  {existingResume.analysis.summary}
                </p>
              )}

              {/* Skills */}
              {existingResume.analysis.skills?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Detected Skills ({existingResume.analysis.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {existingResume.analysis.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {existingResume.analysis.projects?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Detected Projects ({existingResume.analysis.projects.length})
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {existingResume.analysis.projects.map((proj: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400"></span>
                        <span className="font-medium">{typeof proj === "string" ? proj : proj.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleContinueWithoutResume}
          className="text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          Skip resume & continue with general role questions &rarr;
        </button>

        <button
          type="button"
          onClick={handleContinueWithResume}
          disabled={!existingResume}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition disabled:opacity-40"
        >
          Continue with this Resume
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
