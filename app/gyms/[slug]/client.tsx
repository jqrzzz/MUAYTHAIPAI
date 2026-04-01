"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Phone, Mail, Globe, Instagram, Clock, Dumbbell, BadgeCheck, MessageCircle } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface GymPageClientProps {
  gym: {
    id: string
    name: string
    slug: string
    description: string | null
    city: string | null
    province: string | null
    address: string | null
    phone: string | null
    email: string | null
    whatsapp: string | null
    website: string | null
    instagram: string | null
    logo_url: string | null
    cover_image_url: string | null
    verified: boolean
  }
  services: {
    id: string
    name: string
    description: string | null
    category: string
    price_thb: number
    duration_minutes: number | null
    duration_days: number | null
    is_featured: boolean
  }[]
  trainers: {
    id: string
    display_name: string
    title: string | null
    bio: string | null
    photo_url: string | null
    specialties: string[] | null
    years_experience: number | null
  }[]
  settings: {
    operating_hours: Record<string, { open: string; close: string }> | null
    show_prices: boolean
  } | null
  user: SupabaseUser | null
}

const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
}
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function GymPageClient({ gym, services, trainers, settings, user }: GymPageClientProps) {
  const showPrices = settings?.show_prices !== false
  const operatingHours = settings?.operating_hours
  // Group services by category
  const trainingServices = services.filter((s) => s.category === "training")
  const certificateServices = services.filter((s) => s.category === "certificate")
  const otherServices = services.filter((s) => s.category !== "training" && s.category !== "certificate")

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={user ? "/student" : "/"}
            className="inline-flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {user ? "Back to Dashboard" : "Back"}
          </Link>
          {!user && (
            <Link href="/student/login">
              <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 bg-transparent">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Gym Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0">
              {gym.logo_url ? (
                <img src={gym.logo_url || "/placeholder.svg"} alt={gym.name} className="w-12 h-12 object-contain" />
              ) : (
                <Dumbbell className="w-8 h-8 text-neutral-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {gym.name}
                {gym.verified && <BadgeCheck className="h-5 w-5 text-blue-400" />}
              </h1>
              <p className="text-neutral-400 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {gym.city}
                {gym.province && `, ${gym.province}`}
              </p>
            </div>
          </div>

          {gym.description && <p className="text-neutral-400 text-sm leading-relaxed">{gym.description}</p>}

          {/* Contact Links */}
          <div className="flex flex-wrap gap-3 mt-4">
            {gym.phone && (
              <a
                href={`tel:${gym.phone}`}
                className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
              >
                <Phone className="w-4 h-4" />
                {gym.phone}
              </a>
            )}
            {gym.email && (
              <a
                href={`mailto:${gym.email}`}
                className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
              >
                <Mail className="w-4 h-4" />
                {gym.email}
              </a>
            )}
            {gym.instagram && (
              <a
                href={`https://instagram.com/${gym.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
              >
                <Instagram className="w-4 h-4" />@{gym.instagram}
              </a>
            )}
            {gym.whatsapp && (
              <a
                href={`https://wa.me/${gym.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}
            {gym.website && (
              <a
                href={gym.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
              >
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
          </div>

          {/* Operating Hours */}
          {operatingHours && Object.keys(operatingHours).length > 0 && (
            <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-1.5 mb-3">
                <Clock className="w-4 h-4 text-neutral-400" />
                Operating Hours
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAYS.map((day) => {
                  const h = operatingHours[day]
                  return (
                    <div key={day} className="text-xs">
                      <span className="font-medium text-neutral-300">{DAY_LABELS[day]}</span>{" "}
                      {h ? (
                        <span className="text-neutral-500">{h.open}–{h.close}</span>
                      ) : (
                        <span className="text-neutral-600">Closed</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Training Services */}
        {trainingServices.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Training</h2>
            <div className="grid gap-3">
              {trainingServices.map((service) => (
                <Card key={service.id} className="bg-neutral-900/50 border-neutral-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{service.name}</h3>
                          {service.is_featured && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Popular</Badge>
                          )}
                        </div>
                        {service.description && <p className="text-sm text-neutral-500 mt-1">{service.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                          {service.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                      {showPrices && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-400">฿{service.price_thb.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Certificate Programs */}
        {certificateServices.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Certificate Programs</h2>
            <div className="grid gap-3">
              {certificateServices.map((service) => (
                <Card key={service.id} className="bg-neutral-900/50 border-neutral-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{service.name}</h3>
                        {service.description && <p className="text-sm text-neutral-500 mt-1">{service.description}</p>}
                        {service.duration_days && (
                          <p className="text-xs text-neutral-500 mt-2">{service.duration_days} day program</p>
                        )}
                      </div>
                      {showPrices && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-400">฿{service.price_thb.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Trainers */}
        {trainers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Trainers</h2>
            <div className="grid gap-3">
              {trainers.map((trainer) => (
                <Card key={trainer.id} className="bg-neutral-900/50 border-neutral-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0">
                        {trainer.photo_url ? (
                          <img
                            src={trainer.photo_url || "/placeholder.svg"}
                            alt={trainer.display_name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <Dumbbell className="w-6 h-6 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{trainer.display_name}</h3>
                        {trainer.title && <p className="text-sm text-orange-400">{trainer.title}</p>}
                        {trainer.years_experience && (
                          <p className="text-xs text-neutral-500 mt-1">{trainer.years_experience} years experience</p>
                        )}
                        {trainer.specialties && trainer.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {trainer.specialties.slice(0, 3).map((spec) => (
                              <Badge
                                key={spec}
                                variant="outline"
                                className="text-xs border-neutral-700 text-neutral-400"
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <Card className="bg-orange-600/20 border-orange-500/30">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Train?</h3>
            <p className="text-neutral-400 text-sm mb-4">Book a session at {gym.name}</p>
            <Link href={`/train-and-stay?gym=${gym.slug}`}>
              <Button className="bg-orange-600 hover:bg-orange-500">Book Now</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
