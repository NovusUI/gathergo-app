


export const  extractTime = (date:Date)=>{

      // selected is a Date object
      const hours = date.getHours();
      const minutes = date.getMinutes();

        // pad with leading zero if needed
      const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
      return formattedTime


}


export const  extractDate = (date:Date)=>{


   

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // months are 0-based
    const day = date.getDate().toString().padStart(2, "0");
  
    const formattedDate = `${year}-${month}-${day}`; // e.g. "2025-08-22"

    return formattedDate

}


export function formatEventDateTime(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const monthShort = (date: Date) => date.toLocaleString('en-US', { month: 'short' });
  const day = (date: Date) => date.getDate();
  const year = (date: Date) => date.getFullYear();

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const startTimeStr = start.toLocaleTimeString('en-US', timeOptions);
  const endTimeStr = end.toLocaleTimeString('en-US', timeOptions);

  // Same day
  if (start.toDateString() === end.toDateString()) {
    return `${monthShort(start)} ${day(start)}, ${startTimeStr} – ${endTimeStr}`;
  }

  // Same month & year
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${monthShort(start)} ${day(start)} – ${day(end)}, ${year(start)}`;
  }

  // Different month or year
  return `${monthShort(start)} ${day(start)} – ${monthShort(end)} ${day(end)}, ${year(end)}`;
}


