"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { voice } from "@/lib/voice";
import { Waveform } from "@/components/Waveform";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  Sparkles,
  Edit3,
  Camera,
  CameraOff,
  Loader2,
  HelpCircle,
  History,
  Send,
} from "lucide-react";

function LiveInterviewRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id");
  const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : null;

  // Session State
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [transcript, setTranscript] = useState("");
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiVoiceMuted, setAiVoiceMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsedSeconds, setTimeElapsedSeconds] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Initialize and start session
  useEffect(() => {
    if (!sessionId) {
      router.push("/dashboard");
      return;
    }

    let mounted = true;

    async function initSession() {
      try {
        const started = await api.interviews.start(sessionId!);
        if (!mounted) return;

        setSessionData(started);
        if (started.done) {
          router.push(`/interview/complete?session_id=${sessionId}`);
          return;
        }

        if (started.question) {
          setCurrentQuestion(started.question);
          // Play initial question or greeting
          const spokenText = started.greeting
            ? `${started.greeting} First question: ${started.question.text}`
            : started.question.text;

          speakQuestion(spokenText);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Failed to initialize interview session.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    return () => {
      mounted = false;
      voice.stopSpeaking();
      voice.stopListening();
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [sessionId, router]);

  // Timer loop
  useEffect(() => {
    if (loading || submitting || sessionData?.done) return;
    const interval = setInterval(() => {
      setTimeElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, submitting, sessionData]);

  // Handle Camera Toggle
  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      setCameraEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
      } catch (err) {
        console.warn("Could not access camera", err);
      }
    }
  };

  // Speak AI question
  const speakQuestion = (text: string) => {
    if (aiVoiceMuted) return;
    setIsAiSpeaking(true);
    voice.speak(
      text,
      () => setIsAiSpeaking(true),
      () => {
        setIsAiSpeaking(false);
        // Start listening automatically after AI finishes speaking
        startVoiceCapture();
      }
    );
  };

  // Voice capture
  const startVoiceCapture = () => {
    if (isAiSpeaking) return;
    setTranscript("");
    setIsListening(true);
    voice.startListening(
      (interimText) => {
        setTranscript(interimText);
      },
      () => {
        // onSpeechEnd
      }
    );
  };

  const stopVoiceCapture = () => {
    voice.stopListening();
    setIsListening(false);
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopVoiceCapture();
    } else {
      startVoiceCapture();
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!transcript.trim()) {
      setError("Please record or type an answer before submitting.");
      return;
    }

    stopVoiceCapture();
    voice.stopSpeaking();
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.interviews.answer(
        sessionId!,
        currentQuestion.id,
        transcript.trim(),
        isEditingTranscript
      );

      if (res.done) {
        if (res.closing && !aiVoiceMuted) {
          await voice.speak(res.closing);
        }
        router.push(`/interview/complete?session_id=${sessionId}`);
        return;
      }

      // Next question ready
      setSessionData((prev: any) => ({
        ...prev,
        questions_asked: res.questions_asked,
      }));
      setCurrentQuestion(res.question);
      setTranscript("");
      setIsEditingTranscript(false);

      if (res.question?.text) {
        const prompt = res.question.is_followup
          ? `Follow-up question: ${res.question.text}`
          : res.question.text;
        speakQuestion(prompt);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  // Skip Question
  const handleSkipQuestion = async () => {
    if (!confirm("Are you sure you want to skip this question?")) return;

    stopVoiceCapture();
    voice.stopSpeaking();
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.interviews.skip(sessionId!, currentQuestion.id);

      if (res.done) {
        router.push(`/interview/complete?session_id=${sessionId}`);
        return;
      }

      setSessionData((prev: any) => ({
        ...prev,
        questions_asked: res.questions_asked,
      }));
      setCurrentQuestion(res.question);
      setTranscript("");
      setIsEditingTranscript(false);

      if (res.question?.text) {
        speakQuestion(res.question.text);
      }
    } catch (err: any) {
      setError(err.message || "Failed to skip question.");
    } finally {
      setSubmitting(false);
    }
  };

  // End Interview Early
  const handleEndInterview = async () => {
    if (!confirm("Are you sure you want to end this interview now? A report will be prepared based on answers submitted so far.")) {
      return;
    }

    stopVoiceCapture();
    voice.stopSpeaking();
    setSubmitting(true);

    try {
      const res = await api.interviews.end(sessionId!);
      if (res.report_id) {
        router.push(`/reports/${res.report_id}`);
      } else {
        router.push(`/interview/complete?session_id=${sessionId}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to end interview.");
      setSubmitting(false);
    }
  };

  // Format Timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <p className="text-base font-semibold">Connecting to Asha (AI Interviewer)...</p>
        <p className="text-xs text-slate-400">Loading your customized question bank and audio stream.</p>
      </div>
    );
  }

  const questionIndex = sessionData?.questions_asked || 1;
  const questionBudget = sessionData?.question_budget || 5;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 px-4 py-3 sm:px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-sm">
            C
          </div>
          <div>
            <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-xs">
              {sessionData?.role}
            </h1>
            <p className="text-[11px] text-slate-400">
              {sessionData?.company} Style · {sessionData?.level}
            </p>
          </div>
        </div>

        {/* Center Progress & Timer */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800 text-xs">
            <span className="text-slate-400">Question</span>
            <span className="font-bold text-white">
              {questionIndex} of {questionBudget}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800 text-xs font-mono">
            <Clock className="h-3.5 w-3.5 text-brand-400" />
            <span className="font-bold text-white">{formatTime(timeElapsedSeconds)}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAiVoiceMuted(!aiVoiceMuted)}
            className={`p-2 rounded-lg border transition text-xs ${
              aiVoiceMuted
                ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
            }`}
            title={aiVoiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          >
            {aiVoiceMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className={`p-2 rounded-lg border transition text-xs ${
              cameraEnabled
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
            }`}
            title={cameraEnabled ? "Turn Off Video" : "Turn On Video"}
          >
            {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleEndInterview}
            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End Early</span>
          </button>
        </div>
      </header>

      {/* Main Room Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interviewer & Video Tiles (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* AI Interviewer Tile */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl min-h-[220px]">
            {/* Background Glow */}
            <div
              className={`absolute inset-0 bg-brand-600/10 transition-opacity duration-500 pointer-events-none ${
                isAiSpeaking ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Avatar */}
            <div
              className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-2xl shadow-xl transition-all duration-300 ${
                isAiSpeaking
                  ? "ring-4 ring-brand-400/50 scale-105 shadow-brand-500/40"
                  : "opacity-90"
              }`}
            >
              Asha
              {isAiSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-500"></span>
                </span>
              )}
            </div>

            <div className="mt-3">
              <h3 className="text-base font-bold text-white">Asha</h3>
              <p className="text-xs text-brand-300 font-medium">AI Senior Interviewer</p>
            </div>

            {/* Speaking Status Pill */}
            <div className="mt-4">
              {isAiSpeaking ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-300">
                    <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                    Asha is speaking...
                  </span>
                  <Waveform active={true} color="brand" barCount={10} />
                </div>
              ) : isListening ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <Mic className="h-3.5 w-3.5" />
                  Listening to your answer...
                </span>
              ) : (
                <span className="text-xs text-slate-400">Waiting for your answer</span>
              )}
            </div>
          </div>

          {/* Candidate Tile (Webcam or Waveform) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 relative min-h-[160px] flex flex-col justify-between overflow-hidden">
            {cameraEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-36 object-cover rounded-xl bg-slate-950"
              />
            ) : (
              <div className="h-32 rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4 border border-slate-800/80">
                <Mic className="h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs font-medium">Microphone Audio Feed</p>
                {isListening && (
                  <div className="mt-2">
                    <Waveform active={true} color="emerald" barCount={14} />
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Candidate (You)</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                  isListening
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isListening ? "Mic Active" : "Mic Idle"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Question Card & Answer Transcript (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Question Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-brand-600/20 px-2.5 py-1 text-xs font-bold text-brand-300 uppercase">
                  {currentQuestion?.topic || "Technical"}
                </span>
                <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 capitalize">
                  {currentQuestion?.difficulty || "Medium"}
                </span>
                {currentQuestion?.is_followup && (
                  <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Adaptive Follow-up
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => speakQuestion(currentQuestion?.text)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300"
                title="Replay Audio"
              >
                <Volume2 className="h-3.5 w-3.5" /> Replay Question
              </button>
            </div>

            <div className="py-2">
              <p className="text-lg sm:text-xl font-medium text-white leading-relaxed">
                {currentQuestion?.text || "Preparing next interview question..."}
              </p>
            </div>
          </div>

          {/* Transcript & Answer Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Your Answer
                </h3>
                {isListening && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-brand-300 transition"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {isEditingTranscript ? "Done Editing" : "Edit / Type"}
                </button>
                <button
                  type="button"
                  onClick={() => setTranscript("")}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Answer Display or Text Area */}
            {isEditingTranscript ? (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type or revise your answer here..."
                rows={5}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            ) : (
              <div className="min-h-[120px] rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-200">
                {transcript ? (
                  <p className="whitespace-pre-wrap">{transcript}</p>
                ) : (
                  <p className="text-slate-400 italic">
                    {isListening
                      ? "Speak now. Your transcript will appear here in real time..."
                      : "Click 'Start Recording' or 'Edit / Type' to enter your answer."}
                  </p>
                )}
              </div>
            )}

            {/* Controls Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition ${
                    isListening
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/10"
                      : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {isListening ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause Mic
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Start Mic
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  disabled={submitting}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submitting || !transcript.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating Answer...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Answer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LiveInterviewRoom() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
          <p className="text-sm text-slate-400">Loading interview room...</p>
        </div>
      }
    >
      <LiveInterviewRoomContent />
    </React.Suspense>
  );
}
