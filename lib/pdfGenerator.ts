import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { TimelineItem } from "@/app/page";

/**
 * Format a date to MM/DD/YYYY
 */
const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

/**
 * Generate PDF of the timeline visualization
 * Page 1: Timeline visualization
 * Page 2: Table of activities and notes
 */
export const generateTimelinePDF = async (
  timelineElement: HTMLElement | null,
  timelineEntries: TimelineItem[]
): Promise<void> => {
  if (!timelineElement) {
    throw new Error("Timeline element not found");
  }

  // Clone the timeline element for modification
  const clonedElement = timelineElement.cloneNode(true) as HTMLElement;

  // Add extra padding to prevent text clipping
  clonedElement.style.padding = "40px";
  clonedElement.style.backgroundColor = "#ffffff";

  // Improve text rendering
  const allTextElements = clonedElement.querySelectorAll("*");
  allTextElements.forEach((el: Element) => {
    const htmlEl = el as HTMLElement;
    // Add line-height and ensure no overflow clipping
    htmlEl.style.lineHeight = "1.5";
    htmlEl.style.overflow = "visible";

    // For text elements, ensure they have padding
    if (htmlEl.textContent && htmlEl.textContent.trim()) {
      htmlEl.style.paddingTop = "2px";
      htmlEl.style.paddingBottom = "2px";
    }
  });

  // Append to body temporarily for rendering
  clonedElement.style.position = "absolute";
  clonedElement.style.left = "-9999px";
  clonedElement.style.top = "0";
  document.body.appendChild(clonedElement);

  // Small delay to ensure rendering
  await new Promise(resolve => setTimeout(resolve, 100));

  // Capture the cloned element
  const canvas = await html2canvas(clonedElement, {
    backgroundColor: "#ffffff",
    scale: 3, // Higher quality for better text rendering
    logging: false,
    useCORS: true,
    allowTaint: true,
    foreignObjectRendering: false,
    imageTimeout: 0,
    removeContainer: false,
  });

  // Remove the cloned element
  document.body.removeChild(clonedElement);

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Create PDF in landscape mode if timeline is wide
  const orientation = imgWidth > imgHeight ? "landscape" : "portrait";
  const doc = new jsPDF({
    orientation: orientation,
    unit: "mm",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // ========== PAGE 1: Timeline Visualization ==========

  // Title header
  doc.setFillColor(59, 130, 246); // Blue color
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Medical Timeline Report", pageWidth / 2, 16, { align: "center" });

  yPosition = 35;
  doc.setTextColor(0, 0, 0);

  // Date generated
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - margin, yPosition, { align: "right" });
  yPosition += 10;

  // Timeline Visualization Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TIMELINE VISUALIZATION", margin, yPosition);
  yPosition += 8;

  // Calculate dimensions to fit the timeline image
  const availableWidth = pageWidth - 2 * margin;
  const availableHeight = pageHeight - yPosition - margin - 15; // Reserve space for footer

  // Calculate the aspect ratio
  const aspectRatio = imgWidth / imgHeight;
  let finalWidth = availableWidth;
  let finalHeight = availableWidth / aspectRatio;

  // If the height is too tall, scale down based on height
  if (finalHeight > availableHeight) {
    finalHeight = availableHeight;
    finalWidth = availableHeight * aspectRatio;
  }

  // Center the image horizontally if it's narrower than the page
  const xOffset = margin + (availableWidth - finalWidth) / 2;

  // Add the timeline image
  doc.addImage(imgData, "PNG", xOffset, yPosition, finalWidth, finalHeight);

  // Footer for page 1
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Medical Timeline Maker - Page 1",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  // ========== PAGE 2: Notes Table ==========
  doc.addPage();
  yPosition = margin;

  // Title header for page 2
  doc.setFillColor(59, 130, 246); // Blue color
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Timeline Details & Notes", pageWidth / 2, 16, { align: "center" });

  yPosition = 35;
  doc.setTextColor(0, 0, 0);

  // Sort entries by category, then by date
  const sortedEntries = [...timelineEntries].sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.beginDate.getTime() - b.beginDate.getTime();
  });

  // Table headers
  const colWidths = {
    name: (pageWidth - 2 * margin) * 0.3,
    dates: (pageWidth - 2 * margin) * 0.25,
    category: (pageWidth - 2 * margin) * 0.15,
    note: (pageWidth - 2 * margin) * 0.3,
  };

  // Draw table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  let xPos = margin + 2;
  doc.text("Activity", xPos, yPosition + 5.5);
  xPos += colWidths.name;
  doc.text("Dates", xPos, yPosition + 5.5);
  xPos += colWidths.dates;
  doc.text("Category", xPos, yPosition + 5.5);
  xPos += colWidths.category;
  doc.text("Notes", xPos, yPosition + 5.5);

  yPosition += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  // Draw table rows
  sortedEntries.forEach((entry, index) => {
    // Format dates
    const dateStr = entry.endDate
      ? `${formatDate(entry.beginDate)} - ${formatDate(entry.endDate)}`
      : formatDate(entry.beginDate);

    // Calculate note lines to determine row height
    const noteText = entry.note || "-";
    const noteLines = doc.splitTextToSize(noteText, colWidths.note - 4);
    const numNoteLines = Math.min(noteLines.length, 5); // Max 5 lines
    const rowHeight = Math.max(10, numNoteLines * 4 + 4); // Dynamic row height

    // Check if we need a new page
    if (yPosition + rowHeight > pageHeight - 25) {
      doc.addPage();
      yPosition = margin;

      // Redraw header on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");

      xPos = margin + 2;
      doc.text("Activity", xPos, yPosition + 5.5);
      xPos += colWidths.name;
      doc.text("Dates", xPos, yPosition + 5.5);
      xPos += colWidths.dates;
      doc.text("Category", xPos, yPosition + 5.5);
      xPos += colWidths.category;
      doc.text("Notes", xPos, yPosition + 5.5);

      yPosition += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    // Alternate row colors with dynamic height
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 1, pageWidth - 2 * margin, rowHeight, "F");
    }

    // Truncate long text for name/category columns
    const truncate = (text: string, maxLen: number) => {
      if (text.length <= maxLen) return text;
      return text.substring(0, maxLen - 3) + "...";
    };

    xPos = margin + 2;
    doc.text(truncate(entry.name, 35), xPos, yPosition + 5);
    xPos += colWidths.name;
    doc.text(dateStr, xPos, yPosition + 5);
    xPos += colWidths.dates;
    doc.text(truncate(entry.category, 18), xPos, yPosition + 5);
    xPos += colWidths.category;

    // Handle notes - show all lines (up to 5)
    for (let i = 0; i < numNoteLines; i++) {
      doc.text(noteLines[i], xPos, yPosition + 5 + (i * 4));
    }
    if (noteLines.length > 5) {
      doc.text("...", xPos + colWidths.note - 10, yPosition + 5 + (4 * 4));
    }

    yPosition += rowHeight;
  });

  // Draw border around the table
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, 43, pageWidth - 2 * margin, yPosition - 43);

  // Footer for page 2
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Medical Timeline Maker - Page 2",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  // Generate filename with current date
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const filename = `timeline_${dateStr}.pdf`;

  // Download the PDF
  doc.save(filename);
};
