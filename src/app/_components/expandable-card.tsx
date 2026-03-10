"use client";

import { useState, type ReactNode } from "react";

interface ExpandableCardProps {
  children: ReactNode;
  detailContent: ReactNode;
  className?: string;
  hasData?: boolean;
}

export function ExpandableCard({
  children,
  detailContent,
  className = "",
  hasData = true,
}: ExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border border-gray-800 bg-gray-900 transition hover:border-gray-700 ${className}`}
    >
      <button
        type="button"
        onClick={() => hasData && setIsOpen(!isOpen)}
        className={`flex w-full flex-col p-4 text-left sm:p-5 ${hasData ? "cursor-pointer" : "cursor-default"}`}
        aria-expanded={isOpen}
      >
        {children}
        {hasData && (
          <span
            className={`mt-2 self-center text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        )}
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-800 p-4 sm:p-5">
            {detailContent}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetailTableProps {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
}

export function DetailTable({
  headers,
  rows,
  emptyMessage = "Sin datos",
}: DetailTableProps) {
  if (rows.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase">
            {headers.map((header, i) => (
              <th key={i} className="pr-4 pb-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {rows.map((row, i) => (
            <tr key={i} className="text-gray-300">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
