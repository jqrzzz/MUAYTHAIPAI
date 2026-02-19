// Stripe configuration and utilities
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  secretKey: process.env.STRIPE_SECRET_KEY || "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  currency: "thb",
  country: "TH",
} as const

// Validate Stripe configuration
export function validateStripeConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!STRIPE_CONFIG.publishableKey) {
    errors.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing")
  }

  if (!STRIPE_CONFIG.secretKey) {
    errors.push("STRIPE_SECRET_KEY is missing")
  }

  if (!STRIPE_CONFIG.publishableKey.startsWith("pk_")) {
    errors.push("Invalid publishable key format")
  }

  if (!STRIPE_CONFIG.secretKey.startsWith("sk_")) {
    errors.push("Invalid secret key format")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Format amount for Stripe (convert to cents)
export function formatAmountForStripe(amount: number, currency = "thb"): number {
  // Thai Baht doesn't use cents, so we don't multiply by 100
  if (currency.toLowerCase() === "thb") {
    return Math.round(amount)
  }
  // For other currencies that use cents
  return Math.round(amount * 100)
}

// Format amount for display
export function formatAmountFromStripe(amount: number, currency = "thb"): number {
  if (currency.toLowerCase() === "thb") {
    return amount
  }
  return amount / 100
}
