"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Sparkles,
  Check,
  CreditCard,
  Zap,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Award,
} from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.payments
      .plans()
      .then((data) => setPlans(data))
      .catch((err) => setError(err.message || "Failed to load pricing plans."))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (plan: any) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setProcessingPlan(plan.id);

    try {
      // 1. Create order
      const order = await api.payments.createOrder(plan.id);

      // In test mode: simulate immediate successful payment
      if (order.test_mode) {
        const sim = await api.payments.simulate(order.order_id);
        if (sim.ok) {
          await refreshUser();
          setSuccessMessage(
            `Payment successful! Added ${plan.credits} interview credits to your account. You now have ${sim.credits} credits.`
          );
        }
      } else {
        alert("Live Razorpay checkout initialized.");
      }
    } catch (err: any) {
      setError(err.message || "Payment could not be processed.");
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-300 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          <span>Flexible Interview Packs</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Invest in Your Next Career Move
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base">
          Every interview includes full speech-to-text, adaptive questioning, 7-dimension evaluation, and PDF reports.
        </p>

        {user && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-200">
            <span className="text-slate-400">Your Current Balance:</span>
            <span className="text-amber-400 font-bold">{user.credits} Credits</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 flex items-center gap-2.5">
          <Check className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isProcessing = processingPlan === p.id;

            return (
              <div
                key={p.id}
                className={`relative rounded-3xl border flex flex-col justify-between p-6 sm:p-7 transition-all ${
                  p.popular
                    ? "border-brand-500 bg-gradient-to-b from-brand-950/60 to-slate-900 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500"
                    : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      ₹{p.price_inr}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ pack</span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-brand-400">
                    {p.credits} Interview {p.credits === 1 ? "Credit" : "Credits"}
                  </p>

                  <ul className="mt-6 space-y-3 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{p.credits} full mock interview sessions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Voice and text interaction modes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Custom resume question generator</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Downloadable PDF performance reports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Interactive study guide flashcards</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handlePurchase(p)}
                  disabled={isProcessing}
                  className={`mt-8 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition shadow-lg ${
                    p.popular
                      ? "bg-brand-600 text-white hover:bg-brand-500 shadow-brand-600/30"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  } disabled:opacity-50`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding Credits...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      Top Up {p.name}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Assurance banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-white">College Demonstration & Test Mode Enabled</h4>
            <p className="mt-0.5 text-slate-400">
              Payments run in simulation mode with instant credit delivery. Credits never expire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
