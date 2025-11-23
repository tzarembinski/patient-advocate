"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import FileUpload, { FileUploadRef } from "@/components/FileUpload";
import Timeline from "@/components/Timeline";
import ManualEntryForm from "@/components/ManualEntryForm";
import Toast, { ToastType } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import OnboardingTips from "@/components/OnboardingTips";
import SavedIndicator from "@/components/SavedIndicator";
import PatientContextForm, { PatientContext } from "@/components/PatientContextForm";
import PromptModal from "@/components/PromptModal";
import HowToUse from "@/components/HowToUse";
import PatientInfoSummary from "@/components/PatientInfoSummary";
import {
  saveTimelineEntries,
  loadTimelineEntries,
  getLastSavedTime,
  isOnboardingDismissed,
  dismissOnboarding,
  savePatientContext,
  loadPatientContext,
} from "@/lib/localStorage";
import { generateSampleData } from "@/lib/sampleData";
import { generateDoctorQuestionsPrompt } from "@/lib/promptGenerator";
import { generateTimelinePDF } from "@/lib/pdfGenerator";

export interface TimelineItem {
  id: string;
  name: string;
  beginDate: Date;
  endDate: Date | null; // null for milestones (single date events)
  category: string;
}

interface ToastState {
  message: string;
  type: ToastType;
  show: boolean;
}

