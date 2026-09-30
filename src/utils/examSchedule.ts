/**
 * @license
 * Examination Schedule and Timing Engine
 * Fatimyah Educational Trust India (FET India)
 */

import { Competition } from '../types';

export interface ExamScheduleStatus {
  status: 'upcoming' | 'open' | 'closed';
  isOpen: boolean;
  isClosed: boolean;
  message: string;
  formattedDate: string;
  formattedOpenTime: string;
  formattedCloseTime: string;
  timeZone: string;
  openTimestampMs: number;
  closeTimestampMs: number;
  secondsUntilOpen: number;
  secondsUntilClose: number;
}

/**
 * Parses time string (e.g. "09:00" or "9:00 AM") and date (e.g. "2026-09-10")
 * in the context of Indian Standard Time (IST / Asia/Kolkata +05:30).
 */
export function parseScheduleDateTimeToMs(dateStr: string, timeStr: string, timeZone = 'Asia/Kolkata'): number {
  if (!dateStr) return 0;
  
  // Clean date YYYY-MM-DD
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) {
    const fallbackParsed = Date.parse(dateStr);
    return isNaN(fallbackParsed) ? 0 : fallbackParsed;
  }
  const cleanDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

  // Clean time HH:mm
  let hours = 9;
  let minutes = 0;
  if (timeStr) {
    const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (ampmMatch) {
      hours = parseInt(ampmMatch[1], 10);
      minutes = parseInt(ampmMatch[2], 10);
      const meridiem = ampmMatch[3]?.toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    } else {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10) || 0;
        minutes = parseInt(parts[1], 10) || 0;
      }
    }
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const isoTime = `${pad(hours)}:${pad(minutes)}:00`;

  // Standard IST is UTC+05:30
  if (timeZone.toLowerCase().includes('kolkata') || timeZone.toLowerCase().includes('calcutta') || timeZone.toLowerCase().includes('ist')) {
    return Date.parse(`${cleanDate}T${isoTime}+05:30`);
  }

  // Fallback to local / standard ISO
  return Date.parse(`${cleanDate}T${isoTime}Z`);
}

/**
 * Format a 24-hour time "09:00" to "9:00 AM IST"
 */
export function formatISTTime(timeStr?: string): string {
  if (!timeStr) return '9:00 AM IST';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10) || 0;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const padMin = minutes.toString().padStart(2, '0');
  return `${hours}:${padMin} ${ampm} IST`;
}

/**
 * Format a date string "2026-09-10" to "10 September 2026"
 */
export function formatReadableDate(dateStr?: string): string {
  if (!dateStr) return 'To Be Announced';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Determines whether the examination is upcoming, currently live, or closed.
 */
export function getExamScheduleStatus(competition: Competition, referenceNowMs = Date.now()): ExamScheduleStatus {
  const scheduleDate = 
    competition.examScheduleDate || 
    competition.examDetails?.examScheduleDate || 
    competition.competitionDate || 
    '2026-10-15';

  const openTime = 
    competition.openingTime || 
    competition.examDetails?.openingTime || 
    '09:00';

  const closeTime = 
    competition.closingTime || 
    competition.examDetails?.closingTime || 
    '10:00';

  const timeZone = 
    competition.timeZone || 
    competition.examDetails?.timeZone || 
    'Asia/Kolkata';

  const openMs = parseScheduleDateTimeToMs(scheduleDate, openTime, timeZone);
  const closeMs = parseScheduleDateTimeToMs(scheduleDate, closeTime, timeZone);

  const formattedDate = formatReadableDate(scheduleDate);
  const formattedOpen = formatISTTime(openTime);
  const formattedClose = formatISTTime(closeTime);

  const secondsUntilOpen = Math.floor((openMs - referenceNowMs) / 1000);
  const secondsUntilClose = Math.floor((closeMs - referenceNowMs) / 1000);

  // Check windows
  if (referenceNowMs < openMs) {
    return {
      status: 'upcoming',
      isOpen: false,
      isClosed: false,
      message: `This examination will open on ${formattedDate} at ${formattedOpen}.`,
      formattedDate,
      formattedOpenTime: formattedOpen,
      formattedCloseTime: formattedClose,
      timeZone,
      openTimestampMs: openMs,
      closeTimestampMs: closeMs,
      secondsUntilOpen,
      secondsUntilClose
    };
  }

  if (referenceNowMs > closeMs) {
    return {
      status: 'closed',
      isOpen: false,
      isClosed: true,
      message: `This examination closed on ${formattedDate} at ${formattedClose}. Late attempts are strictly prohibited.`,
      formattedDate,
      formattedOpenTime: formattedOpen,
      formattedCloseTime: formattedClose,
      timeZone,
      openTimestampMs: openMs,
      closeTimestampMs: closeMs,
      secondsUntilOpen: 0,
      secondsUntilClose: 0
    };
  }

  return {
    status: 'open',
    isOpen: true,
    isClosed: false,
    message: `Examination window is currently active. Closes at ${formattedClose}.`,
    formattedDate,
    formattedOpenTime: formattedOpen,
    formattedCloseTime: formattedClose,
    timeZone,
    openTimestampMs: openMs,
    closeTimestampMs: closeMs,
    secondsUntilOpen: 0,
    secondsUntilClose
  };
}
