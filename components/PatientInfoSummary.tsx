'use client';

import React from 'react';
import { PatientContext } from './PatientContextForm';

interface PatientInfoSummaryProps {
  patientContext: PatientContext;
  onEdit: () => void;
}

export default function PatientInfoSummary({ patientContext, onEdit }: PatientInfoSummaryProps) {
  // Calculate days since last update
  const getDaysSinceUpdate = (): number | null => {
    if (!patientContext.lastUpdated) return null;

    const lastUpdate = new Date(patientContext.lastUpdated);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceUpdate = getDaysSinceUpdate();
  const isOld = daysSinceUpdate !== null && daysSinceUpdate > 30;

  return (
    <div className={`rounded-lg p-4 mb-6 ${isOld ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-blue-50 border border-blue-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Your Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
            <div>
              <span className="font-medium">Condition:</span> {patientContext.condition}
            </div>
            <div>
              <span className="font-medium">Specialty:</span> {patientContext.specialty}
            </div>
            {patientContext.stageStatus && (
              <div>
                <span className="font-medium">Status:</span> {patientContext.stageStatus}
              </div>
            )}
            {patientContext.treatmentResult && (
              <div>
                <span className="font-medium">Response:</span> {patientContext.treatmentResult}
              </div>
            )}
          </div>

          {/* Last updated info */}
          {daysSinceUpdate !== null && (
            <div className={`mt-3 text-xs ${isOld ? 'text-yellow-800' : 'text-gray-600'}`}>
              {isOld ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    Last updated {daysSinceUpdate} days ago - Consider updating your treatment status
                  </span>
                </div>
              ) : (
                <span>Last updated {daysSinceUpdate === 0 ? 'today' : `${daysSinceUpdate} ${daysSinceUpdate === 1 ? 'day' : 'days'} ago`}</span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className={`ml-4 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
            isOld
              ? 'bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700'
              : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
          }`}
        >
          {isOld ? 'Update Now' : 'Edit'}
        </button>
      </div>
    </div>
  );
}
