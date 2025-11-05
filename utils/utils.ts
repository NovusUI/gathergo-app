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
