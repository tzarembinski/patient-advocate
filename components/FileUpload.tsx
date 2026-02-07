"use client";

import { useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as XLSX from "xlsx";
import { TimelineItem } from "@/app/page";

interface FileUploadProps {
  onDataLoaded: (data: TimelineItem[]) => void;
}

export interface FileUploadRef {
  triggerUpload: () => void;
}

const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(({ onDataLoaded }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showExample, setShowExample] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      fileInputRef.current?.click();
    },
  }));

  const parseDate = (value: any): Date | null => {
    if (!value) return null;

    // If it's already a Date object (XLSX automatically converts some dates)
    if (value instanceof Date) {
      // Keep it as-is without any timezone conversions
      return value;
    }

    // If it's an Excel serial date number
    if (typeof value === "number") {
      // Excel dates are stored as number of days since December 30, 1899
      // Convert to JavaScript date
      const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
      const msPerDay = 86400000;
      const dateMs = excelEpoch.getTime() + (value * msPerDay);
      return new Date(dateMs);
    }

    // If it's a string, try multiple parsing strategies
    if (typeof value === "string") {
      const str = value.trim();

      // Try parsing MM/DD/YYYY or MM-DD-YYYY
      const mdyPattern = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/;
      const mdyMatch = str.match(mdyPattern);
      if (mdyMatch) {
        let [, month, day, year] = mdyMatch;
        // Convert 2-digit year to 4-digit (assume 20xx for YY < 100)
        if (year.length === 2) {
          year = `20${year}`;
        }
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try parsing YYYY-MM-DD or YYYY/MM/DD
      const ymdPattern = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/;
      const ymdMatch = str.match(ymdPattern);
      if (ymdMatch) {
        const [, year, month, day] = ymdMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try parsing YYYYMMDD
      const compactPattern = /^(\d{4})(\d{2})(\d{2})$/;
      const compactMatch = str.match(compactPattern);
      if (compactMatch) {
        const [, year, month, day] = compactMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try parsing DD/MM/YYYY or DD-MM-YYYY (European format)
      // This is ambiguous with MM/DD/YYYY, so we check if day > 12
      const dmyPattern = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/;
      const dmyMatch = str.match(dmyPattern);
      if (dmyMatch) {
        let [, first, second, year] = dmyMatch;
        // If first number > 12, it must be day (European format)
        if (parseInt(first) > 12) {
          if (year.length === 2) {
            year = `20${year}`;
          }
          const date = new Date(parseInt(year), parseInt(second) - 1, parseInt(first));
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }

      // Fallback: try native Date parsing
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const timelineItems: TimelineItem[] = [];

      for (const row of jsonData as any[]) {
        // Try different column name variations
        const name =
          row["Name"] ||
          row["name"] ||
          row["NAME"] ||
          row["Event"] ||
          row["event"];
        const beginDate =
          row["Begin date"] ||
          row["Begin Date"] ||
          row["begin date"] ||
          row["Start Date"] ||
          row["start date"] ||
          row["Start"] ||
          row["start"];
        const endDate =
          row["End date"] ||
          row["End Date"] ||
          row["end date"] ||
          row["End"] ||
          row["end"];
        const category =
          row["Category"] ||
          row["category"] ||
          row["CATEGORY"] ||
          row["Type"] ||
          row["type"];
        const note =
          row["Note"] ||
          row["note"] ||
          row["NOTE"] ||
          row["Notes"] ||
          row["notes"];

        // Helper to truncate note to first 30 words
        const truncateToWords = (text: string, maxWords: number): string => {
          if (!text) return "";
          const words = String(text).trim().split(/\s+/);
          if (words.length <= maxWords) return String(text).trim();
          return words.slice(0, maxWords).join(" ");
        };

        if (name && beginDate && category) {
          const parsedBeginDate = parseDate(beginDate);
          const parsedEndDate = endDate ? parseDate(endDate) : null;

          if (parsedBeginDate) {
            timelineItems.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: String(name),
              beginDate: parsedBeginDate,
              endDate: parsedEndDate,
              category: String(category),
              note: note ? truncateToWords(note, 30) : undefined,
            });
          }
        }
      }

      if (timelineItems.length === 0) {
        setError(
          "No valid data found. Please ensure your file has 'Name', 'Begin date', and 'Category' columns."
        );
        return;
      }

      onDataLoaded(timelineItems);
    } catch (err) {
      setError("Error reading file. Please ensure it's a valid Excel or CSV file.");
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
      <div className="flex flex-col items-center justify-center">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
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

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Upload Excel or CSV File
          </button>

          <button
            onClick={() => setShowExample(!showExample)}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            title="Show example format"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Example
          </button>
        </div>

        {fileName && (
          <p className="mt-4 text-sm text-gray-600">
            <span className="font-medium">File:</span> {fileName}
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {showExample && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Excel File Format Example</h3>
            <p className="text-xs text-gray-700 mb-3">
              Your Excel file should have these columns:
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Name</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Begin date</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">End date</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Category</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Diagnosis (ultrasound)</td>
                    <td className="border border-gray-300 px-3 py-2">03/18/2025</td>
                    <td className="border border-gray-300 px-3 py-2">03/18/2025</td>
                    <td className="border border-gray-300 px-3 py-2">Milestones</td>
                    <td className="border border-gray-300 px-3 py-2">Stage IIA confirmed</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Chemotherapy cycle 1</td>
                    <td className="border border-gray-300 px-3 py-2">04/01/2025</td>
                    <td className="border border-gray-300 px-3 py-2">04/21/2025</td>
                    <td className="border border-gray-300 px-3 py-2">Line 1 treatment</td>
                    <td className="border border-gray-300 px-3 py-2">AC regimen every 2 weeks</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Blood test</td>
                    <td className="border border-gray-300 px-3 py-2">05/10/2025</td>
                    <td className="border border-gray-300 px-3 py-2"></td>
                    <td className="border border-gray-300 px-3 py-2">Biomarker Assess</td>
                    <td className="border border-gray-300 px-3 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Note:</span> End date is optional for single-day events (milestones)
              </p>
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Supported date formats:</span> MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD, and more
              </p>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500 text-center">
          Upload a file (.xlsx, .xls, or .csv) with columns: Name, Begin date, End date (optional), Category, Note (optional, max 30 words)
        </p>
      </div>
    </div>
  );
});

FileUpload.displayName = "FileUpload";

export default FileUpload;
