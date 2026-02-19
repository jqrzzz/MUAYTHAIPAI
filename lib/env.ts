/**
 * Environment variable validation and typed access
 * Provides runtime validation and type-safe access to environment variables
 */

// Server-side required environment variables
const SERVER_ENV_KEYS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "RESEND_API_KEY"] as const

// Server-side optional environment variables
const SERVER_OPTIONAL_ENV_KEYS = ["STAFF_NOTIFICATION_EMAIL"] as const

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
const CLIENT_ENV_KEYS = ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] as const

type ServerEnvKey = (typeof SERVER_ENV_KEYS)[number]
type ServerOptionalEnvKey = (typeof SERVER_OPTIONAL_ENV_KEYS)[number]
type ClientEnvKey = (typeof CLIENT_ENV_KEYS)[number]

interface ValidationResult {
  valid: boolean
  missing: string[]
  present: string[]
}

/**
 * Validates that all required server environment variables are present
 * Call this at server startup to fail fast on misconfiguration
 */
export function validateServerEnv(): ValidationResult {
  const missing: string[] = []
  const present: string[] = []

  for (const key of SERVER_ENV_KEYS) {
    if (process.env[key]) {
      present.push(key)
    } else {
      missing.push(key)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  }
}

/**
 * Gets a required server environment variable
 * Throws if the variable is not set
 */
export function getServerEnv(key: ServerEnvKey): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Gets an optional server environment variable with a fallback
 */
export function getOptionalEnv(key: ServerOptionalEnvKey, fallback: string): string {
  return process.env[key] || fallback
}

/**
 * Gets a client environment variable
 * These are available on both server and client
 */
export function getClientEnv(key: ClientEnvKey): string | undefined {
  return process.env[key]
}

/**
 * Checks if a specific environment variable is configured
 */
export function hasEnv(key: ServerEnvKey | ServerOptionalEnvKey | ClientEnvKey): boolean {
  return !!process.env[key]
}

/**
 * Typed environment object for convenient access
 * Use getServerEnv() for required vars that should throw on missing
 */
export const env = {
  // Server - Required (will throw if missing when accessed via getServerEnv)
  stripe: {
    secretKey: () => getServerEnv("STRIPE_SECRET_KEY"),
    webhookSecret: () => getServerEnv("STRIPE_WEBHOOK_SECRET"),
    publishableKey: () => getClientEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  },

  // Server - Required
  resend: {
    apiKey: () => getServerEnv("RESEND_API_KEY"),
  },

  // Server - Optional with defaults
  email: {
    staffNotification: () => getOptionalEnv("STAFF_NOTIFICATION_EMAIL", "info@paimuaythai.com"),
  },

  // Validation
  validate: validateServerEnv,
  has: hasEnv,
} as const

/**
 * Log environment status (safe - doesn't expose values)
 */
export function logEnvStatus(): void {
  const result = validateServerEnv()

  console.log("[env] Environment validation:", result.valid ? "PASSED" : "FAILED")

  if (result.missing.length > 0) {
    console.error("[env] Missing required variables:", result.missing.join(", "))
  }

  console.log("[env] Configured variables:", result.present.join(", "))

  // Log optional vars
  const optionalStatus = SERVER_OPTIONAL_ENV_KEYS.map((key) => ({
    key,
    configured: hasEnv(key),
  }))

  console.log(
    "[env] Optional variables:",
    optionalStatus.map((s) => `${s.key}: ${s.configured ? "SET" : "DEFAULT"}`).join(", "),
  )
}
