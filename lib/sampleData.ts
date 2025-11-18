import { TimelineItem } from "@/app/page";

/**
 * Generate sample timeline data for demonstration purposes
 */
export const generateSampleData = (): TimelineItem[] => {
  return [
    {
      id: `sample-${Date.now()}-1`,
      name: "Initial Consultation",
      beginDate: new Date(2024, 0, 15), // Jan 15, 2024
      endDate: null, // Milestone event
      category: "Appointments",
    },
    {
      id: `sample-${Date.now()}-2`,
      name: "Diagnostic Tests",
      beginDate: new Date(2024, 0, 22), // Jan 22, 2024
      endDate: new Date(2024, 0, 26), // Jan 26, 2024
      category: "Tests",
    },
    {
      id: `sample-${Date.now()}-3`,
      name: "Treatment Planning",
      beginDate: new Date(2024, 1, 1), // Feb 1, 2024
      endDate: new Date(2024, 1, 5), // Feb 5, 2024
      category: "Planning",
    },
    {
      id: `sample-${Date.now()}-4`,
      name: "Chemotherapy Round 1",
      beginDate: new Date(2024, 1, 12), // Feb 12, 2024
      endDate: new Date(2024, 1, 16), // Feb 16, 2024
      category: "Treatment",
    },
    {
      id: `sample-${Date.now()}-5`,
      name: "Follow-up Appointment",
      beginDate: new Date(2024, 2, 1), // Mar 1, 2024
      endDate: null, // Milestone event
      category: "Appointments",
    },
    {
      id: `sample-${Date.now()}-6`,
      name: "Chemotherapy Round 2",
      beginDate: new Date(2024, 2, 10), // Mar 10, 2024
      endDate: new Date(2024, 2, 14), // Mar 14, 2024
      category: "Treatment",
    },
    {
      id: `sample-${Date.now()}-7`,
      name: "Progress Scan",
      beginDate: new Date(2024, 3, 5), // Apr 5, 2024
      endDate: null, // Milestone event
      category: "Tests",
    },
  ];
};
