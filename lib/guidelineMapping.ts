/**
 * Mapping of medical specialties to their authoritative guideline organizations
 */

export interface GuidelineOrganizations {
  primary: string;
  secondary: string[];
}

export const GUIDELINE_MAPPING: Record<string, GuidelineOrganizations> = {
  Oncology: {
    primary: "NCCN (National Comprehensive Cancer Network)",
    secondary: [
      "ASCO (American Society of Clinical Oncology)",
      "ESMO (European Society for Medical Oncology)",
    ],
  },
  Cardiology: {
    primary: "ACC/AHA (American College of Cardiology/American Heart Association)",
    secondary: [
      "ESC (European Society of Cardiology)",
      "CHEST guidelines for specific conditions",
    ],
  },
  Endocrinology: {
    primary: "ADA (American Diabetes Association)",
    secondary: [
      "Endocrine Society",
      "AACE (American Association of Clinical Endocrinologists)",
    ],
  },
  Neurology: {
    primary: "AAN (American Academy of Neurology)",
    secondary: [
      "EAN (European Academy of Neurology)",
      "Cochrane Neurology reviews",
    ],
  },
  Rheumatology: {
    primary: "ACR (American College of Rheumatology)",
    secondary: [
      "EULAR (European League Against Rheumatism)",
      "BSR (British Society for Rheumatology)",
    ],
  },
  Gastroenterology: {
    primary: "ACG (American College of Gastroenterology)",
    secondary: [
      "AGA (American Gastroenterological Association)",
      "ASGE (American Society for Gastrointestinal Endoscopy)",
    ],
  },
  Pulmonology: {
    primary: "ATS (American Thoracic Society)",
    secondary: [
      "CHEST (American College of Chest Physicians)",
      "ERS (European Respiratory Society)",
    ],
  },
  Nephrology: {
    primary: "KDIGO (Kidney Disease: Improving Global Outcomes)",
    secondary: [
      "NKF (National Kidney Foundation)",
      "ASN (American Society of Nephrology)",
    ],
  },
  Hematology: {
    primary: "ASH (American Society of Hematology)",
    secondary: [
      "NCCN for hematologic malignancies",
      "EHA (European Hematology Association)",
    ],
  },
  Immunology: {
    primary: "AAAAI (American Academy of Allergy, Asthma & Immunology)",
    secondary: [
      "ACAAI (American College of Allergy, Asthma & Immunology)",
      "EAACI (European Academy of Allergy and Clinical Immunology)",
    ],
  },
  Other: {
    primary: "Relevant specialty-specific guidelines",
    secondary: [
      "UpToDate clinical guidelines",
      "Cochrane systematic reviews",
    ],
  },
};

/**
 * Get guideline organizations for a specialty
 */
export const getGuidelineOrganizations = (specialty: string): GuidelineOrganizations => {
  return GUIDELINE_MAPPING[specialty] || GUIDELINE_MAPPING.Other;
};
