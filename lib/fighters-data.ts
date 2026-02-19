export interface Fighter {
  id: number
  name: string
  nickname: string
  record: string
  status: "active" | "retired"
  bio: string
  image?: string
}

export const fighters: Fighter[] = [
  {
    id: 1,
    name: "Noa",
    nickname: "Chai Thai",
    record: "14-3-0",
    status: "active",
    bio: "Follow Noa 'Chai Thai', witness their rigorous preparations, and be part of the team's journey.",
    image: "/images/noah-profile.png",
  },
  {
    id: 2,
    name: "Fom",
    nickname: "I don't clean I win",
    record: "12-0-8",
    status: "active",
    bio: "Dedicated trainer and active fighter on the team with an impressive undefeated record.",
    image: "/images/fom-profile.png",
  },
  {
    id: 3,
    name: "Firest",
    nickname: "",
    record: "XX-XX-X",
    status: "retired",
    bio: "Retired fighter and dedicated trainer, continuing to pass on knowledge to the next generation.",
    image: "/images/firest-profile.png",
  },
  {
    id: 4,
    name: "Daoden",
    nickname: "",
    record: "XX-XX-X",
    status: "retired",
    bio: "Former fighter who competed at the highest levels, now retired from active competition.",
  },
  {
    id: 5,
    name: "Champ",
    nickname: "",
    record: "XX-XX-X",
    status: "retired",
    bio: "A true champion who has hung up the gloves but remains part of the Muay Thai Pai family.",
  },
  {
    id: 6,
    name: "James",
    nickname: "",
    record: "XX-XX-X",
    status: "retired",
    bio: "Experienced trainer and retired fighter who continues to share knowledge with students.",
    image: "/images/james-profile.png",
  },
  {
    id: 7,
    name: "Film",
    nickname: "",
    record: "XX-XX-X",
    status: "retired",
    bio: "Son of KRU WISARUT and lead trainer, carrying on the family tradition of Muay Thai excellence.",
    image: "/images/film-profile.png",
  },
]
