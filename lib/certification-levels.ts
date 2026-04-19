export type CertificationLevelId = "naga" | "phayra-nak" | "singha" | "hanuman" | "garuda"

export interface CertificationLevel {
  id: CertificationLevelId
  number: number
  name: string
  creature: string
  icon: string
  duration: string
  requiresGym: boolean
  certFeeTHB: number
  assessmentFeeTHB: number
  minDaysAfterPrevious: number
  color: string
  bgGradient: string
  borderColor: string
  skills: string[]
}

export const CERTIFICATION_LEVELS: CertificationLevel[] = [
  {
    id: "naga",
    number: 1,
    name: "Naga",
    creature: "Serpent Deity",
    icon: "🐍",
    duration: "3 days",
    requiresGym: false,
    certFeeTHB: 2500,
    assessmentFeeTHB: 0,
    minDaysAfterPrevious: 0,
    color: "text-blue-400",
    bgGradient: "from-blue-500 to-blue-700",
    borderColor: "border-blue-500/30",
    skills: [
      "Basic Muay Thai stance (guard position)",
      "Jab and cross (mat wiang)",
      "Front kick (teep)",
      "Basic shin block",
      "Wai Kru knowledge and respect",
      "Basic pad work etiquette",
      "Understanding of Muay Thai history",
    ],
  },
  {
    id: "phayra-nak",
    number: 2,
    name: "Phayra Nak",
    creature: "Serpent King",
    icon: "🐉",
    duration: "1 week",
    requiresGym: true,
    certFeeTHB: 0,
    assessmentFeeTHB: 5000,
    minDaysAfterPrevious: 7,
    color: "text-emerald-400",
    bgGradient: "from-emerald-500 to-emerald-700",
    borderColor: "border-emerald-500/30",
    skills: [
      "3-strike combinations (jab-cross-kick)",
      "Footwork patterns (angles, pivots)",
      "Basic clinch entry and control",
      "Defensive counters (catch and return)",
      "Elbow strikes (sok tat, sok ti)",
      "Knee strikes from range (khao trong)",
      "Conditioning fundamentals (skipping, shadow boxing)",
    ],
  },
  {
    id: "singha",
    number: 3,
    name: "Singha",
    creature: "Mythical Lion",
    icon: "🦁",
    duration: "10 days",
    requiresGym: true,
    certFeeTHB: 0,
    assessmentFeeTHB: 8000,
    minDaysAfterPrevious: 14,
    color: "text-amber-400",
    bgGradient: "from-amber-500 to-amber-700",
    borderColor: "border-amber-500/30",
    skills: [
      "Advanced striking power (hip rotation, weight transfer)",
      "Clinch sweeps and dumps",
      "Sparring fundamentals (controlled contact)",
      "Fight strategy (distance management)",
      "Advanced knee techniques (khao khong, khao loi)",
      "Body kick defense and counter",
      "Mental fortitude under pressure",
      "Basic pad holding for partners",
    ],
  },
  {
    id: "hanuman",
    number: 4,
    name: "Hanuman",
    creature: "Divine Warrior",
    icon: "🐒",
    duration: "2 weeks",
    requiresGym: true,
    certFeeTHB: 0,
    assessmentFeeTHB: 12000,
    minDaysAfterPrevious: 30,
    color: "text-slate-300",
    bgGradient: "from-slate-400 to-slate-600",
    borderColor: "border-slate-500/30",
    skills: [
      "Advanced clinch transitions and sweeps",
      "Fight planning and ring strategy",
      "Full sparring (controlled)",
      "High-intensity conditioning circuits",
      "Elbow combinations in close range",
      "Advanced pad holding technique",
      "Competition readiness assessment",
      "Understanding of Muay Boran fundamentals",
      "Cornering and fight reading basics",
    ],
  },
  {
    id: "garuda",
    number: 5,
    name: "Garuda",
    creature: "Divine Eagle",
    icon: "🦅",
    duration: "1 month",
    requiresGym: true,
    certFeeTHB: 0,
    assessmentFeeTHB: 20000,
    minDaysAfterPrevious: 60,
    color: "text-yellow-400",
    bgGradient: "from-yellow-500 to-yellow-700",
    borderColor: "border-yellow-500/30",
    skills: [
      "Elite speed and precision striking",
      "Full sparring proficiency",
      "Advanced clinch mastery (all positions)",
      "Teaching demonstration (lead a drill)",
      "Spiritual and cultural connection to Muay Thai",
      "Muay Boran technique demonstration",
      "Mentorship — coach a beginner through basics",
      "Ram Muay performance",
      "Written knowledge assessment (history, rules, culture)",
      "Comprehensive physical assessment",
    ],
  },
]

export const LEVEL_IDS = CERTIFICATION_LEVELS.map((l) => l.id)

export function getLevelById(id: string): CertificationLevel | undefined {
  return CERTIFICATION_LEVELS.find((l) => l.id === id)
}

export function getLevelIndex(id: string): number {
  return LEVEL_IDS.indexOf(id as CertificationLevelId)
}

export function getPreviousLevel(id: string): CertificationLevel | undefined {
  const idx = getLevelIndex(id)
  return idx > 0 ? CERTIFICATION_LEVELS[idx - 1] : undefined
}
