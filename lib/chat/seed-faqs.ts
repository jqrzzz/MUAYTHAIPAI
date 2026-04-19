/**
 * Canonical seed FAQs for the gym_faqs table.
 *
 * Source of truth: the public-facing FAQ page at `/faq`. When the
 * website FAQ changes, update this file too — the seed endpoint inserts
 * only rows that don't already exist (matched by question string), so
 * re-running is safe and just fills in what's missing.
 *
 * Category values map to the FAQ_CATEGORIES enum used in the admin
 * Train OckOck tab: pricing, schedule, location, training, booking,
 * general.
 */

export type SeedFAQ = {
  question: string
  answer: string
  category: "pricing" | "schedule" | "location" | "training" | "booking" | "general"
}

export const SEED_FAQS: SeedFAQ[] = [
  // Getting Started → general / booking
  {
    question: "Do I need experience to train at Muay Thai Pai?",
    answer:
      "Not at all! We welcome complete beginners. The Wisarut Family has been teaching traditional Muay Thai for generations and specializes in helping newcomers learn proper technique from the ground up.",
    category: "general",
  },
  {
    question: "What should I bring for my first class?",
    answer:
      "Just bring comfortable workout clothes, a water bottle, and an open mind! We provide all equipment including gloves, pads, and protective gear.",
    category: "general",
  },
  {
    question: "How do I book classes or training sessions?",
    answer:
      "You can book directly through our website, visit us in person at our gym in Pai, or contact us via WhatsApp or Facebook.",
    category: "booking",
  },

  // Training Programs → training
  {
    question: "What types of training do you offer?",
    answer:
      "We offer group classes, private lessons, intensive training camps, certificate programs, and long-term apprenticeships.",
    category: "training",
  },
  {
    question: "How long are the certificate programs?",
    answer:
      "Our certificate programs range from 1-month intensive courses to 6-month comprehensive programs. Each level builds upon the previous.",
    category: "training",
  },
  {
    question: "Can I train if I'm only visiting Pai for a short time?",
    answer:
      "We offer drop-in classes and short-term packages perfect for travelers. Even a few sessions will give you authentic insight into traditional Muay Thai.",
    category: "training",
  },

  // Location & Logistics → location
  {
    question: "Where exactly is Muay Thai Pai located?",
    answer:
      "We're located in the heart of Pai, Mae Hong Son Province, Northern Thailand. Pai is a beautiful mountain town about 3 hours from Chiang Mai.",
    category: "location",
  },
  {
    question: "How do I get to Pai from Bangkok or Chiang Mai?",
    answer:
      "From Bangkok: Fly to Chiang Mai (1.5 hours), then take a bus or private transport to Pai (3 hours). From Chiang Mai: Direct bus service runs multiple times daily.",
    category: "location",
  },
  {
    question: "Do you offer accommodation recommendations?",
    answer:
      "Yes! We partner with several local guesthouses and hostels. We can recommend budget-friendly options or private accommodations.",
    category: "location",
  },

  // Pricing & Packages → pricing
  {
    question: "How much do classes cost?",
    answer:
      "Group classes start from 300 THB per session. Private lessons are 800-1,200 THB depending on duration. We offer package deals for multiple sessions.",
    category: "pricing",
  },
  {
    question: "Do you offer student discounts or long-term rates?",
    answer:
      "Yes! We offer significant discounts for monthly packages, certificate program enrollments, and students staying longer than 2 weeks.",
    category: "pricing",
  },
  {
    question: "What's included in the training packages?",
    answer:
      "All packages include equipment use, traditional Muay Thai instruction, cultural education, and access to our gym facilities.",
    category: "pricing",
  },

  // Visas & Legal → general (no dedicated visa category in the enum)
  {
    question: "Can I get an education visa to train Muay Thai?",
    answer:
      "Yes! We're authorized to provide education visas (ED visa) for our certificate programs. This allows you to stay in Thailand legally for extended training periods.",
    category: "general",
  },
  {
    question: "What visa do I need for short-term training?",
    answer:
      "For training under 30 days, most nationalities can use a tourist visa or visa exemption. For longer stays, we recommend our education visa program.",
    category: "general",
  },
  {
    question: "Do you help with visa applications and renewals?",
    answer:
      "We have experience helping international students with visa applications, renewals, and extensions. Our team can guide you through the requirements.",
    category: "general",
  },

  // Training Schedule → schedule
  {
    question: "What are your training hours?",
    answer:
      "We typically train Monday-Saturday, 7:00 AM - 6:00 PM. Morning sessions (7-9 AM) focus on technique and conditioning. Afternoon sessions (4-6 PM) include pad work and sparring.",
    category: "schedule",
  },
  {
    question: "How many times per week should I train?",
    answer:
      "For beginners, we recommend 3-4 sessions per week. Intermediate students often train 4-5 times weekly. Advanced students may train daily.",
    category: "schedule",
  },
  {
    question: "Do you train during Thai holidays?",
    answer:
      "We observe major Thai holidays like Songkran (April) and New Year, but generally maintain regular schedules. We'll always inform students of any schedule changes.",
    category: "schedule",
  },
]
