"use client";

import React from "react";

interface WaveformProps {
  active: boolean;
  color?: "brand" | "emerald" | "amber";
  barCount?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  active,
  color = "brand",
  barCount = 12,
}) => {
  const colorMap = {
    brand: "bg-brand-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  const selectedColor = colorMap[color];

  // Heights for natural varying waves
  const heights = [35, 60, 90, 45, 80, 100, 75, 95, 40, 70, 85, 50];

  return (
    <div className="flex items-center justify-center gap-1.5 h-12">
      {Array.from({ length: barCount }).map((_, i) => {
        const heightPercent = heights[i % heights.length];
        const animationDelay = `${(i * 0.1).toFixed(1)}s`;

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${selectedColor} ${
              active ? "animate-pulse" : "opacity-30"
            }`}
            style={{
              height: active ? `${heightPercent}%` : "15%",
              animationDelay: active ? animationDelay : "0s",
            }}
          />
        );
      })}
    </div>
  );
};
