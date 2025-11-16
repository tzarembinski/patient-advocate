"use client";

import { useState, useEffect } from "react";
import { TimelineItem } from "@/app/page";

interface ManualEntryFormProps {
  onEntryAdded: (entry: TimelineItem) => void;
  onEntryUpdated: (entry: TimelineItem) => void;
  editingEntry: TimelineItem | null;
  onCancelEdit: () => void;
  existingEntries: TimelineItem[];
}

interface ValidationErrors {
  activityName?: string;
  startDate?: string;
  endDate?: string;
}

const CATEGORIES = [
  "Milestones",
  "Biomarker Assess",
  "Line 1 treatment",
  "Line 2 treatment",
  "Line 3 treatment",
  "Line 4 treatment",
  "Complications",
];

// Helper function to format date for input field (YYYY-MM-DD)
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ManualEntryForm({
  onEntryAdded,
  onEntryUpdated,
  editingEntry,
  onCancelEdit,
  existingEntries,
}: ManualEntryFormProps) {
  const [activityName, setActivityName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingEntry) {
      setActivityName(editingEntry.name);
      setStartDate(formatDateForInput(editingEntry.beginDate));
      setEndDate(editingEntry.endDate ? formatDateForInput(editingEntry.endDate) : "");
      setCategory(editingEntry.category);
      setValidationErrors({});
    }
  }, [editingEntry]);

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Activity name validation
    if (!activityName.trim()) {
      errors.activityName = "Activity name is required";
    }

    // Start date validation
    if (!startDate) {
      errors.startDate = "Start date is required";
    }

    // End date validation (must be after start date if provided)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        errors.endDate = "End date must be after start date";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if form is valid for submit button
  const isFormValid = (): boolean => {
    if (!activityName.trim() || !startDate) {
      return false;
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingEntry) {
        // Update existing entry
        const updatedEntry: TimelineItem = {
          id: editingEntry.id,
          name: activityName.trim(),
          beginDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          category: category,
        };

        onEntryUpdated(updatedEntry);
      } else {
        // Create new entry
        const newEntry: TimelineItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: activityName.trim(),
          beginDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          category: category,
        };

        onEntryAdded(newEntry);
      }

      // Clear the form
      setActivityName("");
      setStartDate("");
      setEndDate("");
      setCategory(CATEGORIES[0]);
      setValidationErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setActivityName("");
    setStartDate("");
    setEndDate("");
    setCategory(CATEGORIES[0]);
    setValidationErrors({});
    onCancelEdit();
  };

  // Clear validation error when user changes a field
  const handleActivityNameChange = (value: string) => {
    setActivityName(value);
    if (validationErrors.activityName) {
      setValidationErrors({ ...validationErrors, activityName: undefined });
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (validationErrors.startDate) {
      setValidationErrors({ ...validationErrors, startDate: undefined });
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    if (validationErrors.endDate) {
      setValidationErrors({ ...validationErrors, endDate: undefined });
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${editingEntry ? 'border-blue-500' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingEntry ? "Edit Timeline Entry" : "Add Timeline Entry"}
        </h2>
        {editingEntry && (
          <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Editing
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Activity Name */}
        <div>
          <label
            htmlFor="activityName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Activity Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="activityName"
            value={activityName}
            onChange={(e) => handleActivityNameChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.activityName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Initial Diagnosis, Treatment Start"
          />
          {validationErrors.activityName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.activityName}</p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.startDate && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Date <span className="text-gray-500 text-xs">(optional - leave empty for milestones)</span>
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.endDate && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          {editingEntry && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className={`${editingEntry ? 'flex-1' : 'w-full'} px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : editingEntry ? "Update Entry" : "Add Entry"}
          </button>
        </div>
      </form>

      <p className="mt-4 text-xs text-gray-500">
        * Required fields. Entries without an end date will appear as milestone diamonds on the timeline.
      </p>
    </div>
  );
}
