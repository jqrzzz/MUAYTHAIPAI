// Payment flow shared types

export interface BookingDetails {
  name: string
  email: string
  date: string
  time: string
  skillLevel: string
  referralSource: string
}

export interface ServiceDetails {
  id: string
  name: string
  price: number
  duration: string
  description: string
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  receiptUrl?: string
  error?: string
}

export type PaymentStep = "details" | "calendar" | "payment" | "success"

export type PaymentMethod = "card" | "apple-pay" | "cash" | null

export interface PaymentFlowProps {
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDuration: string
  serviceDescription: string
  onClose: () => void
}
