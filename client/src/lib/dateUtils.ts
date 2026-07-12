import { format as fnsFormat, formatDistanceToNow as fnsDistanceToNow, isValid } from 'date-fns';

/**
 * Safely format any date value. Returns fallback string if date is invalid.
 */
export function safeFormat(
  value: string | Date | null | undefined,
  fmt = 'dd MMM yyyy',
  fallback = '—'
): string {
  if (!value) return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (!isValid(d)) return fallback;
    return fnsFormat(d, fmt);
  } catch {
    return fallback;
  }
}

/**
 * Safely get relative time. Returns fallback if date is invalid.
 */
export function safeDistance(
  value: string | Date | null | undefined,
  fallback = ''
): string {
  if (!value) return fallback;
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (!isValid(d)) return fallback;
    return fnsDistanceToNow(d, { addSuffix: true });
  } catch {
    return fallback;
  }
}

/**
 * Resolve the date from a Mongoose document that may have either naming convention.
 */
export function resolveDate(
  obj: Record<string, any>,
  ...fields: string[]
): string | undefined {
  for (const f of fields) {
    if (obj[f]) return obj[f];
  }
  return undefined;
}
