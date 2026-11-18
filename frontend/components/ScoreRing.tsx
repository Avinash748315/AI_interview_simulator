"use client";

import React from "react";

interface ScoreRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  label?: string;
  maxScore?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  label = "Score",
  maxScore = 100,
}) => {
  const displayScore = score != null ? Math.round(score) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (displayScore / maxScore) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let colorClass = "text-emerald-500";
  let bgGlow = "shadow-emerald-500/20";
  if (percentage < 50) {
    colorClass = "text-rose-500";
    bgGlow = "shadow-rose-500/20";
  } else if (percentage < 70) {
    colorClass = "text-amber-500";
    bgGlow = "shadow-amber-500/20";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative flex items-center justify-center rounded-full ${bgGlow} shadow-lg`} style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 transform">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-800"
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
            fill="transparent"
            stroke="currentColor"
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-white">
            {score != null ? displayScore : "N/A"}
          </span>
          {score != null && (
            <span className="text-[10px] font-medium text-slate-400 -mt-0.5">
              / {maxScore}
            </span>
          )}
        </div>
      </div>
      {label && <span className="mt-2 text-xs font-medium text-slate-300">{label}</span>}
    </div>
  );
};
