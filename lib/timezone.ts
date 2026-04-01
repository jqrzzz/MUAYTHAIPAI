// Timezone utilities for gym bookings
// Each gym has its own timezone stored in organizations.timezone
// Default to Asia/Bangkok for backwards compatibility

export const DEFAULT_TIMEZONE = "Asia/Bangkok"

/**
 * Get a display label for a timezone
 */
export function getTimezoneLabel(timezone: string = DEFAULT_TIMEZONE): string {
  try {
    const now = new Date()
    const formatted = now.toLocaleString("en-US", { timeZone: timezone, timeZoneName: "shortOffset" })
    const offset = formatted.split(" ").pop() || ""
    return `${timezone.split("/").pop()?.replace("_", " ")} Time (${offset})`
  } catch {
    return `${timezone} Time`
  }
}

// Keep these for backwards compatibility with existing imports
export const PAI_TIMEZONE = DEFAULT_TIMEZONE
export const PAI_TIMEZONE_LABEL = "Pai Time (UTC+7)"

/**
 * Format a date string to local time for display
 */
export function formatDateInPaiTime(dateString: string, timezone: string = DEFAULT_TIMEZONE): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format a time string with timezone label
 */
export function formatTimeInPaiTime(timeString: string, timezone: string = DEFAULT_TIMEZONE): string {
  return `${timeString} (${getTimezoneLabel(timezone)})`
}

/**
 * Format date and time together for booking confirmations
 */
export function formatBookingDateTime(dateString: string, timeString?: string, timezone: string = DEFAULT_TIMEZONE): string {
  const formattedDate = formatDateInPaiTime(dateString, timezone)
  if (timeString) {
    return `${formattedDate} at ${timeString} (${getTimezoneLabel(timezone)})`
  }
  return `${formattedDate} (${getTimezoneLabel(timezone)})`
}

/**
 * Get tomorrow's date in a given timezone (for calendar min date)
 */
export function getTomorrowInPaiTimezone(timezone: string = DEFAULT_TIMEZONE): string {
  const now = new Date()
  const localNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  localNow.setDate(localNow.getDate() + 1)
  return localNow.toISOString().split("T")[0]
}

/**
 * Get today's date in a given timezone
 */
export function getTodayInPaiTimezone(timezone: string = DEFAULT_TIMEZONE): string {
  const now = new Date()
  const localNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
  return localNow.toISOString().split("T")[0]
}
