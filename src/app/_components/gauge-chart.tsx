import React from "react";

interface GaugeChartProps {
  percentage: number;
}

export function GaugeChart({ percentage }: GaugeChartProps) {
  const radius = 40;
  const strokeWidth = 12;
  const circumference = radius * Math.PI;

  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const strokeDashoffset =
    circumference - (clampedPercentage / 100) * circumference;

  let colorClass = "text-green-500";
  if (clampedPercentage >= 75) {
    colorClass = "text-red-500";
  } else if (clampedPercentage >= 50) {
    colorClass = "text-yellow-500";
  }

  return (
    <div className="relative flex h-[60px] w-[120px] flex-col items-center justify-center">
      <svg
        width="120"
        height="60"
        viewBox="0 0 100 50"
        className="overflow-visible"
      >
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-gray-800"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute right-0 bottom-0 left-0 flex items-end justify-center pb-1">
        <span className="text-xl leading-none font-bold text-white">
          {Math.round(clampedPercentage)}%
        </span>
      </div>
    </div>
  );
}
