'use client';

import React, { useState, useEffect } from 'react';

export interface PatientContext {
  condition: string;
  specialty: string;
  stageStatus: string;
  keyBiomarkers: string;
  currentTreatment: string;
  treatmentResult: string;
  additionalInfo: string;
  lastUpdated?: string; // ISO date string
}

interface PatientContextFormProps {
  onSave: (context: PatientContext) => void;
  onCancel: () => void;
  initialData?: PatientContext;
}

const SPECIALTIES = [
  'Oncology',
  'Cardiology',
  'Neurology',
  'Endocrinology',
  'Rheumatology',
  'Gastroenterology',
  'Pulmonology',
  'Nephrology',
  'Hematology',
  'Immunology',
  'Other'
];

const TREATMENT_RESPONSES = [
  'Complete response',
  'Partial response',
  'Stable disease',
  'Progressive disease',
  'No change',
  'Side effects/intolerant',
  'Custom (type below)',
];

export default function PatientContextForm({ onSave, onCancel, initialData }: PatientContextFormProps) {
  const [formData, setFormData] = useState<PatientContext>({
    condition: '',
    specialty: '',
    stageStatus: '',
    keyBiomarkers: '',
    currentTreatment: '',
    treatmentResult: '',
    additionalInfo: '',
    ...initialData
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [customResponse, setCustomResponse] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle treatment response dropdown
    if (name === 'treatmentResult') {
      if (value === 'Custom (type below)') {
        setCustomResponse(true);
        setFormData(prev => ({ ...prev, [name]: '' }));
      } else {
        setCustomResponse(false);
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.condition.trim()) {
      newErrors.condition = 'Condition is required';
    }
    if (!formData.specialty) {
      newErrors.specialty = 'Specialty is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Add lastUpdated timestamp
      const updatedData = {
        ...formData,
        lastUpdated: new Date().toISOString(),
      };
      onSave(updatedData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Information</h2>
      <p className="text-sm text-gray-600 mb-6">
        Enter your medical information to generate personalized questions for your doctor.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Condition */}
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
            Condition <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            placeholder="e.g., Type 2 Diabetes, Breast Cancer, Heart Failure"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.condition ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.condition && (
            <p className="text-red-500 text-sm mt-1">{errors.condition}</p>
          )}
        </div>

        {/* Specialty */}
        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
            Specialty <span className="text-red-500">*</span>
          </label>
          <select
            id="specialty"
            name="specialty"
            value={formData.specialty}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.specialty ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a specialty...</option>
            {SPECIALTIES.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
          {errors.specialty && (
            <p className="text-red-500 text-sm mt-1">{errors.specialty}</p>
          )}
        </div>

        {/* Stage/Status */}
        <div>
          <label htmlFor="stageStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Stage/Status
          </label>
          <input
            type="text"
            id="stageStatus"
            name="stageStatus"
            value={formData.stageStatus}
            onChange={handleChange}
            placeholder="e.g., Stage III, Controlled, Stable"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Key Biomarkers */}
        <div>
          <label htmlFor="keyBiomarkers" className="block text-sm font-medium text-gray-700 mb-1">
            Key Biomarker(s)
          </label>
          <input
            type="text"
            id="keyBiomarkers"
            name="keyBiomarkers"
            value={formData.keyBiomarkers}
            onChange={handleChange}
            placeholder="e.g., HbA1c 7.2%, PSA 4.5 ng/mL, Creatinine 1.8 mg/dL"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Current Treatment */}
        <div>
          <label htmlFor="currentTreatment" className="block text-sm font-medium text-gray-700 mb-1">
            Current Treatment
          </label>
          <input
            type="text"
            id="currentTreatment"
            name="currentTreatment"
            value={formData.currentTreatment}
            onChange={handleChange}
            placeholder="e.g., Metformin 1000mg, Chemotherapy, ACE Inhibitor"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Treatment Result */}
        <div>
          <label htmlFor="treatmentResult" className="block text-sm font-medium text-gray-700 mb-1">
            Treatment Response
          </label>
          {!customResponse ? (
            <select
              id="treatmentResult"
              name="treatmentResult"
              value={formData.treatmentResult}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select response...</option>
              {TREATMENT_RESPONSES.map(response => (
                <option key={response} value={response}>
                  {response}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                id="treatmentResult"
                name="treatmentResult"
                value={formData.treatmentResult}
                onChange={handleChange}
                placeholder="e.g., Partial response with HbA1c improved to 6.5%"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  setCustomResponse(false);
                  setFormData(prev => ({ ...prev, treatmentResult: '' }));
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to dropdown
              </button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div>
          <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Information
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            rows={4}
            placeholder="Any other relevant information (allergies, side effects, concerns, etc.)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Information
          </button>
        </div>
      </form>
    </div>
  );
}
