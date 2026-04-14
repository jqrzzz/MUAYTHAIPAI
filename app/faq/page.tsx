import type { Metadata } from "next"
import FAQClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "Do I need experience to train at Muay Thai Pai?",
        answer:
          "Not at all! We welcome complete beginners. The Wisarut Family has been teaching traditional Muay Thai for generations and specializes in helping newcomers learn proper technique from the ground up.",
      },
      {
        question: "What should I bring for my first class?",
        answer:
          "Just bring comfortable workout clothes, a water bottle, and an open mind! We provide all equipment including gloves, pads, and protective gear.",
      },
      {
        question: "How do I book classes or training sessions?",
        answer:
          "You can book directly through our website, visit us in person at our gym in Pai, or contact us via WhatsApp or Facebook.",
      },
    ],
  },
  {
    category: "Training Programs",
    questions: [
      {
        question: "What types of training do you offer?",
        answer:
          "We offer group classes, private lessons, intensive training camps, certificate programs, and long-term apprenticeships.",
      },
      {
        question: "How long are the certificate programs?",
        answer:
          "Our certificate programs range from 1-month intensive courses to 6-month comprehensive programs. Each level builds upon the previous.",
      },
      {
        question: "Can I train if I'm only visiting Pai for a short time?",
        answer:
          "We offer drop-in classes and short-term packages perfect for travelers. Even a few sessions will give you authentic insight into traditional Muay Thai.",
      },
    ],
  },
  {
    category: "Pricing & Packages",
    questions: [
      {
        question: "How much do classes cost?",
        answer:
          "Group classes start from 300 THB per session. Private lessons are 800-1,200 THB depending on duration. We offer package deals for multiple sessions.",
      },
      {
        question: "Do you offer student discounts or long-term rates?",
        answer:
          "Yes! We offer significant discounts for monthly packages, certificate program enrollments, and students staying longer than 2 weeks.",
      },
    ],
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.flatMap((section) =>
    section.questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  ),
}

export const metadata: Metadata = {
  title: "FAQ | Muay Thai Pai",
  description:
    "Frequently asked questions about Muay Thai Pai. Training programs, pricing, visas, accommodation, and everything you need to know about training in Pai, Thailand.",
  keywords: ["Muay Thai FAQ", "Pai Thailand training questions", "Muay Thai visa questions", "Training costs Thailand"],
  openGraph: {
    title: "FAQ | Muay Thai Pai",
    description:
      "Frequently asked questions about Muay Thai Pai. Training programs, pricing, visas, accommodation, and everything you need to know about training in Pai, Thailand.",
    url: "https://muaythaipai.com/faq",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "FAQ", url: "https://muaythaipai.com/faq" },
        ]}
      />
      <FAQClient />
    </>
  )
}
