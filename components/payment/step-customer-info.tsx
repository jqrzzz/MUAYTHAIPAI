"use client"

import type React from "react"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SKILL_LEVELS } from "@/lib/booking-config"
import type { BookingDetails } from "./types"

interface StepCustomerInfoProps {
  bookingDetails: BookingDetails
  onBookingDetailsChange: (details: BookingDetails) => void
  onSubmit: () => void
}

export function StepCustomerInfo({ bookingDetails, onBookingDetailsChange, onSubmit }: StepCustomerInfoProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bookingDetails.name && bookingDetails.email) {
      onSubmit()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={bookingDetails.name}
              onChange={(e) => onBookingDetailsChange({ ...bookingDetails, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={bookingDetails.email}
              onChange={(e) => onBookingDetailsChange({ ...bookingDetails, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="skillLevel">Select Your Skill Level</Label>
            <Select
              value={bookingDetails.skillLevel}
              onValueChange={(value) => onBookingDetailsChange({ ...bookingDetails, skillLevel: value })}
            >
              <SelectTrigger id="skillLevel">
                <SelectValue placeholder="Choose your experience level" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
