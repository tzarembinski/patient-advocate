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

interface LabelPosition {
  item: TimelineItem;
  leftPercent: number;
  widthPercent: number;
  isInside: boolean;
  category: string;
}

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

    // Group items by category
    const categorizedData: Record<string, TimelineItem[]> = {};
    data.forEach((item) => {
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

      // FEATURE 1: Smart labeling - determine if label should be inside or outside
      // Threshold: if bar is wider than 80px, place label inside
      const isInside = widthPixels > 80;

      return {
        left: `${leftPercent}%`,
        leftPercent,
        width: `${widthPercent}%`,
        widthPercent,
        widthPixels,
        isMilestone: false,
        isInside,
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
        isInside: false,
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

  // FEATURE 3: Generate cycle segments for a treatment bar
  const getCycleSegments = (duration: number, numCycles: number = 4) => {
    const segments = [];
    const cycleWidth = 100 / numCycles;

    for (let i = 0; i < numCycles; i++) {
      segments.push({
        left: i * cycleWidth,
        width: cycleWidth,
        isDarker: i % 2 === 1, // Alternate darker/lighter
      });
    }

    return segments;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Medical Treatment Timeline</h2>

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

          {/* Swim lanes for each category */}
          <div className="space-y-1">
            {sortedCategories.map((category, catIndex) => {
              const items = categorizedData[category];
              const colors = getCategoryColor(category, catIndex);

              // Collect label positions for overlap detection
              const labelPositions: LabelPosition[] = [];

              return (
                <div key={category} className="flex relative">
                  {/* Category label */}
                  <div className={`w-32 md:w-48 flex-shrink-0 pr-2 md:pr-4 py-3 md:py-4 ${colors.bg} border-l-4 ${colors.border} flex items-center`}>
                    <p className={`text-xs md:text-sm font-semibold ${colors.text} truncate px-2`}>
                      {category}
                    </p>
                  </div>

                  {/* Timeline lane */}
                  <div className={`flex-1 relative ${colors.bg} border-t border-b border-gray-200 min-h-[80px] md:min-h-[100px]`}>
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

                      if (position.isMilestone) {
                        // Render milestone as diamond marker
                        labelPositions.push({
                          item,
                          leftPercent: position.leftPercent,
                          widthPercent: 0,
                          isInside: false,
                          category,
                        });

                        return (
                          <div key={itemIndex}>
                            {/* Diamond shape */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-10"
                              style={{ left: position.left }}
                            >
                              <div className={`w-3 h-3 md:w-4 md:h-4 ${colors.border} border-2 bg-white rotate-45 shadow-md`}></div>
                            </div>

                            {/* FEATURE 1: Milestone label - always outside to the right */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 ml-3"
                              style={{ left: position.left }}
                            >
                              <div className="text-[10px] md:text-xs font-medium text-gray-900 whitespace-nowrap bg-white/80 px-1 rounded">
                                <div className="font-semibold">{item.name}</div>
                                <div className="text-gray-600">{format(item.beginDate, "MM/dd")}</div>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        // Render duration event as horizontal bar
                        labelPositions.push({
                          item,
                          leftPercent: position.leftPercent,
                          widthPercent: position.widthPercent,
                          isInside: position.isInside,
                          category,
                        });

                        // FEATURE 3: Calculate cycle segments
                        const numCycles = Math.max(Math.floor(position.duration / 21), 2); // ~3 weeks per cycle
                        const cycleSegments = getCycleSegments(position.duration, numCycles);

                        return (
                          <div key={itemIndex}>
                            {/* Bar with cycle shading */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 group overflow-hidden"
                              style={{ left: position.left, width: position.width }}
                            >
                              <div className={`relative h-3 md:h-4 rounded-sm shadow border-2 ${colors.border}`}>
                                {/* FEATURE 3: Cycle segments */}
                                {cycleSegments.map((segment, segIdx) => (
                                  <div
                                    key={segIdx}
                                    className="absolute h-full"
                                    style={{
                                      left: `${segment.left}%`,
                                      width: `${segment.width}%`,
                                      backgroundColor: segment.isDarker
                                        ? `rgba(${colors.rgb}, 0.7)`
                                        : `rgba(${colors.rgb}, 0.5)`,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* FEATURE 1: Smart label positioning */}
                            {position.isInside ? (
                              // Label inside the bar (white text)
                              <div
                                className="absolute top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                                style={{ left: position.left, width: position.width }}
                              >
                                <div className="flex items-center justify-center h-full px-2">
                                  <div className="text-[9px] md:text-[11px] font-semibold text-white text-center leading-tight">
                                    <div className="truncate">{item.name}</div>
                                    <div className="opacity-90">
                                      {format(item.beginDate, "MM/dd")} - {item.endDate && format(item.endDate, "MM/dd")}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // Label outside the bar (dark text)
                              <div
                                className="absolute top-1/2 -translate-y-1/2 ml-2 z-10"
                                style={{ left: `calc(${position.left} + ${position.width})` }}
                              >
                                <div className="text-[9px] md:text-[11px] font-medium text-gray-900 whitespace-nowrap bg-white/90 px-1 rounded shadow-sm">
                                  <div className="font-semibold">{item.name}</div>
                                  <div className="text-gray-600">
                                    {format(item.beginDate, "MM/dd")} - {item.endDate && format(item.endDate, "MM/dd")}
                                  </div>
                                </div>
                              </div>
                            )}
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
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 ml-32 md:ml-48">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-gray-400 bg-white rotate-45"></div>
                  <span>Milestone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 md:w-8 h-3 md:h-4 border-2 border-gray-400 bg-gray-200 rounded-sm"></div>
                  <span>Duration (with cycles)</span>
                </div>
              </div>
              <div>
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
