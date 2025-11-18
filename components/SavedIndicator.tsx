"use client";

import { useEffect, useState } from "react";

interface SavedIndicatorProps {
  lastSaved: Date | null;
}

export default function SavedIndicator({ lastSaved }: SavedIndicatorProps) {
  const [displayText, setDisplayText] = useState<string>("");

  useEffect(() => {
    if (!lastSaved) {
      setDisplayText("");
      return;
    }

    const updateDisplay = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSaved.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffSeconds < 10) {
        setDisplayText("Saved just now");
      } else if (diffSeconds < 60) {
        setDisplayText(`Saved ${diffSeconds} seconds ago`);
      } else if (diffMinutes < 60) {
        setDisplayText(`Saved ${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`);
      } else if (diffHours < 24) {
        setDisplayText(`Saved ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`);
      } else {
        setDisplayText(
          `Saved on ${lastSaved.toLocaleDateString()} at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        );
      }
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  if (!displayText) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <svg
        className="w-4 h-4 text-green-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span>{displayText}</span>
    </div>
  );
}
