import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { TimelineItem } from "@/app/page";
import { PatientContext } from "@/components/PatientContextForm";

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
 */
export const generateTimelinePDF = async (
  timelineElement: HTMLElement | null,
  timelineEntries: TimelineItem[],
  patientContext?: PatientContext | null
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

  // Patient Information Section (if available)
  if (patientContext) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT INFORMATION", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const maxLineWidth = pageWidth - 2 * margin;

    if (patientContext.condition) {
      const text = `Condition: ${patientContext.condition}`;
      const lines = doc.splitTextToSize(text, maxLineWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4;
    }
    if (patientContext.specialty) {
      doc.text(`Specialty: ${patientContext.specialty}`, margin, yPosition);
      yPosition += 4;
    }
    if (patientContext.stageStatus) {
      doc.text(`Status: ${patientContext.stageStatus}`, margin, yPosition);
      yPosition += 4;
    }
    if (patientContext.keyBiomarkers) {
      const text = `Key Biomarkers: ${patientContext.keyBiomarkers}`;
      const lines = doc.splitTextToSize(text, maxLineWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 4;
    }

    yPosition += 5;
  }

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

  yPosition += finalHeight + 10;

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Medical Timeline Maker",
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
