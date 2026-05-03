export const FAQ_CATEGORY_VALUES = [
  "pricing",
  "schedule",
  "location",
  "training",
  "booking",
  "accommodation",
  "certification",
  "general",
] as const

export type FaqCategory = (typeof FAQ_CATEGORY_VALUES)[number]

const LABELS: Record<FaqCategory, string> = {
  pricing: "Pricing",
  schedule: "Schedule",
  location: "Location",
  training: "Training",
  booking: "Booking",
  accommodation: "Accommodation",
  certification: "Certification",
  general: "General",
}

export const FAQ_CATEGORIES = FAQ_CATEGORY_VALUES.map((value) => ({
  value,
  label: LABELS[value],
}))
