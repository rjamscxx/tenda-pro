export function formatCurrency(cents: number, currency = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function parseCents(value: string): number {
  const num = parseFloat(value.replace(/,/g, ''))
  return Math.round(isNaN(num) ? 0 : num * 100)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date))
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
