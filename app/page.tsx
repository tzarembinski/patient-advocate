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
import TabNavigation from "@/components/TabNavigation";
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
  note?: string; // optional note (30 words max)
}

interface ToastState {
  message: string;
  type: ToastType;
  show: boolean;
}

const TABS = [
  {
    id: "timeline",
    label: "My Timeline",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "doctor-prep",
    label: "Doctor Visit Prep",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("timeline");
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

  const handleAddNote = (id: string, note: string) => {
    setTimelineData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, note } : item))
    );
    showToast("Note saved successfully", "success");
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
        Note: item.note || "",
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
        { wch: 40 }, // Note
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
      await generateTimelinePDF(timelineRef.current, timelineData);
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

    // Timeline is now optional - pass it if available
    const prompt = generateDoctorQuestionsPrompt(patientContext, timelineData);
    setGeneratedPrompt(prompt);
    setShowPromptModal(true);
  };

  const handleEditPatientInfo = () => {
    setShowPatientForm(true);
  };

  // Timeline Tab Content
  const renderTimelineTab = () => (
    <>
      <div className="mb-8">
        <HowToUse />
      </div>

      {timelineData.length === 0 ? (
        <EmptyState
          onAddManualEntry={handleScrollToManualEntry}
          onLoadSampleData={handleLoadSampleData}
          onUploadFile={handleTriggerFileUpload}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <FileUpload ref={fileUploadRef} onDataLoaded={handleDataLoaded} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportToExcel}
                className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
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
                <span className="hidden sm:inline">Export to Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
              <button
                onClick={handleExportToPDF}
                className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2"
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
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
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
            onAddNote={handleAddNote}
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
    </>
  );

  // Doctor Visit Prep Tab Content
  const renderDoctorPrepTab = () => (
    <div className="space-y-6">
      {/* Prominent action buttons */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Prepare for Your Doctor Visit</h2>
        <p className="text-gray-600 mb-6">
          Add your health information and generate personalized questions to ask your doctor.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleEditPatientInfo}
            className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg flex items-center justify-center gap-3 text-lg"
            title={patientContext ? "Edit your patient information" : "Add your patient information"}
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {patientContext ? "Edit My Info" : "Add My Info"}
          </button>

          <button
            onClick={handleGenerateQuestions}
            className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-3 text-lg"
            title="Generate questions for your doctor based on your information"
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Questions for Doctor
          </button>
        </div>

        {timelineData.length > 0 && (
          <p className="mt-4 text-sm text-purple-700 bg-purple-100 px-3 py-2 rounded-lg">
            Your timeline has {timelineData.length} entries that will be included when generating questions.
          </p>
        )}
      </div>

      {/* Patient Info Summary */}
      {patientContext && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Your Health Information</h3>
            <button
              onClick={handleEditPatientInfo}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {patientContext.condition && (
              <div>
                <span className="font-medium text-gray-500">Condition:</span>
                <p className="text-gray-900">{patientContext.condition}</p>
              </div>
            )}
            {patientContext.specialty && (
              <div>
                <span className="font-medium text-gray-500">Specialty:</span>
                <p className="text-gray-900">{patientContext.specialty}</p>
              </div>
            )}
            {patientContext.stageStatus && (
              <div>
                <span className="font-medium text-gray-500">Stage/Status:</span>
                <p className="text-gray-900">{patientContext.stageStatus}</p>
              </div>
            )}
            {patientContext.keyBiomarkers && (
              <div>
                <span className="font-medium text-gray-500">Key Biomarkers:</span>
                <p className="text-gray-900">{patientContext.keyBiomarkers}</p>
              </div>
            )}
            {patientContext.currentTreatment && (
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-500">Current Treatment:</span>
                <p className="text-gray-900">{patientContext.currentTreatment}</p>
              </div>
            )}
            {patientContext.treatmentResult && (
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-500">Treatment Response:</span>
                <p className="text-gray-900">{patientContext.treatmentResult}</p>
              </div>
            )}
          </div>

          {patientContext.lastUpdated && (
            <p className="mt-4 text-xs text-gray-500">
              Last updated: {new Date(patientContext.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Patient Form */}
      {showPatientForm && (
        <PatientContextForm
          onSave={handleSavePatientContext}
          onCancel={() => setShowPatientForm(false)}
          initialData={patientContext || undefined}
        />
      )}

      {/* Help text when no patient info */}
      {!patientContext && !showPatientForm && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Health Information Yet</h3>
          <p className="text-gray-600 mb-4">
            Click &quot;Add My Info&quot; above to enter your health information. This will help generate personalized questions for your doctor.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
            Medical Timeline Maker
          </h1>
          <SavedIndicator lastSaved={lastSaved} />
        </div>
        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          Create and manage your medical timeline, and prepare for doctor visits
        </p>

        <TabNavigation
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === "timeline" && renderTimelineTab()}
        {activeTab === "doctor-prep" && renderDoctorPrepTab()}
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
