'use client';

import React, { useState } from 'react';

interface PromptModalProps {
  prompt: string;
  onClose: () => void;
}

export default function PromptModal({ prompt, onClose }: PromptModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] sm:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Questions for Your Doctor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Copy this prompt and paste it into ChatGPT, Claude, or your preferred AI assistant
            to generate personalized questions for your doctor.
          </p>

          {/* Privacy & Security Note */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4 flex items-start gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-xs sm:text-sm text-green-800">
              <strong>Privacy & Security:</strong> This prompt is generated locally in your browser. Your medical information is not sent anywhere until you choose to paste it into an AI assistant.
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-800 font-mono break-words">
              {prompt}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
          {copied && (
            <span className="text-green-600 text-sm font-medium text-center sm:text-left">
              Copied to clipboard!
            </span>
          )}
          <button
            onClick={handleCopy}
            className="px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy to Clipboard</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
