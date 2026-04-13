export interface FamilyMember {
  id: number
  name: string
  role: string
  description: string
  image?: string
}

export const familyMembers: FamilyMember[] = [
  {
    id: 1,
    name: "KRU WISARUT",
    role: "Grandpa & Gym Leader",
    description: "Third-generation master and leader of Muay Thai Pai.",
    image: "/images/wisarut-profile.png",
  },
  {
    id: 2,
    name: "MAMA",
    role: "Grandma & Chef",
    description: "Heart of the family, known for amazing cooking.",
    image: "/images/mama-profile.jpeg",
  },
  {
    id: 3,
    name: "KRU FILM",
    role: "Son & Lead Trainer",
    description: "Lead trainer carrying on the family tradition.",
    image: "/images/film-profile.png",
  },
  {
    id: 4,
    name: "KRU MOEY",
    role: "Granddaughter & Student",
    description: "Young fighter learning the art of Muay Thai.",
    image: "/images/moey-profile.jpeg",
  },
  {
    id: 5,
    name: "TUNGUEN",
    role: "Family Dog & Customer Service",
    description: "Beloved family companion and gym mascot, always ready to greet visitors.",
    image: "/images/tunguen-profile.png",
  },
  {
    id: 6,
    name: "FIREST",
    role: "Son & Trainer",
    description: "Dedicated trainer and family member.",
    image: "/images/firest-profile.png",
  },
  {
    id: 7,
    name: "BAIFERN",
    role: "Granddaughter & Student",
    description: "Part of the next generation of fighters, learning traditional techniques.",
  },
  {
    id: 8,
    name: "YUNIF",
    role: "Granddaughter & Student",
    description: "Learning traditional Muay Thai techniques.",
    image: "/images/yunif-profile.png",
  },
  { id: 9, name: "STARFOX", role: "Gym Dog", description: "Loyal gym companion and training partner." },
  {
    id: 10,
    name: "KRU NOAH",
    role: "Trainer & Fighter",
    description: "Skilled trainer and active competitor.",
    image: "/images/noah-profile.png",
  },
  {
    id: 11,
    name: "KRU JAMES",
    role: "Trainer & Fighter",
    description: "Experienced trainer and active fighter sharing knowledge.",
    image: "/images/james-profile.png",
  },
  {
    id: 12,
    name: "KRU FOM",
    role: "Trainer & Fighter",
    description: "Dedicated trainer and active fighter on the team.",
    image: "/images/fom-profile.png",
  },
]
