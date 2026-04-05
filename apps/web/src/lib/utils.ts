import { clsx } from 'clsx'

export function cn(...values: Array<string | false | null | undefined>): string {
  return clsx(values)
}

export function formatDate(value: string | null): string {
  if (!value) {
    return '未設定'
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}
