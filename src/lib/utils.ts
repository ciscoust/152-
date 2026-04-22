import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parse } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertTo12HourFormat(time24: string): string {
  if (!time24) return '12:00 AM';
  try {
    const parsed = parse(time24, 'HH:mm', new Date());
    return format(parsed, 'hh:mm a');
  } catch {
    return '12:00 AM';
  }
}

export function convertTo24HourFormat(time12: string): string {
  if (!time12 || !time12.includes(' ')) return '00:00';
  try {
    const parsed = parse(time12, 'hh:mm a', new Date());
    return format(parsed, 'HH:mm');
  } catch {
    return '00:00';
  }
}

export function base64ToBlob(base64Data: string): Blob {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}
