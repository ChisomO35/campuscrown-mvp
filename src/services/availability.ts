import dayjs from 'dayjs'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { Availability } from './types'

const defaultWeeklyRules: Availability['weeklyRules'] = {
  sun: [],
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
}

export async function getAvailability(stylistId: string): Promise<Availability> {
  try {
    const snap = await getDoc(doc(db, 'stylists', stylistId))
    if (!snap.exists()) {
      return { stylistId, weeklyRules: defaultWeeklyRules }
    }
    const data = snap.data() as any
    const av = data.availability
    if (!av) {
      return { stylistId, weeklyRules: defaultWeeklyRules }
    }
    return {
      stylistId,
      slotDurationMins: av.slotDurationMins,
      weeklyRules: (av.weeklyRules ?? defaultWeeklyRules) as Availability['weeklyRules'],
    }
  } catch (e) {
    console.error(`Error fetching availability for ${stylistId}:`, e)
    // Return default availability as fallback for MVP if permissions fail
    return { stylistId, slotDurationMins: 120, weeklyRules: defaultWeeklyRules }
  }
}

export async function saveAvailability(av: Availability) {
  const { stylistId, ...rest } = av
  await updateDoc(doc(db, 'stylists', stylistId), {
    availability: rest,
  })
}

export function buildSlots({
  availability,
  serviceDurationMins = 60,
  daysForward = 14,
}: {
  availability: Availability
  serviceDurationMins?: number
  daysForward?: number
}): { startAt: string; endAt: string; label: string }[] {
  const slots: { startAt: string; endAt: string; label: string }[] = []
  const start = dayjs().startOf('day')
  const startInterval = 30 // Start slots every 30 mins

  for (let i = 0; i < daysForward; i++) {
    const date = start.add(i, 'day')
    const dow = date.format('ddd').toLowerCase().slice(0, 3) as keyof Availability['weeklyRules']
    const blocks = availability.weeklyRules[dow] ?? []

    for (const b of blocks) {
      const blockStart = dayjs(`${date.format('YYYY-MM-DD')}T${b.start}`)
      const blockEnd = dayjs(`${date.format('YYYY-MM-DD')}T${b.end}`)

      let cur = blockStart

      // A slot is valid if: cur + serviceDuration <= blockEnd
      while (!cur.add(serviceDurationMins, 'minute').isAfter(blockEnd)) {
        const end = cur.add(serviceDurationMins, 'minute')

        // Don't show slots in the past
        if (cur.isAfter(dayjs())) {
          slots.push({
            startAt: cur.toISOString(),
            endAt: end.toISOString(),
            label: `${date.format('ddd, MMM D')} • ${cur.format('h:mm A')}`,
          })
        }

        // Move to the next potential start time (every 30 mins)
        cur = cur.add(startInterval, 'minute')
      }
    }
  }
  return slots
}

