/**
 * Dates for the admin panel, always in IST.
 *
 * `toLocaleString` without a `timeZone` uses whatever zone the code runs in.
 * In a server component that is the server: IST on a laptop, UTC on Vercel, so
 * the same record read 07:53 pm locally and 02:23 pm live. Date-only output is
 * not safe either — a booking taken at 1:10 am IST printed as the day before.
 *
 * Pinned to Asia/Kolkata rather than the reader's own zone on purpose: this is
 * one team looking at one business's records, and an audit trail is only useful
 * if everyone reading it sees the same clock.
 */
export const IST_TZ = "Asia/Kolkata";
const IST = IST_TZ;

const DATE: Intl.DateTimeFormatOptions = {
  timeZone: IST,
  day: "numeric",
  month: "short",
  year: "numeric",
};

const DATE_TIME: Intl.DateTimeFormatOptions = {
  ...DATE,
  hour: "2-digit",
  minute: "2-digit",
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "15 Aug 2026", or `fallback` when there is no usable date. */
export function formatDateIST(
  value: Date | string | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString("en-IN", DATE) : fallback;
}

/** "15 Aug 2026, 01:10 am", or `fallback` when there is no usable date. */
export function formatDateTimeIST(
  value: Date | string | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  return d ? d.toLocaleString("en-IN", DATE_TIME) : fallback;
}
