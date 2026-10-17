export const extractTime = (date: Date) => {
  // selected is a Date object
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // pad with leading zero if needed
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
  return formattedTime;
};

export const extractDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // months are 0-based
  const day = date.getDate().toString().padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`; // e.g. "2025-08-22"

  return formattedDate;
};

type EventDateValue = Date | string | null | undefined;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isDateOnlyValue = (value: EventDateValue) =>
  typeof value === "string" && DATE_ONLY_PATTERN.test(value.trim());

const parseEventDateValue = (value: EventDateValue) => {
  if (!value) return null;

  if (typeof value === "string") {
    const dateOnlyMatch = value.trim().match(DATE_ONLY_PATTERN);
    if (dateOnlyMatch) {
      const [year, month, day] = value.trim().split("-");
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hasRawMidnightTime = (value: EventDateValue) => {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  const timeMatch = trimmed.match(
    /T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i
  );
  if (!timeMatch) return false;

  const [, hour, minute, second = "00"] = timeMatch;
  return hour === "00" && minute === "00" && second === "00";
};

const isLocalStartOfDay = (date: Date | null) =>
  Boolean(
    date &&
      date.getHours() === 0 &&
      date.getMinutes() === 0 &&
      date.getSeconds() === 0 &&
      date.getMilliseconds() === 0
  );

const isMidnightBoundary = (
  value: EventDateValue,
  parsedDate: Date | null
) => hasRawMidnightTime(value) || isLocalStartOfDay(parsedDate);

const isAllDayLikeStart = (value: EventDateValue) => {
  const parsedDate = parseEventDateValue(value);
  return isDateOnlyValue(value) || isMidnightBoundary(value, parsedDate);
};

const shouldUseInclusiveEndDay = (
  startValue: EventDateValue,
  boundaryValue: EventDateValue,
  boundary: Date
) => {
  if (isDateOnlyValue(boundaryValue)) return true;
  if (!isMidnightBoundary(boundaryValue, boundary)) return false;

  return !startValue || isAllDayLikeStart(startValue);
};

export const buildEventDateTimeIso = (
  date: Date,
  time: string,
  options?: { endOfMinute?: boolean }
) => `${extractDate(date)}T${time}:${options?.endOfMinute ? "59" : "00"}Z`;

export const getEventEndBoundaryDate = (
  startDate?: EventDateValue,
  endDate?: EventDateValue
) => {
  const boundaryValue = endDate || startDate;
  const boundary = parseEventDateValue(boundaryValue);
  if (!boundary) return null;

  if (shouldUseInclusiveEndDay(startDate, boundaryValue, boundary)) {
    const inclusiveBoundary = new Date(boundary);
    inclusiveBoundary.setHours(23, 59, 59, 999);
    return inclusiveBoundary;
  }

  return boundary;
};

export const isEventPastEnd = (
  startDate?: EventDateValue,
  endDate?: EventDateValue,
  now = new Date()
) => {
  const boundary = getEventEndBoundaryDate(startDate, endDate);
  if (!boundary) return false;

  return boundary.getTime() <= now.getTime();
};

export const isEventEditableBeforeStartDay = (
  startDate?: EventDateValue,
  now = new Date()
) => {
  const startsAt = parseEventDateValue(startDate);
  if (!startsAt) return true;

  const startDay = new Date(startsAt);
  startDay.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return today.getTime() < startDay.getTime();
};

export function formatEventDateTime(
  startDate: string,
  endDate: string
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const monthShort = (date: Date) =>
    date.toLocaleString("en-US", { month: "short" });
  const day = (date: Date) => date.getDate();
  const year = (date: Date) => date.getFullYear();

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const startTimeStr = start.toLocaleTimeString("en-US", timeOptions);
  const endTimeStr = end.toLocaleTimeString("en-US", timeOptions);

  // Same day
  if (start.toDateString() === end.toDateString()) {
    return `${monthShort(start)} ${day(
      start
    )}, ${startTimeStr} – ${endTimeStr}`;
  }

  // Same month & year
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${monthShort(start)} ${day(start)} – ${day(end)}, ${year(start)}`;
  }

  // Different month or year
  return `${monthShort(start)} ${day(start)} – ${monthShort(end)} ${day(
    end
  )}, ${year(end)}`;
}

// utils/formatDate.ts
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getUTCDate(); // or getDate() if you want local time
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase(); // "AUG"
  return `${day} ${month}`;
}
