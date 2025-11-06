"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { TimelineItem } from "@/app/page";

interface FileUploadProps {
  onDataLoaded: (data: TimelineItem[]) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const parseDate = (value: any): Date | null => {
    if (!value) return null;

    // If it's already a Date object
    if (value instanceof Date) {
      return value;
    }

    // If it's an Excel serial date number
    if (typeof value === "number") {
      // Excel dates are days since 1900-01-01
      const date = new Date((value - 25569) * 86400 * 1000);
      return date;
    }

    // If it's a string, try to parse it
    if (typeof value === "string") {
      const date = new Date(value);
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

        if (name && beginDate && category) {
          const parsedBeginDate = parseDate(beginDate);
          const parsedEndDate = endDate ? parseDate(endDate) : null;

          if (parsedBeginDate) {
            timelineItems.push({
              name: String(name),
              beginDate: parsedBeginDate,
              endDate: parsedEndDate,
              category: String(category),
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

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Upload Excel or CSV File
        </button>

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

        <p className="mt-4 text-xs text-gray-500 text-center">
          Upload a file (.xlsx, .xls, or .csv) with columns: Name, Begin date, End date (optional for milestones), Category
        </p>
      </div>
    </div>
  );
}