export default function Home() {
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimelineItem | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState>({ message: "", type: "success", show: false });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const fileUploadRef = useRef<FileUploadRef>(null);
  const manualEntryFormRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = loadTimelineEntries();
    if (savedData.length > 0) {
      setTimelineData(savedData);
      setLastSaved(getLastSavedTime());
    }
    const savedContext = loadPatientContext();
    if (savedContext) {
      setPatientContext(savedContext);
    }
    setIsLoaded(true);
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded && timelineData.length > 0) {
      saveTimelineEntries(timelineData);
      setLastSaved(new Date());
    }
  }, [timelineData, isLoaded]);

  // Check if we should show onboarding tips
  useEffect(() => {
    if (timelineData.length >= 2 && timelineData.length <= 5 && !isOnboardingDismissed()) {
      setShowOnboarding(true);
    }
  }, [timelineData.length]);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type, show: true });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleDataLoaded = (data: TimelineItem[]) => {
    setTimelineData(data);
    showToast(`Loaded ${data.length} entries from file`, "success");
  };

  const checkForDuplicate = (entry: TimelineItem): boolean => {
    return timelineData.some((item) => {
      if (editingEntry && item.id === editingEntry.id) {
        return false; // Skip the entry being edited
      }
      const sameDetails =
        item.name.toLowerCase() === entry.name.toLowerCase() &&
        item.beginDate.getTime() === entry.beginDate.getTime() &&
        ((item.endDate === null && entry.endDate === null) ||
          (item.endDate !== null && entry.endDate !== null && item.endDate.getTime() === entry.endDate.getTime()));
      return sameDetails;
    });
  };

  const handleEntryAdded = (entry: TimelineItem) => {
    try {
      if (checkForDuplicate(entry)) {
        showToast("Warning: This entry appears to be a duplicate", "warning");
      }
      setTimelineData((prevData) => [...prevData, entry]);
      showToast("Entry added successfully", "success");

      // Prompt to update patient info after adding timeline entry
      if (patientContext) {
        setTimeout(() => {
          if (window.confirm("Timeline entry added! Would you also like to update your patient information?")) {
            setShowPatientForm(true);
          }
        }, 500);
      }
    } catch (error) {
      showToast("Failed to add entry. Please try again.", "error");
    }
  };

  const handleEntryUpdated = (updatedEntry: TimelineItem) => {
    try {
      const entryExists = timelineData.some((item) => item.id === updatedEntry.id);
      if (!entryExists) {
        showToast("Error: Entry not found", "error");
        return;
      }

      setTimelineData((prevData) =>
        prevData.map((item) => (item.id === updatedEntry.id ? updatedEntry : item))
      );
      setEditingEntry(null);
      showToast("Entry updated successfully", "success");
    } catch (error) {
      showToast("Failed to update entry. Please try again.", "error");
    }
  };

  const handleEditEntry = (entry: TimelineItem) => {
    setEditingEntry(entry);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEntry = (id: string, name: string) => {
    try {
      const entry = timelineData.find((item) => item.id === id);
      if (!entry) {
        showToast("Error: Entry not found", "error");
        return;
      }

      if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
        setTimelineData((prevData) => prevData.filter((item) => item.id !== id));
        showToast("Entry deleted successfully", "success");
      }
    } catch (error) {
      showToast("Failed to delete entry. Please try again.", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleLoadSampleData = () => {
    const sampleData = generateSampleData();
    setTimelineData(sampleData);
    showToast(`Loaded ${sampleData.length} sample entries. You can edit or delete them anytime.`, "success");
  };

  const handleTriggerFileUpload = () => {
    fileUploadRef.current?.triggerUpload();
  };

  const handleScrollToManualEntry = () => {
    manualEntryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDismissOnboarding = () => {
    dismissOnboarding();
    setShowOnboarding(false);
  };

  const toggleCategoryVisibility = (category: string) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleExportToExcel = () => {
    if (timelineData.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    try {
      // Sort data by category, then by start date
      const sortedData = [...timelineData].sort((a, b) => {
        // First sort by category
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        // Then sort by start date within the same category
        return a.beginDate.getTime() - b.beginDate.getTime();
      });

      // Format data for Excel
      const excelData = sortedData.map((item) => ({
        Name: item.name,
        "Begin date": formatDateForExcel(item.beginDate),
        "End date": item.endDate ? formatDateForExcel(item.endDate) : "",
        Category: item.category,
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Timeline Data");

      // Set column widths for better readability
      worksheet["!cols"] = [
        { wch: 30 }, // Name
        { wch: 15 }, // Begin date
        { wch: 15 }, // End date
        { wch: 25 }, // Category
      ];

      // Generate filename with current date
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const filename = `timeline_export_${dateStr}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      showToast(`Exported ${timelineData.length} entries to ${filename}`, "success");
    } catch (error) {
      showToast("Failed to export data. Please try again.", "error");
      console.error("Export error:", error);
    }
  };

  // Helper function to format dates as MM/DD/YYYY
  const formatDateForExcel = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleExportToPDF = async () => {
    if (timelineData.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    try {
      await generateTimelinePDF(timelineRef.current, timelineData, patientContext);
      showToast(`Timeline exported to PDF successfully`, "success");
    } catch (error) {
      showToast("Failed to export PDF. Please try again.", "error");
      console.error("PDF export error:", error);
    }
  };

  const handleSavePatientContext = (context: PatientContext) => {
    setPatientContext(context);
    savePatientContext(context);
    setShowPatientForm(false);
    showToast("Patient information saved successfully", "success");
  };

  const handleGenerateQuestions = () => {
    if (!patientContext) {
      setShowPatientForm(true);
      showToast("Please enter your patient information first", "info");
      return;
    }

    if (timelineData.length === 0) {
      showToast("Please add timeline entries before generating questions", "warning");
      return;
    }

    const prompt = generateDoctorQuestionsPrompt(patientContext, timelineData);
    setGeneratedPrompt(prompt);
    setShowPromptModal(true);
  };

  const handleEditPatientInfo = () => {
    setShowPatientForm(true);
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Medical Timeline Maker
          </h1>
          <SavedIndicator lastSaved={lastSaved} />
        </div>
        <p className="text-gray-600 mb-6">
          Upload an Excel or CSV file with Name, Begin date, End date (optional), and Category columns to generate a medical timeline
        </p>

        <div className="mb-8">
          <HowToUse />
        </div>

        {patientContext && timelineData.length > 0 && (
          <PatientInfoSummary
            patientContext={patientContext}
            onEdit={handleEditPatientInfo}
          />
        )}

        {timelineData.length === 0 ? (
          <EmptyState
            onAddManualEntry={handleScrollToManualEntry}
            onLoadSampleData={handleLoadSampleData}
            onUploadFile={handleTriggerFileUpload}
          />
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <FileUpload ref={fileUploadRef} onDataLoaded={handleDataLoaded} />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleEditPatientInfo}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2 h-fit"
                title={patientContext ? "Edit your patient information" : "Add your patient information"}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {patientContext ? "Edit My Info" : "Add My Info"}
              </button>
              <button
                onClick={handleGenerateQuestions}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2 h-fit"
                title="Generate questions for your doctor based on your timeline"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Questions for Doctor
              </button>
              <button
                onClick={handleExportToExcel}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md flex items-center gap-2 h-fit"
                title="Export current timeline data to Excel"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export to Excel
              </button>
              <button
                onClick={handleExportToPDF}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md flex items-center gap-2 h-fit"
                title="Download timeline as PDF for printing"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        )}

        {showPatientForm && (
          <div className="mt-8">
            <PatientContextForm
              onSave={handleSavePatientContext}
              onCancel={() => setShowPatientForm(false)}
              initialData={patientContext || undefined}
            />
          </div>
        )}

        <div className="mt-8" ref={manualEntryFormRef}>
          <ManualEntryForm
            onEntryAdded={handleEntryAdded}
            onEntryUpdated={handleEntryUpdated}
            editingEntry={editingEntry}
            onCancelEdit={handleCancelEdit}
            existingEntries={timelineData}
          />
        </div>

        {showOnboarding && <OnboardingTips onDismiss={handleDismissOnboarding} />}

        {timelineData.length > 0 && (
          <div className="mt-8" ref={timelineRef}>
            <Timeline
              data={timelineData}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              hiddenCategories={hiddenCategories}
              onToggleCategoryVisibility={toggleCategoryVisibility}
            />
          </div>
        )}

        {/* Hidden FileUpload for empty state - only render when empty */}
        {timelineData.length === 0 && (
          <div className="hidden">
            <FileUpload ref={fileUploadRef} onDataLoaded={handleDataLoaded} />
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {showPromptModal && (
        <PromptModal
          prompt={generatedPrompt}
          onClose={() => setShowPromptModal(false)}
        />
      )}
    </main>
  );
}
