export type Period = 'weekly' | 'monthly';

export interface Bucket {
  key: string;
  label: string;
}

const UZ_WEEKDAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
const UZ_MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function makeBuckets(period: Period, now = new Date()): Bucket[] {
  if (period === 'weekly') {
    const buckets: Bucket[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({
        key: localDateKey(d),
        label: `${UZ_WEEKDAYS[d.getDay()]} ${d.getDate()}`,
      });
    }
    return buckets;
  }

  const buckets: Bucket[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: monthKey(d),
      label: `${UZ_MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    });
  }
  return buckets;
}

export function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toBucketKey(value: unknown, period: Period): string | null {
  const d = parseDate(value);
  if (!d) return null;
  return period === 'weekly' ? localDateKey(d) : monthKey(d);
}

export function firstDate(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] != null && row[key] !== '') return row[key];
  }
  return null;
}

export function asList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: Record<string, unknown>[] }).results;
  }
  return [];
}

export function sumByBucket(
  items: Record<string, unknown>[],
  dateKeys: string[],
  period: Period,
  buckets: Bucket[],
  valueOf: (item: Record<string, unknown>) => number
): number[] {
  const map = new Map(buckets.map((b) => [b.key, 0]));
  items.forEach((item) => {
    const key = toBucketKey(firstDate(item, dateKeys), period);
    if (!key || !map.has(key)) return;
    map.set(key, (map.get(key) || 0) + valueOf(item));
  });
  return buckets.map((b) => map.get(b.key) || 0);
}

export function cumulativeByBucket(
  items: Record<string, unknown>[],
  dateKeys: string[],
  period: Period,
  buckets: Bucket[]
): number[] {
  const dates = items
    .map((item) => parseDate(firstDate(item, dateKeys)))
    .filter((d): d is Date => d != null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return buckets.map(() => 0);

  return buckets.map((bucket) => {
    const end = period === 'weekly'
      ? new Date(`${bucket.key}T23:59:59`)
      : new Date(Number(bucket.key.slice(0, 4)), Number(bucket.key.slice(5, 7)), 0, 23, 59, 59);
    return dates.filter((d) => d.getTime() <= end.getTime()).length;
  });
}

export function isPresent(status: unknown): boolean {
  const s = String(status || '').toLowerCase();
  return s === 'in' || s === 'present' || s === 'bor' || s === 'hozir' || s.includes('present');
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}
