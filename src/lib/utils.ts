import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatMoney(amount: number, currency = 'USD', locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(date),
  )
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function truncate(str: string | null | undefined, length = 80): string {
  if (!str) return ''
  return str.length > length ? `${str.slice(0, length)}…` : str
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function currencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    SAR: 'SAR ',
    AED: 'AED ',
    EGP: 'E£',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
  }
  return symbols[currency] ?? `${currency} `
}
