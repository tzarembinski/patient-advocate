import { TimelineItem } from "@/app/page";
import { PatientContext } from "@/components/PatientContextForm";

const STORAGE_KEYS = {
  TIMELINE_ENTRIES: "timeline_entries",
  ONBOARDING_DISMISSED: "timeline_onboarding_dismissed",
  LAST_SAVED: "timeline_last_saved",
  PATIENT_CONTEXT: "patient_context",
} as const;

/**
 * Safely check if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Save timeline entries to localStorage
 */
export const saveTimelineEntries = (entries: TimelineItem[]): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    const serializedData = JSON.stringify(
      entries.map((entry) => ({
        ...entry,
        beginDate: entry.beginDate.toISOString(),
        endDate: entry.endDate ? entry.endDate.toISOString() : null,
      }))
    );
    localStorage.setItem(STORAGE_KEYS.TIMELINE_ENTRIES, serializedData);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
  } catch (error) {
    console.error("Failed to save timeline entries:", error);
  }
};

/**
 * Load timeline entries from localStorage
 */
export const loadTimelineEntries = (): TimelineItem[] => {
  if (!isLocalStorageAvailable()) return [];

  try {
    const serializedData = localStorage.getItem(STORAGE_KEYS.TIMELINE_ENTRIES);
    if (!serializedData) return [];

    const parsedData = JSON.parse(serializedData);
    return parsedData.map((entry: any) => ({
      ...entry,
      beginDate: new Date(entry.beginDate),
      endDate: entry.endDate ? new Date(entry.endDate) : null,
    }));
  } catch (error) {
    console.error("Failed to load timeline entries:", error);
    return [];
  }
};

/**
 * Get the last saved timestamp
 */
export const getLastSavedTime = (): Date | null => {
  if (!isLocalStorageAvailable()) return null;

  try {
    const lastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
    return lastSaved ? new Date(lastSaved) : null;
  } catch (error) {
    console.error("Failed to get last saved time:", error);
    return null;
  }
};

/**
 * Check if onboarding has been dismissed
 */
export const isOnboardingDismissed = (): boolean => {
  if (!isLocalStorageAvailable()) return false;

  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED) === "true";
  } catch (error) {
    console.error("Failed to check onboarding status:", error);
    return false;
  }
};

/**
 * Mark onboarding as dismissed
 */
export const dismissOnboarding = (): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DISMISSED, "true");
  } catch (error) {
    console.error("Failed to dismiss onboarding:", error);
  }
};

/**
 * Clear all timeline data
 */
export const clearTimelineData = (): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(STORAGE_KEYS.TIMELINE_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
  } catch (error) {
    console.error("Failed to clear timeline data:", error);
  }
};

/**
 * Save patient context to localStorage
 */
export const savePatientContext = (context: PatientContext): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    const serializedData = JSON.stringify(context);
    localStorage.setItem(STORAGE_KEYS.PATIENT_CONTEXT, serializedData);
  } catch (error) {
    console.error("Failed to save patient context:", error);
  }
};

/**
 * Load patient context from localStorage
 */
export const loadPatientContext = (): PatientContext | null => {
  if (!isLocalStorageAvailable()) return null;

  try {
    const serializedData = localStorage.getItem(STORAGE_KEYS.PATIENT_CONTEXT);
    if (!serializedData) return null;

    return JSON.parse(serializedData);
  } catch (error) {
    console.error("Failed to load patient context:", error);
    return null;
  }
};

/**
 * Clear patient context from localStorage
 */
export const clearPatientContext = (): void => {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(STORAGE_KEYS.PATIENT_CONTEXT);
  } catch (error) {
    console.error("Failed to clear patient context:", error);
  }
};
