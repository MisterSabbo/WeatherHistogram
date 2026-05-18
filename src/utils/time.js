/**
 * @param {number} time - timestamp in ms
 * @param {number} startTime - reference start timestamp in ms
 * @param {number} pixelsPerHour
 * @returns {number} x-coordinate in pixels
 */
export function dateToX(time, startTime, pixelsPerHour) {
  return ((time - startTime) / 3600000) * pixelsPerHour;
}

/**
 * @param {number} startTime - reference start timestamp in ms
 * @param {number} pixelsPerHour
 * @returns {number} x-coordinate in pixels for the current time
 */
export function getCurrentTimeX(startTime, pixelsPerHour) {
  return dateToX(Date.now(), startTime, pixelsPerHour);
}

/**
 * @param {number} hour - hour value (0-23)
 * @returns {string} formatted hour string (e.g. "09", "14")
 */
export function formatHour(hour) {
  return hour.toString().padStart(2, '0');
}

/**
 * @param {Date} date
 * @param {string} locale
 * @returns {string} formatted day string (e.g. "MON, 15 JAN")
 */
export function formatDay(date, locale) {
  return date.toLocaleString(locale, {
    weekday: 'short', day: 'numeric', month: 'short'
  }).toUpperCase();
}

/**
 * @param {number} startTime - reference start timestamp in ms
 * @param {number} [maxIndex] - optional upper bound (exclusive)
 * @returns {number} index of the current time in hourly data array
 */
export function getSplitIndex(startTime, maxIndex) {
  if (!startTime) return 0;
  const now = Date.now();
  const index = Math.floor((now - startTime) / 3600000);
  return maxIndex != null ? Math.max(0, Math.min(maxIndex, index)) : Math.max(0, index);
}

/**
 * Formats a timestamp for tooltip display with locale-aware time
 * @param {Date} date
 * @param {string} locale
 * @param {string} timezone
 * @returns {{ timeStr: string, dateStr: string, isToday: boolean }}
 */
export function formatTooltipTime(date, locale, timezone) {
  const today = new Date();
  const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();

  const timeStr = date.toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit', timeZone: timezone
  });

  const dateStr = date.toLocaleString(locale, {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: timezone
  }).toUpperCase();

  return { timeStr, dateStr, isToday };
}
