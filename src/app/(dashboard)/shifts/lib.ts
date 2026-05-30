// Shared shift presets + pay math used by both the server action and the
// client UI. Hours/minutes are decimal hours; pay is in cents.

export const SHIFT_TYPES = {
  opening: { label: 'Opening', time: '6:00 AM – 2:00 PM',  hours: 8,  timeIn: '06:00', timeOut: '14:00' },
  mid:     { label: 'Mid',     time: '10:00 AM – 6:00 PM', hours: 8,  timeIn: '10:00', timeOut: '18:00' },
  closing: { label: 'Closing', time: '2:00 PM – 10:00 PM', hours: 8,  timeIn: '14:00', timeOut: '22:00' },
  full:    { label: 'Full Day', time: '6:00 AM – 10:00 PM', hours: 16, timeIn: '06:00', timeOut: '22:00' },
  custom:  { label: 'Custom',  time: '',                    hours: 0,  timeIn: null,    timeOut: null },
} as const

export type ShiftTypeKey = keyof typeof SHIFT_TYPES

export const SHIFT_STATUS = {
  present: { label: 'Present',  tone: 'success' },
  late:    { label: 'Late',     tone: 'warn'    },
  absent:  { label: 'Absent',   tone: 'danger'  },
  leave:   { label: 'On leave', tone: 'muted'   },
} as const

export type ShiftStatusKey = keyof typeof SHIFT_STATUS

export const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const

/** Decimal-hour duration between two 'HH:MM' strings, wraps past midnight. */
export function hoursBetween(inHHMM: string, outHHMM: string): number {
  const [ih, im] = inHHMM.split(':').map(Number)
  const [oh, om] = outHHMM.split(':').map(Number)
  let mins = (oh * 60 + om) - (ih * 60 + im)
  if (mins < 0) mins += 24 * 60                // wraps past midnight (e.g. closing shift)
  return Math.round((mins / 60) * 100) / 100
}

/** Convert an employee's stored rate to a per-hour rate in cents.
 *  daily   → assumes 8h/day
 *  monthly → assumes 8h/day × 26 working days = 208h/month
 *  hourly  → already per-hour                                          */
export function hourlyRateCents(payType: 'daily'|'monthly'|'hourly', payRate: number): number {
  if (payType === 'hourly')  return payRate
  if (payType === 'daily')   return Math.round(payRate / 8)
  return Math.round(payRate / (8 * 26))
}

/** Pay = (hours + ot − late) × hourly. Absent / leave = 0 pay. */
export function computeGrossPayCents(
  status: ShiftStatusKey,
  hours: number,
  otHours: number,
  lateHours: number,
  hourlyCents: number,
): number {
  if (status === 'absent' || status === 'leave') return 0
  const billable = Math.max(0, hours + otHours - lateHours)
  return Math.round(billable * hourlyCents)
}

/** Stable color from a name string so each employee's avatar is consistent. */
const PALETTE = ['#58C098','#E48865','#7BAEEE','#E8C96A','#C9E663','#E879A6','#F97316','#7DC48A','#A78BFA','#0EA5E9']
export function colorForName(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** "Ana Reyes" → "Ana"; "Ana" → "Ana"; "" → "?" */
export function nickname(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0]
  return first || '?'
}

/** First N chars uppercase for avatar initials (2 by default). */
export function initials(fullName: string, n = 2): string {
  return nickname(fullName).slice(0, n).toUpperCase() || '?'
}
