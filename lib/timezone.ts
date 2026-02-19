// Pai, Thailand timezone utilities
// All bookings are in Asia/Bangkok (UTC+7) regardless of user's location

export const PAI_TIMEZONE = "Asia/Bangkok"
export const PAI_TIMEZONE_LABEL = "Pai Time (UTC+7)"

/**
 * Format a date string to Pai local time for display
 */
export function formatDateInPaiTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    timeZone: PAI_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format a time string with Pai timezone label
 */
export function formatTimeInPaiTime(timeString: string): string {
  return `${timeString} (${PAI_TIMEZONE_LABEL})`
}

/**
 * Format date and time together for booking confirmations
 */
export function formatBookingDateTime(dateString: string, timeString?: string): string {
  const formattedDate = formatDateInPaiTime(dateString)
  if (timeString) {
    return `${formattedDate} at ${timeString} (${PAI_TIMEZONE_LABEL})`
  }
  return `${formattedDate} (${PAI_TIMEZONE_LABEL})`
}

/**
 * Get tomorrow's date in Pai timezone (for calendar min date)
 */
export function getTomorrowInPaiTimezone(): string {
  const now = new Date()
  // Convert to Pai time
  const paiNow = new Date(now.toLocaleString("en-US", { timeZone: PAI_TIMEZONE }))
  paiNow.setDate(paiNow.getDate() + 1)
  return paiNow.toISOString().split("T")[0]
}

/**
 * Get today's date in Pai timezone
 */
export function getTodayInPaiTimezone(): string {
  const now = new Date()
  const paiNow = new Date(now.toLocaleString("en-US", { timeZone: PAI_TIMEZONE }))
  return paiNow.toISOString().split("T")[0]
}
