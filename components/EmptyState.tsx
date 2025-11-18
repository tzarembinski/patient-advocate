"use client";

interface EmptyStateProps {
  onAddManualEntry: () => void;
  onLoadSampleData: () => void;
  onUploadFile: () => void;
}

export default function EmptyState({ onAddManualEntry, onLoadSampleData, onUploadFile }: EmptyStateProps) {
  return (
    <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-12 text-center shadow-sm">
      <div className="max-w-2xl mx-auto">
        {/* Icon */}
        <div className="mb-6">
          <svg
            className="w-20 h-20 mx-auto text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>

        {/* Headline */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Your Medical Timeline
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Track your treatment journey with a visual timeline. Get started by uploading your schedule or adding entries manually.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={onAddManualEntry}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-3 text-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add First Entry Manually
          </button>

          <span className="text-gray-400 font-semibold">OR</span>

          <button
            onClick={onUploadFile}
            className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md flex items-center gap-3 text-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload Excel File
          </button>
        </div>

        {/* Sample Data Link */}
        <div className="pt-6 border-t border-blue-200">
          <button
            onClick={onLoadSampleData}
            className="text-blue-600 hover:text-blue-800 font-medium underline decoration-2 underline-offset-4 transition-colors"
          >
            Load Sample Timeline
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Not sure where to start? Load example data to see how it works.
          </p>
        </div>

        {/* Preview Info */}
        <div className="mt-8 p-6 bg-white rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3">What you'll get:</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Visual swimlane timeline</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Easy editing & deletion</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Auto-saved in browser</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
