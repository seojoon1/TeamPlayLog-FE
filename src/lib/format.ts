/** 날짜 표시는 모두 한국 시간(KST) 기준. 기기 시간대와 상관없이 같게 보이도록 직접 계산한다. */

export const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const KST_MS = 9 * 3600 * 1000;

function kst(iso: string | Date) {
  return new Date(new Date(iso).getTime() + KST_MS);
}

/** 11.14(금) 18:00 */
export function dueLabel(iso: string) {
  const d = kst(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCMonth() + 1}.${d.getUTCDate()}(${DAYS[d.getUTCDay()]}) ${hh}:${mm}`;
}

/** 11.14 */
export function shortDate(iso: string) {
  const d = kst(iso);
  return `${d.getUTCMonth() + 1}.${d.getUTCDate()}`;
}

/** 11.10 18:20 */
export function dateTime(iso: string) {
  const d = kst(iso);
  return `${d.getUTCMonth() + 1}.${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** 방금 전 · 12분 전 · 3시간 전 · 어제 · 11.14 */
export function ago(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400 && dayDiff(iso) === 0) return `${Math.floor(diff / 3600)}시간 전`;
  if (dayDiff(iso) === 1) return '어제';
  return shortDate(iso);
}

/** 오늘(KST)과 몇 날 차이인지. 0=오늘, 1=어제 */
export function dayDiff(iso: string) {
  const a = kst(new Date());
  const b = kst(iso);
  const da = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const db = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((da - db) / 86400000);
}

export function dDay(n: number) {
  if (n === 0) return 'D-day';
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

/** 오늘부터 최종 마감까지 남은 날 */
export function daysUntil(iso: string) {
  return -dayDiff(iso);
}

export function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

export function hoursUntil(iso: string) {
  return (new Date(iso).getTime() - Date.now()) / 3600000;
}

/** KST 날짜(y,m,d)와 시각(h,min)을 UTC ISO 문자열로 */
export function kstToIso(y: number, m: number, d: number, h: number, min = 0) {
  return new Date(Date.UTC(y, m - 1, d, h, min) - KST_MS).toISOString();
}

/** ISO → KST 구성 요소 */
export function kstParts(iso: string) {
  const d = kst(iso);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes(), wd: d.getUTCDay() };
}

export const RECORD_TYPE_LABEL = {
  OUTPUT: '산출물',
  MEETING: '회의 참여',
  COORDINATION: '조율·소통',
  REVIEW: '검토·피드백',
} as const;

/** 세그먼트처럼 좁은 곳에 쓰는 짧은 이름 */
export const RECORD_TYPE_SHORT = {
  OUTPUT: '산출물',
  MEETING: '회의',
  COORDINATION: '조율·소통',
  REVIEW: '검토',
} as const;
