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
 * Returns null if no entries are provided
 */
const generateTimelineSection = (entries: TimelineItem[]): string | null => {
  if (!entries || entries.length === 0) {
    return null;
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
      timelineText += `- ${beginDate}: ${entry.name} (${entry.category}) [Ended: ${endDate}]`;
    } else {
      timelineText += `- ${beginDate}: ${entry.name} (${entry.category})`;
    }

    // Include note if present
    if (entry.note) {
      timelineText += ` - Note: "${entry.note}"`;
    }

    timelineText += "\n";
  });

  return timelineText.trim();
};

/**
 * Generate the complete prompt for doctor questions
 * Works with patient info alone, but incorporates timeline if available
 */
export const generateDoctorQuestionsPrompt = (
  context: PatientContext,
  timelineEntries?: TimelineItem[]
): string => {
  const today = new Date();
  const lastUpdated = formatDate(today);

  // Get relevant guideline organizations for the specialty
  const guidelines = getGuidelineOrganizations(context.specialty);

  // Generate timeline section if entries exist
  const timelineSection = timelineEntries ? generateTimelineSection(timelineEntries) : null;
  const hasTimeline = timelineSection !== null;

  // Build the prompt based on available data
  let prompt = `Act like an expert doctor specializing in ${context.condition} - ${context.specialty}.

PATIENT BACKGROUND:
- Primary condition: ${context.condition || "Not specified"}
- Current status: ${context.stageStatus || "Not specified"}
- Active treatment: ${context.currentTreatment || "Not specified"}
- Treatment response: ${context.treatmentResult || "Not specified"}
- Key biomarkers: ${context.keyBiomarkers || "Not specified"}
- Additional context: ${context.additionalInfo || "Not specified"}
- Information last updated: ${lastUpdated}`;

  // Add timeline section if available
  if (hasTimeline) {
    prompt += `

COMPLETE TREATMENT TIMELINE:
${timelineSection}`;
  }

  prompt += `

AUTHORITATIVE GUIDELINE SOURCES:
Please reference current clinical practice guidelines from:
- ${guidelines.primary}
${guidelines.secondary.map(org => `- ${org}`).join('\n')}
- Recent peer-reviewed literature and clinical trial data

TASK: Based on my ${hasTimeline ? 'timeline, ' : ''}current treatment status, and evidence-based guidelines from the organizations listed above, suggest 5-7 critical questions I should ask my doctor to optimize my care and outcomes based on the aspects below:

1. Treatment ${hasTimeline ? 'timeline ' : ''}optimization - Are there ways to ${hasTimeline ? 'compress or improve the sequence' : 'optimize my current treatment plan'}?
2. Provider coverage - What happens if my doctor is unavailable during critical treatment phases?
3. Alternative therapies - Given my biomarkers and response, are there better treatment options?
4. Access strategies - Are there direct-pay or cash-pay options to access newer therapies faster?
5. Guideline alignment - Is my current care consistent with latest [specialty guideline organization] recommendations?
6. Quality of life - Are there supportive care options I should discuss?`;

  if (hasTimeline) {
    prompt += `
7. Timeline concerns - Based on my treatment history, are there any gaps or delays that should be addressed?`;
  }

  prompt += `

Please provide specific, actionable questions tailored to my situation and grounded in current clinical evidence. Provide definitions in layman's terms what are big words or specialist-specific like drugs (e.g. Enhertu) or biomarkers (e.g. FGFR2) or other specialty terms.`;

  return prompt;
};
