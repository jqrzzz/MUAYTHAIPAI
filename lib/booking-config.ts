import { PAYMENT_CONFIG } from "./payment-config"

// Time slot configurations by service type
export const TIME_SLOTS = {
  groupSession: ["08:00", "15:00"],
  privateLesson: ["07:00", "10:00", "11:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
  default: ["07:00", "10:00", "11:00", "12:00", "13:00", "14:00", "17:00", "18:00"],
} as const

// Skill level options
export const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner (new to Muay Thai)" },
  { value: "some-experience", label: "Some Experience (have trained before)" },
  { value: "experienced", label: "Experienced (have trained and fought before)" },
] as const

// Private lesson type definitions
export const PRIVATE_LESSON_TYPES = [
  {
    id: "beginner" as const,
    name: "Fundamentals & Technique",
    basePrice: PAYMENT_CONFIG.services.privateLessonBeginner,
    description:
      "Sharpen your form, footwork, and combos in an engaging, skill-focused session — perfect for those building solid foundations and enjoying the art.",
  },
  {
    id: "advanced" as const,
    name: "Power & Advanced Technique",
    basePrice: PAYMENT_CONFIG.services.privateLessonAdvanced,
    description:
      "For the dedicated and resilient — intense pad work, clinching, and endurance drills designed to push strength and skill to the next level.",
  },
] as const

// Service category definitions
export const SERVICE_CATEGORIES = {
  training: ["group-session", "private-lesson", "gym-membership", "muay-thai-kids", "online-training"],
  certificates: ["path-naga", "path-phayra-nak", "ratchasi", "hanuman", "garuda"],
} as const

// All available booking services
export const BOOKING_SERVICES = [
  // Training Services
  {
    id: "group-session",
    name: "Group Session",
    description: "Join a dynamic group training session.",
    price: PAYMENT_CONFIG.services.groupSession,
    duration: "1.5 Hours",
    category: "training" as const,
    hasCalendly: true,
    calendlyEventUrl: "group-session",
  },
  {
    id: "private-lesson",
    name: "Private Lesson",
    description: "Personalized coaching tailored to your skill level.",
    price: PAYMENT_CONFIG.services.privateLessonBeginner,
    duration: "1 Hour",
    category: "training" as const,
    hasCalendly: true,
    calendlyEventUrl: "private-lesson",
  },
  {
    id: "gym-membership",
    name: "Gym Membership",
    description: "Access to our state-of-the-art training facilities.",
    price: PAYMENT_CONFIG.services.gymMembership,
    duration: "1 Month",
    category: "training" as const,
  },
  {
    id: "muay-thai-kids",
    name: "Muay Thai For Kids",
    description:
      "Fun and disciplined training for young martial artists. Bring additional kids @300 THB each and make your mini private kids session.",
    price: PAYMENT_CONFIG.services.muayThaiKids,
    duration: "1 Hour",
    category: "training" as const,
    hasCalendly: true,
    calendlyEventUrl: "kids-class",
  },
  {
    id: "online-training",
    name: "Online Training",
    description:
      "Train from anywhere with our virtual coaching sessions. Access to our online training system upon payment.",
    price: PAYMENT_CONFIG.services.onlineTraining,
    duration: "/ month",
    category: "training" as const,
  },
  // Certificate Programs
  {
    id: "path-naga",
    name: "Naga",
    description:
      "This introductory level lays the groundwork for your Muay Thai journey, focusing on essential techniques, stance, and footwork.",
    price: PAYMENT_CONFIG.services.naga,
    duration: "3 Days",
    category: "certificates" as const,
    hasCalendly: true,
    calendlyEventUrl: "certificate-naga",
  },
  {
    id: "path-phayra-nak",
    name: "Phayra Nak",
    description:
      "Building on foundational skills, this intermediate course intensifies training with advanced combinations and clinching techniques.",
    price: PAYMENT_CONFIG.services.phayaNak,
    duration: "5 Days",
    category: "certificates" as const,
    hasCalendly: true,
    calendlyEventUrl: "certificate-phayanak",
  },
  {
    id: "ratchasi",
    name: "Ratchasi",
    description:
      "This advanced level delves deeper into fight strategy, technical refinement, and peak physical conditioning.",
    price: PAYMENT_CONFIG.services.ratchasi,
    duration: "10 Days",
    category: "certificates" as const,
    hasCalendly: true,
    calendlyEventUrl: "certificate-ratchasi",
  },
  {
    id: "hanuman",
    name: "Hanuman",
    description:
      "For serious practitioners aiming for mastery, combining technical excellence with mental discipline and recovery strategies.",
    price: PAYMENT_CONFIG.services.hanuman,
    duration: "1 Month",
    category: "certificates" as const,
    hasCalendly: true,
    calendlyEventUrl: "certificate-hanuman",
  },
  {
    id: "garuda",
    name: "Garuda",
    description:
      "The pinnacle of our program, reserved for those dedicated to becoming true champions and ambassadors of Muay Thai.",
    price: PAYMENT_CONFIG.services.garuda,
    duration: "2 Months",
    category: "certificates" as const,
    hasCalendly: true,
    calendlyEventUrl: "certificate-garuda",
  },
] as const

// Helper functions
export function getServiceById(id: string) {
  return BOOKING_SERVICES.find((service) => service.id === id)
}

export function getServicesByCategory(category: "training" | "certificates") {
  return BOOKING_SERVICES.filter((service) => service.category === category)
}

export function getTimeSlotsForService(serviceName: string): string[] {
  if (serviceName.toLowerCase().includes("group session")) {
    return TIME_SLOTS.groupSession
  } else if (serviceName.toLowerCase().includes("private") || serviceName.toLowerCase().includes("kids")) {
    return TIME_SLOTS.privateLesson
  }
  return TIME_SLOTS.default
}

export function shouldShowTimeSlots(serviceName: string): boolean {
  return !serviceName.toLowerCase().includes("membership")
}
