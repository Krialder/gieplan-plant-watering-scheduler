export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateGerman(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function getDaysBetween(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function isDateInRange(date: string, startDate: string, endDate: string | null): boolean {
  const d = parseDate(date);
  const start = parseDate(startDate);
  
  if (endDate === null) {
    return d >= start;
  }
  
  const end = parseDate(endDate);
  return d >= start && d <= end;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getTodayString(): string {
  return formatDate(new Date());
}
