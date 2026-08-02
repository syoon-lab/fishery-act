import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { getKSTToday, isoToCalendarDate, toIsoDate, type CalendarDate } from "@/domain/date";

/**
 * 조회 조건을 URL 쿼리스트링과 동기화하는 훅 (fishery-regulation v2 패턴).
 * URL이 곧 상태 — 조회 화면과 상세가 같은 조건을 공유하고 딥링크·공유가 가능하다.
 * ?industry=yeonan-jamang&group=coastal&region=sido:jeonnam&date=2026-07-15&closed=1
 */
export interface Filters {
  industryId: string; // "" = 전체 어업
  group: string; // "" = 전체 (offshore|coastal|demarcated|licensed|reported)
  regionCode: string; // "" = 전국
  date: CalendarDate;
  closedOnly: boolean; // 조업금지 적용 중인 어업만
  limitedOnly: boolean; // 포획할 수 있는 수산동물이 한정된 어업만
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function useFilters() {
  const [params, setParams] = useSearchParams();
  const today = useMemo(() => getKSTToday(), []);

  const dateParam = params.get("date") ?? "";
  const filters: Filters = useMemo(
    () => ({
      industryId: params.get("industry") ?? "",
      group: params.get("group") ?? "",
      regionCode: params.get("region") ?? "",
      date: DATE_RE.test(dateParam) ? isoToCalendarDate(dateParam) : today,
      closedOnly: params.get("closed") === "1",
      limitedOnly: params.get("limited") === "1",
    }),
    [params, dateParam, today],
  );

  const update = useCallback(
    (patch: Partial<Filters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const setOrDelete = (key: string, value: string) => {
            if (value) next.set(key, value);
            else next.delete(key);
          };
          if (patch.industryId !== undefined) setOrDelete("industry", patch.industryId);
          if (patch.group !== undefined) setOrDelete("group", patch.group);
          if (patch.regionCode !== undefined) setOrDelete("region", patch.regionCode);
          if (patch.closedOnly !== undefined) setOrDelete("closed", patch.closedOnly ? "1" : "");
          if (patch.limitedOnly !== undefined) setOrDelete("limited", patch.limitedOnly ? "1" : "");
          if (patch.date !== undefined) {
            const iso = toIsoDate(patch.date);
            setOrDelete("date", iso === toIsoDate(today) ? "" : iso);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams, today],
  );

  const reset = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  const isToday =
    filters.date.year === today.year &&
    filters.date.month === today.month &&
    filters.date.day === today.day;

  return { filters, update, reset, today, isToday };
}
