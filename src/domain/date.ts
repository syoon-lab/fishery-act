import type { MonthDay, PeriodSpec } from "./schema";

/** 판정 기준일 (KST 관점의 달력 날짜) */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export function getKSTToday(now: Date = new Date()): CalendarDate {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(now).split("-").map(Number);
  return { year, month, day };
}

/** 월·일을 정수 하나로 (3월 5일 → 305). 연도 무관 비교용 */
export function monthDayKey(md: MonthDay): number {
  return md.month * 100 + md.day;
}

export function toIsoDate(date: CalendarDate): string {
  const mm = String(date.month).padStart(2, "0");
  const dd = String(date.day).padStart(2, "0");
  return `${date.year}-${mm}-${dd}`;
}

export function isoToCalendarDate(iso: string): CalendarDate {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

/**
 * 기준일이 기간 안에 있는지 판정.
 * annual: start > end(월일 비교)면 연도 경계("익년")로 보고 OR 판정.
 */
export function isDateInPeriod(period: PeriodSpec, date: CalendarDate): boolean {
  switch (period.kind) {
    case "allYear":
      return true;
    case "annual": {
      const q = date.month * 100 + date.day;
      const s = monthDayKey(period.start);
      const e = monthDayKey(period.end);
      return s > e ? q >= s || q <= e : q >= s && q <= e;
    }
  }
}

export function isDateInAnyPeriod(periods: PeriodSpec[], date: CalendarDate): boolean {
  return periods.some((p) => isDateInPeriod(p, date));
}
