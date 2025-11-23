import { PatientContext } from "@/components/PatientContextForm";
import { TimelineItem } from "@/app/page";
import { getGuidelineOrganizations } from "./guidelineMapping";

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
 * Generate the timeline section of the prompt
 */
const generateTimelineSection = (entries: TimelineItem[]): string => {
  if (entries.length === 0) {
    return "No timeline entries available.";
  }

  // Sort entries chronologically by begin date
  const sortedEntries = [...entries].sort(
    (a, b) => a.beginDate.getTime() - b.beginDate.getTime()
  );

  let timelineText = "";

  sortedEntries.forEach((entry) => {
    const beginDate = formatDate(entry.beginDate);
    const endDate = entry.endDate ? formatDate(entry.endDate) : null;

    if (endDate) {
      timelineText += `- ${beginDate}: ${entry.name} (${entry.category}) [Ended: ${endDate}]\n`;
    } else {
      timelineText += `- ${beginDate}: ${entry.name} (${entry.category})\n`;
    }
  });

  return timelineText.trim();
};

/**
 * Generate the complete prompt for doctor questions
 */
export const generateDoctorQuestionsPrompt = (
  context: PatientContext,
  timelineEntries: TimelineItem[]
): string => {
  const timelineSection = generateTimelineSection(timelineEntries);
  const today = new Date();
  const lastUpdated = formatDate(today);

  // Get relevant guideline organizations for the specialty
  const guidelines = getGuidelineOrganizations(context.specialty);

  const prompt = `Act like an expert doctor specializing in ${context.condition} - ${context.specialty}.

PATIENT BACKGROUND:
- Primary condition: ${context.condition || "Not specified"}
- Current status: ${context.stageStatus || "Not specified"}
- Active treatment: ${context.currentTreatment || "Not specified"}
- Treatment response: ${context.treatmentResult || "Not specified"}
- Key biomarkers: ${context.keyBiomarkers || "Not specified"}
- Additional context: ${context.additionalInfo || "Not specified"}
- Timeline last updated: ${lastUpdated}

COMPLETE TREATMENT TIMELINE:
${timelineSection}

AUTHORITATIVE GUIDELINE SOURCES:
Please reference current clinical practice guidelines from:
- ${guidelines.primary}
${guidelines.secondary.map(org => `- ${org}`).join('\n')}
- Recent peer-reviewed literature and clinical trial data

TASK: Based on my timeline, current treatment status, and evidence-based guidelines from the organizations listed above, suggest 5-7 critical questions I should ask my doctor to optimize my care and outcomes based on the aspects below:

1. Treatment timeline optimization - Are there ways to compress or improve the sequence?
2. Provider coverage - What happens if my doctor is unavailable during critical treatment phases?
3. Alternative therapies - Given my biomarkers and response, are there better treatment options?
4. Access strategies - Are there direct-pay or cash-pay options to access newer therapies faster?
5. Guideline alignment - Is my current care consistent with latest [specialty guideline organization] recommendations?
6. Quality of life - Are there supportive care options I should discuss?

Please provide specific, actionable questions tailored to my situation and grounded in current clinical evidence. Provide definitions in layman's terms what are big words or specialist-specific like drugs (e.g. Enhertu) or biomarkers (e.g. FGFR2) or other specialty terms.`;

  return prompt;
};
