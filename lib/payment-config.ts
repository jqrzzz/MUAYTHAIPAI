// Payment configuration for Muay Thai Pai
export const PAYMENT_CONFIG = {
  currency: "THB",
  locale: "th-TH",
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    processingFeePercent: 0.029,
    processingFeeFixedUsd: 0.30,
  },
  platform: {
    commissionRate: 0.15,
    gymSubscriptionThb: 999,
    gymSubscriptionUsd: 29,
    trialDays: 30,
  },
  subscription: {
    studentMonthly: 299,
  },
  services: {
    groupSession: 330,
    privateLessonBeginner: 600,
    privateLessonAdvanced: 900,
    gymMembership: 7700,
    muayThaiKids: 500,
  },
  certification: {
    nagaCertFee: 2500,
  },
} as const

export function estimateStripeFee(amountUsd: number): number {
  return Math.round((amountUsd * PAYMENT_CONFIG.stripe.processingFeePercent + PAYMENT_CONFIG.stripe.processingFeeFixedUsd) * 100) / 100
}

// Format price in Thai Baht
export function formatPrice(amount: number): string {
  if (amount === 0) return "Free"
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount)
}

// Exchange rate: 30 THB = 1 USD (includes buffer for Stripe fees and exchange fluctuations)
export const THB_TO_USD_RATE = 30

// Convert THB price to USD cents for Stripe processing
export function convertThbToUsd(thbAmount: number): number {
  return Math.round((thbAmount / THB_TO_USD_RATE) * 100) // USD in cents
}

// Convert USD cents back to THB for display
export function convertUsdToThb(usdCents: number): number {
  return Math.round((usdCents / 100) * THB_TO_USD_RATE)
}

// Format USD amount from cents for display
export function formatUsdAmount(usdCents: number): string {
  return `$${(usdCents / 100).toFixed(2)}`
}

// Get both currency displays for payment confirmation
export function getPaymentSummary(thbAmount: number): {
  thb: string
  usd: string
  usdCents: number
  exchangeRate: string
} {
  const usdCents = convertThbToUsd(thbAmount)
  return {
    thb: `฿${thbAmount.toLocaleString()}`,
    usd: formatUsdAmount(usdCents),
    usdCents,
    exchangeRate: `${THB_TO_USD_RATE} THB = 1 USD`,
  }
}
