import type { Metadata } from "next"
import { ClientPage } from "./client"

export const metadata: Metadata = {
  title: "Muay Thai Pai | Traditional Thai Boxing Training in Pai, Thailand",
  description:
    "Train authentic Muay Thai with Kru Wisarut at Muay Thai Pai. Third-generation family gym featured in National Geographic. Traditional training, accommodation, and certification programs in Pai, Thailand.",
  keywords:
    "muay thai pai, thai boxing pai, muay thai thailand, traditional muay thai, kru wisarut, muay thai training, pai thailand gym, authentic muay thai",
  openGraph: {
    title: "Muay Thai Pai | Traditional Thai Boxing Training in Pai, Thailand",
    description:
      "Train authentic Muay Thai with Kru Wisarut at Muay Thai Pai. Third-generation family gym featured in National Geographic.",
    url: "https://muaythaipai.com",
    siteName: "Muay Thai Pai",
    images: [
      {
        url: "/images/pai-hero-main.jpeg",
        width: 1200,
        height: 630,
        alt: "Muay Thai Pai - Traditional Thai Boxing Gym",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muay Thai Pai | Traditional Thai Boxing Training",
    description: "Train authentic Muay Thai with Kru Wisarut in Pai, Thailand. Featured in National Geographic.",
  },
}

export default function Page() {
  return <ClientPage />
}
