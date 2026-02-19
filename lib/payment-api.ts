export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  currency: string
}

export class PaymentAPI {
  // Create Stripe Payment Intent
  static async createStripePayment(amount: number, currency = "thb"): Promise<PaymentIntent | null> {
    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount * 100, currency }), // Stripe uses cents
      })

      if (!response.ok) throw new Error("Payment creation failed")

      return await response.json()
    } catch (error) {
      console.error("Stripe payment error:", error)
      return null
    }
  }

  // Get payment methods for a service
  static getPaymentMethods(): Array<{
    id: string
    name: string
    description: string
    fee: string
    recommended?: boolean
  }> {
    const methods = []

    // Bank Transfer (recommended for Thai customers)
    methods.push({
      id: "bank_transfer",
      name: "Bank Transfer",
      description: "Direct transfer to our Thai bank account",
      fee: "Free",
      recommended: true,
    })

    // Cash at gym
    methods.push({
      id: "cash",
      name: "Cash at Gym",
      description: "Pay when you arrive for training",
      fee: "Free",
    })

    // Stripe (for international customers)
    methods.push({
      id: "stripe",
      name: "Credit/Debit Card",
      description: "International cards accepted",
      fee: "2.9% + ฿10",
    })

    return methods
  }
}
