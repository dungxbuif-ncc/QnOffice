import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from './joinUrlPaths';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusBadgeProps(status: string) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
  };

  return {
    className:
      statusColors[status as keyof typeof statusColors] ||
      'bg-gray-100 text-gray-800',
    children: status,
  };
}

export function formatDateVN(
  dateString: string | Date | undefined | null,
): string {
  if (!dateString) return '';

  let dateToParse = '';

  if (dateString instanceof Date) {
    dateToParse = dateString.toISOString().split('T')[0];
  } else {
    dateToParse = dateString.includes('T')
      ? dateString.split('T')[0]
      : dateString;
  }

  const [year, month, day] = dateToParse.split('-').map(Number);
  // Note: Month is 0-indexed in JS Date
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTimeVN(
  date: string | Date | undefined | null,
): string {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
