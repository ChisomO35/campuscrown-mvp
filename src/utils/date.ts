import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(advancedFormat)

/**
 * Formats a date string or Date object to "Tuesday, February 25th, 2026"
 */
export function formatFullDate(date: string | Date) {
    if (!date) return ''
    return dayjs(date).format('dddd, MMMM Do, YYYY')
}

/**
 * Formats a date string or Date object to "Tuesday, February 25th, 2026 • 2:00 PM"
 */
export function formatFullDateTime(date: string | Date) {
    if (!date) return ''
    return dayjs(date).format('dddd, MMMM Do, YYYY • h:mm A')
}

/**
 * Formats a date for inbox previews (e.g., "Feb 25, 2026")
 */
export function formatShortDate(date: string | Date) {
    if (!date) return ''
    return dayjs(date).format('MMM D, YYYY')
}
