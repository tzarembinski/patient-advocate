"use client";

import { useMemo, useState, useEffect } from "react";
import { format, differenceInDays, addDays, startOfMonth, eachMonthOfInterval } from "date-fns";
import { TimelineItem } from "@/app/page";

interface TimelineProps {
  data: TimelineItem[];
}

// Category color mapping for medical timeline with raw RGB values for cycle shading
const categoryColors: Record<string, { bg: string; border: string; text: string; rgb: string }> = {
  "Milestones": { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-900", rgb: "251, 191, 36" },
  "Ext. Biomarker Assess": { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900", rgb: "96, 165, 250" },
  "Line 1": { bg: "bg-green-100", border: "border-green-400", text: "text-green-900", rgb: "74, 222, 128" },
  "Line 2": { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-900", rgb: "192, 132, 252" },
  "Complications": { bg: "bg-red-100", border: "border-red-400", text: "text-red-900", rgb: "248, 113, 113" },
};

// Default colors for categories not in the predefined list
const defaultCategoryColors = [
  { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-900", rgb: "45, 212, 191" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900", rgb: "251, 146, 60" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-900", rgb: "244, 114, 182" },
  { bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-900", rgb: "129, 140, 248" },
];


export default function Timeline({ data }: TimelineProps) {
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('timeline-container');
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [data]);

  const timelineConfig = useMemo(() => {
    if (data.length === 0) return null;

    // Find the earliest begin date and latest end date
    const allDates = data.flatMap((item) => {
      const dates = [item.beginDate];
      if (item.endDate) dates.push(item.endDate);
      return dates;
    });
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Add some padding
    const startDate = addDays(startOfMonth(minDate), -15);
    const endDate = addDays(maxDate, 30);

    const totalDays = differenceInDays(endDate, startDate);

    // Generate month markers
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    // Filter out redundant parent activities
    const filteredData = data.filter((item) => {
      // Check if this item has "child" items (cycles)
      // A child is an item in the same category whose name starts with this item's name
      // and contains "cycle" or "dose" in the remaining part
      const children = data.filter((otherItem) => {
        if (otherItem === item) return false;
        if (otherItem.category !== item.category) return false;

        const parentName = item.name.toLowerCase();
        const childName = otherItem.name.toLowerCase();

        // Child name must start with parent name
        if (!childName.startsWith(parentName)) return false;

        // The part after the parent name should contain cycle/dose indicators
        const remainder = childName.substring(parentName.length).trim();
        const hasCycleIndicator =
          remainder.includes('cycle') ||
          remainder.includes('dose') ||
          /^(cycle|dose)?\s*\d+/.test(remainder); // starts with optional cycle/dose followed by number

        return hasCycleIndicator;
      });

      // If this item has children with cycle/dose patterns, it's a redundant parent
      // Remove it to avoid overlap with the individual cycles
      if (children.length > 0) {
        return false; // Filter out this redundant parent
      }

      return true; // Keep this item
    });

    // Group items by category
    const categorizedData: Record<string, TimelineItem[]> = {};
    filteredData.forEach((item) => {
      if (!categorizedData[item.category]) {
        categorizedData[item.category] = [];
      }
      categorizedData[item.category].push(item);
    });

    // FEATURE 2: Sort categories so Complications is always at the bottom
    const sortedCategories = Object.keys(categorizedData).sort((a, b) => {
      if (a === "Complications") return 1;
      if (b === "Complications") return -1;
      return 0;
    });

    return {
      startDate,
      endDate,
      totalDays,
      months,
      categorizedData,
      sortedCategories,
    };
  }, [data]);

  if (!timelineConfig) return null;

  const { startDate, totalDays, months, categorizedData, sortedCategories } = timelineConfig;

  const getItemPosition = (item: TimelineItem) => {
    const startOffset = differenceInDays(item.beginDate, startDate);
    const leftPercent = (startOffset / totalDays) * 100;

    if (item.endDate) {
      // Duration event - show as bar
      const duration = differenceInDays(item.endDate, item.beginDate);
      const widthPercent = Math.max((duration / totalDays) * 100, 0.5);
      const widthPixels = (widthPercent / 100) * containerWidth;

      return {
        left: `${leftPercent}%`,
        leftPercent,
        width: `${widthPercent}%`,
        widthPercent,
        widthPixels,
        isMilestone: false,
        duration,
      };
    } else {
      // Milestone - show as diamond
      return {
        left: `${leftPercent}%`,
        leftPercent,
        width: 'auto',
        widthPercent: 0,
        widthPixels: 0,
        isMilestone: true,
        duration: 0,
      };
    }
  };

  const getMonthPosition = (month: Date) => {
    const offset = differenceInDays(month, startDate);
    return (offset / totalDays) * 100;
  };

  const getCategoryColor = (category: string, index: number) => {
    if (categoryColors[category]) {
      return categoryColors[category];
    }
    return defaultCategoryColors[index % defaultCategoryColors.length];
  };



  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Medical Treatment Timeline</h2>
        <div className="text-xs md:text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
          💡 Hover over any milestone or activity to see details
        </div>
      </div>

      <div className="overflow-x-auto">
        <div id="timeline-container" className="min-w-[600px] md:min-w-[800px]">
          {/* Month headers */}
          <div className="relative h-8 md:h-12 border-b-2 border-gray-400 mb-2 md:mb-4 ml-32 md:ml-48">
            {months.map((month, index) => {
              const position = getMonthPosition(month);
              return (
                <div
                  key={index}
                  className="absolute top-0 h-full border-l border-gray-300"
                  style={{ left: `${position}%` }}
                >
                  <span className="text-xs md:text-sm font-semibold text-gray-700 ml-1 md:ml-2">
                    {format(month, "MMM yy")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Swim lanes for each category - VERSION 3: Compact with on-bar labels */}
          <div className="space-y-0.5">
            {sortedCategories.map((category, catIndex) => {
              const items = categorizedData[category];
              const colors = getCategoryColor(category, catIndex);

              return (
                <div key={category} className="flex relative">
                  {/* Category label - compact */}
                  <div className={`w-32 md:w-48 flex-shrink-0 pr-2 md:pr-3 py-2 ${colors.bg} border-l-4 ${colors.border} flex items-center`}>
                    <p className={`text-[10px] md:text-xs font-semibold ${colors.text} truncate px-2`}>
                      {category}
                    </p>
                  </div>

                  {/* Timeline lane - increased height for better visibility */}
                  <div className={`flex-1 relative ${colors.bg} border-t border-b border-gray-200 h-[48px] md:h-[56px]`}>
                    {/* Vertical grid lines for months */}
                    {months.map((month, mIndex) => {
                      const position = getMonthPosition(month);
                      return (
                        <div
                          key={mIndex}
                          className="absolute top-0 h-full border-l border-gray-200"
                          style={{ left: `${position}%` }}
                        />
                      );
                    })}

                    {/* Items in this category */}
                    {items.map((item, itemIndex) => {
                      const position = getItemPosition(item);
                      const isFirstCategory = catIndex === 0; // Check if this is the first swimlane

                      if (position.isMilestone) {
                        return (
                          <div
                            key={itemIndex}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer z-10"
                            style={{ left: position.left }}
                          >
                            {/* Diamond shape with hover effect */}
                            <div className={`w-4 h-4 md:w-5 md:h-5 ${colors.border} border-2 bg-white rotate-45 shadow-md transition-all duration-200 group-hover:scale-125 group-hover:shadow-xl`}></div>

                            {/* Hover tooltip - smart positioning: below for first category, above for others */}
                            <div className={`absolute ${isFirstCategory ? 'top-full mt-3' : 'bottom-full mb-3'} left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50`}>
                              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-sm">
                                <div className="font-bold mb-1">{item.name}</div>
                                <div className="text-gray-300 text-xs">
                                  {format(item.beginDate, "MMM dd, yyyy")}
                                </div>
                                <div className="text-gray-400 text-xs mt-1">
                                  {category}
                                </div>
                                {/* Tooltip arrow */}
                                <div className={`absolute ${isFirstCategory ? 'bottom-full' : 'top-full'} left-1/2 -translate-x-1/2 -mt-px`}>
                                  <div className={`border-4 border-transparent ${isFirstCategory ? 'border-b-gray-900' : 'border-t-gray-900'}`}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        // Duration bar with hover effect
                        return (
                          <div
                            key={itemIndex}
                            className="absolute top-1/2 -translate-y-1/2 group cursor-pointer z-10"
                            style={{ left: position.left, width: position.width }}
                          >
                            {/* Bar with subtle hover effect */}
                            <div
                              className={`relative h-7 md:h-8 rounded shadow-md border-2 ${colors.border} transition-all duration-200 group-hover:shadow-xl group-hover:scale-105`}
                              style={{ backgroundColor: `rgba(${colors.rgb}, 0.5)` }}
                            >
                              {/* Optional: Show first letter or short indicator on bar for very small bars */}
                              {position.widthPixels > 30 && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
                                  <div className="text-[10px] md:text-xs font-bold text-gray-800 truncate px-2">
                                    {position.widthPixels > 80 ? item.name : item.name.substring(0, 1)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Hover tooltip - smart positioning: below for first category, above for others */}
                            <div className={`absolute ${isFirstCategory ? 'top-full mt-3' : 'bottom-full mb-3'} left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50`}>
                              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-sm">
                                <div className="font-bold mb-1">{item.name}</div>
                                <div className="text-gray-300 text-xs">
                                  {position.duration === 0
                                    ? format(item.beginDate, "MMM dd, yyyy")
                                    : `${format(item.beginDate, "MMM dd, yyyy")} - ${item.endDate && format(item.endDate, "MMM dd, yyyy")}`
                                  }
                                </div>
                                {position.duration > 0 && (
                                  <div className="text-gray-400 text-xs mt-1">
                                    Duration: {position.duration} days
                                  </div>
                                )}
                                <div className="text-gray-400 text-xs">
                                  {category}
                                </div>
                                {/* Tooltip arrow */}
                                <div className={`absolute ${isFirstCategory ? 'bottom-full' : 'top-full'} left-1/2 -translate-x-1/2 -mt-px`}>
                                  <div className={`border-4 border-transparent ${isFirstCategory ? 'border-b-gray-900' : 'border-t-gray-900'}`}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200 ml-32 md:ml-48">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[10px] md:text-xs text-gray-600">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-gray-400 bg-white rotate-45"></div>
                  <span>Milestone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-4 border-2 border-gray-400 bg-gray-200 rounded"></div>
                  <span>Duration</span>
                </div>
              </div>
              <div className="text-[10px] md:text-xs">
                <span className="font-medium">Timeline:</span>{" "}
                {format(startDate, "MMM dd, yyyy")} - {format(timelineConfig.endDate, "MMM dd, yyyy")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
