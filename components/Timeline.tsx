"use client";

import { useMemo, useState, useEffect } from "react";
import { format, differenceInDays, addDays, startOfMonth, eachMonthOfInterval } from "date-fns";
import { TimelineItem } from "@/app/page";

interface TimelineProps {
  data: TimelineItem[];
  onEditEntry: (entry: TimelineItem) => void;
  onDeleteEntry: (id: string, name: string) => void;
  onAddNote: (id: string, note: string) => void;
  hiddenCategories: Set<string>;
  onToggleCategoryVisibility: (category: string) => void;
}

// Category color mapping for medical timeline with raw RGB values for cycle shading
const categoryColors: Record<string, { bg: string; border: string; text: string; rgb: string }> = {
  "Milestones": { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-900", rgb: "251, 191, 36" },
  "Biomarker Assess": { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900", rgb: "96, 165, 250" },
  "Ext. Biomarker Assess": { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900", rgb: "96, 165, 250" }, // Legacy support
  "Line 1 treatment": { bg: "bg-green-100", border: "border-green-400", text: "text-green-900", rgb: "74, 222, 128" },
  "Line 1": { bg: "bg-green-100", border: "border-green-400", text: "text-green-900", rgb: "74, 222, 128" }, // Legacy support
  "Line 2 treatment": { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-900", rgb: "192, 132, 252" },
  "Line 2": { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-900", rgb: "192, 132, 252" }, // Legacy support
  "Line 3 treatment": { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900", rgb: "251, 146, 60" },
  "Line 3": { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900", rgb: "251, 146, 60" }, // Legacy support
  "Line 4 treatment": { bg: "bg-cyan-100", border: "border-cyan-400", text: "text-cyan-900", rgb: "34, 211, 238" },
  "Line 4": { bg: "bg-cyan-100", border: "border-cyan-400", text: "text-cyan-900", rgb: "34, 211, 238" }, // Legacy support
  "Complications": { bg: "bg-red-100", border: "border-red-400", text: "text-red-900", rgb: "248, 113, 113" },
  "Other": { bg: "bg-gray-100", border: "border-gray-400", text: "text-gray-900", rgb: "156, 163, 175" },
};

// Default colors for categories not in the predefined list
const defaultCategoryColors = [
  { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-900", rgb: "45, 212, 191" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900", rgb: "251, 146, 60" },
  { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-900", rgb: "244, 114, 182" },
  { bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-900", rgb: "129, 140, 248" },
];


// Helper function to truncate long activity names
const truncateName = (name: string, maxLength: number = 40): string => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + "...";
};

// Helper function to get first word of a name
const getFirstWord = (name: string): string => {
  const firstWord = name.split(/\s+/)[0] || name;
  // Truncate if too long
  return firstWord.length > 10 ? firstWord.substring(0, 8) + ".." : firstWord;
};

// Helper function to count words
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export default function Timeline({
  data,
  onEditEntry,
  onDeleteEntry,
  onAddNote,
  hiddenCategories,
  onToggleCategoryVisibility,
}: TimelineProps) {
  const [containerWidth, setContainerWidth] = useState(800);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

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

  const handleStartEditNote = (item: TimelineItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(item.id);
    setNoteText(item.note || "");
  };

  const handleSaveNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddNote(id, noteText);
    setEditingNoteId(null);
    setNoteText("");
  };

  const handleCancelNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(null);
    setNoteText("");
  };

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

    // Check if this is a milestone (no end date OR end date equals begin date)
    const isMilestoneEvent = !item.endDate ||
      (item.endDate && differenceInDays(item.endDate, item.beginDate) === 0);

    if (item.endDate && !isMilestoneEvent) {
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

  const renderTooltipContent = (item: TimelineItem, position: ReturnType<typeof getItemPosition>, category: string) => {
    const isEditingThisNote = editingNoteId === item.id;
    const wordCount = countWords(noteText);
    const isOverLimit = wordCount > 30;

    return (
      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm pointer-events-auto min-w-[200px] max-w-[280px]">
          <div className="font-bold mb-1">{item.name}</div>
          <div className="text-gray-300 text-xs">
            {position.duration === 0 || position.isMilestone
              ? format(item.beginDate, "MMM dd, yyyy")
              : `${format(item.beginDate, "MMM dd, yyyy")} - ${item.endDate && format(item.endDate, "MMM dd, yyyy")}`
            }
          </div>
          {position.duration > 0 && !position.isMilestone && (
            <div className="text-gray-400 text-xs mt-1">
              Duration: {position.duration} days
            </div>
          )}
          <div className="text-gray-400 text-xs">
            {category}
          </div>

          {/* Note display/edit section */}
          {isEditingThisNote ? (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className={`w-full px-2 py-1 text-xs bg-gray-800 border rounded text-white placeholder-gray-500 resize-none ${isOverLimit ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="Add a note (max 30 words)..."
                rows={2}
                autoFocus
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>
                  {wordCount}/30 words
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => handleCancelNote(e)}
                    className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleSaveNote(item.id, e)}
                    disabled={isOverLimit}
                    className={`px-2 py-0.5 rounded text-xs ${isOverLimit ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {item.note && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-300 italic">&quot;{item.note}&quot;</div>
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700">
            <button
              onClick={() => onEditEntry(item)}
              className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => handleStartEditNote(item, e)}
              className="flex-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 rounded text-xs font-medium transition-colors"
            >
              {item.note ? 'Edit Note' : 'Add Note'}
            </button>
            <button
              onClick={() => onDeleteEntry(item.id, item.name)}
              className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
            >
              Delete
            </button>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-b-gray-900"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Medical Treatment Timeline</h2>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Swimlane Visibility Controls */}
          <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 mr-1">Swimlanes:</span>
              {sortedCategories.map((category) => {
                const isVisible = !hiddenCategories.has(category);
                const colors = getCategoryColor(category, sortedCategories.indexOf(category));
                return (
                  <button
                    key={category}
                    onClick={() => onToggleCategoryVisibility(category)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                      isVisible
                        ? `${colors.bg} ${colors.border} border ${colors.text}`
                        : 'bg-gray-200 text-gray-400 border border-gray-300'
                    }`}
                    title={isVisible ? `Hide ${category}` : `Show ${category}`}
                  >
                    <span className="text-sm">{isVisible ? '👁️' : '👁️‍🗨️'}</span>
                    <span className="truncate max-w-[100px]">{category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs md:text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            Tap/hover on any item for options
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div id="timeline-container" className="min-w-[600px] md:min-w-[800px]">
          {/* Month headers */}
          <div className="relative h-10 md:h-14 border-b-2 border-gray-400 mb-2 md:mb-4 ml-32 md:ml-48">
            {months.map((month, index) => {
              const position = getMonthPosition(month);
              // Calculate label interval based on number of months to prevent overlap
              // Show every month for <6 months, every 2nd for 6-11, every 3rd for 12-17, every 4th for 18+
              const totalMonths = months.length;
              const labelInterval = totalMonths <= 6 ? 1 : totalMonths <= 12 ? 2 : totalMonths <= 18 ? 3 : 4;
              const showLabel = index % labelInterval === 0;

              return (
                <div
                  key={index}
                  className="absolute top-0 h-full border-l border-gray-300"
                  style={{ left: `${position}%` }}
                >
                  {showLabel && (
                    <div className="ml-1 md:ml-2 flex flex-col leading-tight">
                      <span className="text-xs md:text-sm font-semibold text-gray-700">{format(month, "MMM")}</span>
                      <span className="text-[10px] md:text-xs text-gray-500">{format(month, "yy")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Swim lanes for each category - VERSION 3: Compact with on-bar labels */}
          <div className="space-y-0.5 pb-32">
            {sortedCategories.filter(cat => !hiddenCategories.has(cat)).map((category, catIndex) => {
              const items = categorizedData[category];
              const colors = getCategoryColor(category, sortedCategories.indexOf(category));

              return (
                <div key={category} className="flex relative">
                  {/* Category label - compact */}
                  <div className={`w-32 md:w-48 flex-shrink-0 pr-2 md:pr-3 py-2 ${colors.bg} border-l-4 ${colors.border} flex items-center`}>
                    <p className={`text-[10px] md:text-xs font-semibold ${colors.text} truncate px-2`}>
                      {category}
                    </p>
                  </div>

                  {/* Timeline lane - dynamic height based on waterfall stacking */}
                  {(() => {
                    // Pre-calculate waterfall rows to determine lane height
                    const itemsWithPositions = items.map(item => ({
                      item,
                      position: getItemPosition(item)
                    })).sort((a, b) => a.position.leftPercent - b.position.leftPercent);

                    // Threshold for overlap detection (percentage points for diamonds)
                    const overlapThreshold = 3;

                    // Calculate waterfall row for each item (always cascade down)
                    const itemRows: number[] = [];
                    for (let i = 0; i < itemsWithPositions.length; i++) {
                      const current = itemsWithPositions[i].position;
                      const currentEnd = current.leftPercent + (current.widthPercent || overlapThreshold);

                      // Find the maximum row of any overlapping previous item
                      let maxOverlapRow = -1;
                      for (let j = 0; j < i; j++) {
                        const prev = itemsWithPositions[j].position;
                        const prevEnd = prev.leftPercent + (prev.widthPercent || overlapThreshold);

                        // Check if ranges overlap
                        const overlaps = !(currentEnd <= prev.leftPercent || current.leftPercent >= prevEnd);

                        if (overlaps) {
                          maxOverlapRow = Math.max(maxOverlapRow, itemRows[j]);
                        }
                      }

                      // Place this item in the next row down
                      itemRows.push(maxOverlapRow + 1);
                    }

                    const maxRows = Math.max(...itemRows, 0) + 1;
                    const rowHeight = 24; // Height per row (matches bar height h-6) - no gap between rows
                    const baseLaneHeight = 32; // Minimum lane height
                    const laneHeight = Math.max(baseLaneHeight, maxRows * rowHeight + 8);

                    return (
                      <div
                        className={`flex-1 relative ${colors.bg} border-t border-b border-gray-200`}
                        style={{ height: `${laneHeight}px` }}
                      >
                        {/* Vertical grid lines for months */}
                        {months.map((month, mIndex) => {
                          const monthPos = getMonthPosition(month);
                          return (
                            <div
                              key={mIndex}
                              className="absolute top-0 h-full border-l border-gray-200"
                              style={{ left: `${monthPos}%` }}
                            />
                          );
                        })}

                        {/* Items in this category with waterfall stacking */}
                        {(() => {
                          // Threshold for "short" bars that need external labels
                          const shortBarThreshold = 50; // pixels

                          // Track label index for alternation (only for items that get labels)
                          let labelIndex = 0;

                          return itemsWithPositions.map(({ item, position }, itemIndex) => {
                            // Determine if this item needs an external label
                            const needsLabel = position.isMilestone || position.widthPixels <= shortBarThreshold;
                            const labelBelow = needsLabel ? (labelIndex % 2 === 0) : false;
                            if (needsLabel) labelIndex++;

                            // Waterfall: position from top, each row drops down
                            const row = itemRows[itemIndex];
                            const topOffset = 4 + (row * rowHeight); // Rows touch - no gap

                            if (position.isMilestone) {
                              return (
                                <div
                                  key={item.id || itemIndex}
                                  className="absolute -translate-x-1/2 group cursor-pointer z-10"
                                  style={{ left: position.left, top: `${topOffset}px` }}
                                >
                                  {/* Label above diamond (only for row 0) */}
                                  {!labelBelow && row === 0 && (
                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                      <span className={`text-[9px] md:text-[10px] font-medium ${colors.text} opacity-80`}>
                                        {getFirstWord(item.name)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Diamond shape with hover effect */}
                                  <div className={`w-4 h-4 md:w-5 md:h-5 ${colors.border} border-2 bg-white rotate-45 shadow-md transition-all duration-200 group-hover:scale-125 group-hover:shadow-xl`}></div>

                                  {/* Label below diamond or for stacked items */}
                                  {(labelBelow || row > 0) && (
                                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                      <span className={`text-[9px] md:text-[10px] font-medium ${colors.text} opacity-80`}>
                                        {getFirstWord(item.name)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Hover tooltip */}
                                  {renderTooltipContent(item, position, category)}
                                </div>
                              );
                            } else {
                              // Duration bar with hover effect
                              const isShortBar = position.widthPixels <= shortBarThreshold;

                              return (
                                <div
                                  key={item.id || itemIndex}
                                  className="absolute group cursor-pointer z-10"
                                  style={{ left: position.left, width: position.width, top: `${topOffset}px` }}
                                >
                                  {/* Label above short bar (only for row 0) */}
                                  {isShortBar && !labelBelow && row === 0 && (
                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                      <span className={`text-[9px] md:text-[10px] font-medium ${colors.text} opacity-80`}>
                                        {getFirstWord(item.name)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Bar with subtle hover effect */}
                                  <div
                                    className={`relative h-6 md:h-7 rounded shadow-md border-2 ${colors.border} transition-all duration-200 group-hover:shadow-xl group-hover:scale-105`}
                                    style={{ backgroundColor: `rgba(${colors.rgb}, 0.5)` }}
                                  >
                                    {/* Show text on bar for larger bars */}
                                    {!isShortBar && (
                                      <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
                                        <div className="text-[10px] md:text-xs font-bold text-gray-800 truncate px-2">
                                          {position.widthPixels > 80 ? truncateName(item.name) : item.name.substring(0, 1)}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Label below short bar or for stacked items */}
                                  {isShortBar && (labelBelow || row > 0) && (
                                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                      <span className={`text-[9px] md:text-[10px] font-medium ${colors.text} opacity-80`}>
                                        {getFirstWord(item.name)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Hover tooltip */}
                                  {renderTooltipContent(item, position, category)}
                                </div>
                              );
                            }
                          });
                        })()}
                      </div>
                    );
                  })()}
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
