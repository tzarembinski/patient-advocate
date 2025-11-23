'use client';

import React, { useState } from 'react';

export default function HowToUse() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="font-semibold text-gray-900 text-lg">How to Use This App</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2">
          <div className="bg-white rounded-lg p-5 border border-blue-200">
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">Step 1:</span>
                <span>Add your patient information in "Add My Info"</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">Step 2:</span>
                <span>
                  Manually enter or upload Excel file showing treatment journey (see "Add Timeline
                  Entry" or "Upload Excel or CSV file")
                </span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">Step 3:</span>
                <span>
                  Go to "Questions for Doctor" and copy and paste the pre-made prompt into ChatGPT,
                  Claude, or another LLM
                </span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">Step 4:</span>
                <span>
                  Now you have a timeline and 5-7 questions you can ask your doctor in your next
                  visit
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
