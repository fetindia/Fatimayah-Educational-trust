/**
 * @license
 * Competition Visibility & Security Filters
 * Fatimyah Educational Trust India (FET India)
 *
 * Enforces strict public visibility rules:
 * - Excludes soft-deleted and permanently deleted records
 * - Excludes archived and draft records
 * - Excludes unpublished competitions
 * - Quarantines test-environment competitions from public candidate views
 */

import { Competition } from '../types';

/**
 * Checks whether a competition document is actively published and eligible
 * for public discovery, application, and candidate viewing.
 */
export function isPublicActiveCompetition(comp: Competition | any): boolean {
  if (!comp || typeof comp !== 'object') return false;

  // 1. Soft delete and archive enforcement
  if (comp.isDeleted === true || comp.deleted === true) return false;
  if (comp.status === 'archived' || comp.status === 'deleted') return false;

  // 2. Draft & unapproved records
  if (comp.status === 'draft') return false;
  if (comp.isPublished === false) return false;

  // 3. Test & development quarantine
  if (comp.isTestCompetition === true || comp.environment === 'test') return false;

  return true;
}

/**
 * Generates the official public URL for a given competition.
 */
export function getCompetitionPublicUrl(compIdOrCode: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://fetindia.com';
  return `${origin}/examination/${encodeURIComponent(compIdOrCode)}`;
}

/**
 * Formats a clean, attractive sharing message for WhatsApp and social platforms.
 */
export function formatCompetitionShareContent(comp: Competition) {
  const shareUrl = getCompetitionPublicUrl(comp.id || comp.code || '');
  const feeLabel = comp.isPaid && (comp.participationFee ?? 0) > 0
    ? `₹${comp.participationFee}`
    : '100% Free Entry';
  const deadlineLabel = comp.registrationEndDate || 'Open for Enrollment';
  const examDateLabel = comp.competitionDate || comp.examScheduleDate || 'Scheduled';

  const bookInfo = comp.bookDetails?.bookTitle
    ? `📖 *Prescribed Literature:* ${comp.bookDetails.bookTitle}${comp.bookDetails.author ? ` by ${comp.bookDetails.author}` : ''}\n`
    : '';

  const shareTitle = `${comp.title} — FATIMYAH Educational Trust`;
  const shareText =
    `🎓 *${comp.title}*\n` +
    `🏛️ *Organized by:* FATIMYAH Educational Trust India\n` +
    `📅 *Registration Deadline:* ${deadlineLabel}\n` +
    `🗓️ *Examination Date:* ${examDateLabel}\n` +
    `💰 *Fee:* ${feeLabel}\n` +
    bookInfo +
    `🏆 *Merit Awards:* Gold/Silver/Bronze Shields & Educational Grants\n\n` +
    `👉 *View Details & Register Online:* ${shareUrl}`;

  return {
    shareTitle,
    shareText,
    shareUrl
  };
}
