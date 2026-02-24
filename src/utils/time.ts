/**
 * Converts a "HH:mm" string to a decimal number (0-24).
 * e.g. "09:30" -> 9.5
 */
export function timeToDecimal(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return 9 // Default fallback
    return hours + minutes / 60
}

/**
 * Converts a decimal number (0-24) to a "HH:mm" string.
 * e.g. 9.5 -> "09:30"
 */
export function decimalToTime(decimal: number): string {
    const hours = Math.floor(decimal)
    const minutes = Math.round((decimal - hours) * 60)
    const h = hours.toString().padStart(2, '0')
    const m = minutes.toString().padStart(2, '0')
    return `${h}:${m}`
}

/**
 * Formats a decimal number (0-24) to a human-readable 12-hour time string.
 * e.g. 9.5 -> "9:30 AM", 14.0 -> "2:00 PM"
 */
export function decimalToLabel(decimal: number): string {
    const hours = Math.floor(decimal)
    const minutes = Math.round((decimal - hours) * 60)

    const period = hours >= 12 ? 'PM' : 'AM'
    let h = hours % 12
    if (h === 0) h = 12

    const m = minutes.toString().padStart(2, '0')
    return `${h}:${m} ${period}`
}
