export function convertUndefinedToNull<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => convertUndefinedToNull(item)) as unknown as T;
  }

  const result: any = {};
  for (const key in obj) {
    if (obj[key] === undefined) {
      result[key] = null;
    } else if (typeof obj[key] === "object") {
      result[key] = convertUndefinedToNull(obj[key]);
    } else {
      result[key] = obj[key];
    }
  }

  return result as T;
}

export const objectToFormData = (
  obj,
  formData = new FormData(),
  parentKey = ""
) => {
  console.log(obj);
  Object.entries(obj).forEach(([key, value]) => {
    const formKey = parentKey ? `${parentKey}.${key}` : key;

    if (value instanceof File) {
      formData.append(formKey, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          objectToFormData(item, formData, formKey); // No index, just recurse
        } else {
          formData.append(formKey, item); // Treat primitives inside arrays
        }
      });
    } else if (typeof value === "object" && value !== null) {
      objectToFormData(value, formData, formKey);
    } else {
      formData.append(formKey, value);
    }
  });

  console.log(formData);

  return formData;
};

export function numberWithCommas(
  x: string | number = 0,
  monetary = false,
  currency: string | null
): string {
  const numericValue = Number(x);
  const currency_symbol = "\u20A6";
  if (isNaN(numericValue)) {
    x = 0;
  }
  const passedValue = monetary ? Number(x)?.toFixed(2) : x;
  const result = passedValue?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const value = monetary ? `${currency || currency_symbol} ${result}` : result;

  return value?.replace(/-/g, "");
}

// utils/formatTime.ts
export function formatTo12Hour(timeString: string): string {
  // Split hours and minutes
  const [hourStr, minuteStr] = timeString.split(":");
  let hours = parseInt(hourStr, 10);
  const minutes = minuteStr.padStart(2, "0");

  // Determine AM or PM
  const ampm = hours >= 12 ? "pm" : "am";

  // Convert hours from 24h to 12h format
  hours = hours % 12 || 12; // 0 -> 12

  return `${hours}:${minutes} ${ampm}`;
}

export const dummy = "https://randomuser.me/api/portraits/women/68.jpg";

interface FormatOptions {
  sameDayFormat?: "time" | "relative";
  use24Hour?: boolean;
  capitalizeDays?: boolean;
}

export function formatMessageTimestamp(
  dateString: string,
  options: FormatOptions = {}
): string {
  const {
    sameDayFormat = "time",
    use24Hour = false,
    capitalizeDays = true,
  } = options;

  const inputDate = new Date(dateString);
  const now = new Date();

  // Reset times to compare just dates
  const inputDay = new Date(
    inputDate.getFullYear(),
    inputDate.getMonth(),
    inputDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - inputDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Same day
  if (diffDays === 0) {
    if (sameDayFormat === "relative") {
      const diffMinutes = Math.floor(
        (now.getTime() - inputDate.getTime()) / (1000 * 60)
      );

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    }

    return inputDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !use24Hour,
    });
  }
  // Yesterday
  else if (diffDays === 1) {
    return capitalizeDays ? "Yesterday" : "yesterday";
  }
  // Last 6 days
  else if (diffDays > 1 && diffDays <= 6) {
    const dayName = inputDate.toLocaleDateString([], {
      weekday: "long",
    });
    return capitalizeDays ? dayName : dayName.toLowerCase();
  }
  // Beyond 6 days
  else {
    const formatter = new Intl.DateTimeFormat([], {
      month: "short",
      day: "numeric",
      year:
        inputDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
    return formatter.format(inputDate);
  }
}
