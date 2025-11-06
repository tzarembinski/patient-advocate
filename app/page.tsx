"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import Timeline from "@/components/Timeline";

export interface TimelineItem {
  name: string;
  beginDate: Date;
  endDate: Date | null; // null for milestones (single date events)
  category: string;
}

export default function Home() {
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);

  const handleDataLoaded = (data: TimelineItem[]) => {
    setTimelineData(data);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Medical Timeline Maker
        </h1>
        <p className="text-gray-600 mb-8">
          Upload an Excel or CSV file with Name, Begin date, End date (optional), and Category columns to generate a medical timeline
        </p>

        <FileUpload onDataLoaded={handleDataLoaded} />

        {timelineData.length > 0 && (
          <div className="mt-8">
            <Timeline data={timelineData} />
          </div>
        )}
      </div>
    </main>
  );
}
