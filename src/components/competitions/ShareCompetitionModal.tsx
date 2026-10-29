/**
 * @license
 * Public Competition & Examination Social Sharing Modal
 * Fatimyah Educational Trust India (Education • Service • Empowerment)
 */

import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  ExternalLink, 
  Sparkles,
  Calendar,
  Award,
  Globe,
  BookOpen
} from 'lucide-react';
import { Competition } from '../../types';
import { formatCompetitionShareContent, getCompetitionPublicUrl } from '../../utils/competitionFilters';

interface ShareCompetitionModalProps {
  competition: Competition;
  onClose: () => void;
}

export const ShareCompetitionModal: React.FC<ShareCompetitionModalProps> = ({
  competition,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const { shareTitle, shareText, shareUrl } = formatCompetitionShareContent(competition);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.warn('Copy link error:', e);
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareText);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (err: any) {
        // User cancelled or aborted
      }
    } else {
      handleCopyLink();
    }
  };

  const coverImg = competition.coverImageUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80';
  const feeLabel = competition.isPaid && (competition.participationFee ?? 0) > 0
    ? `₹${competition.participationFee}`
    : '100% Free Entry';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">Share Competition</h3>
              <p className="text-[11px] text-emerald-100">Invite students, parents, and schools to participate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Competition Preview Card */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <img
              src={coverImg}
              alt={competition.title}
              className="w-16 h-20 rounded-xl object-cover flex-shrink-0 shadow-xs border border-slate-200"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 inline-block">
                {competition.categoryLabel || 'Assessment'}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                {competition.title}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-semibold pt-0.5">
                <span className="text-emerald-700 font-bold">{feeLabel}</span>
                <span>•</span>
                <span>Due: {competition.registrationEndDate || 'Open'}</span>
              </div>
            </div>
          </div>

          {/* Social Platform Actions Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookShare}
              className="p-3 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Facebook</span>
            </button>
          </div>

          {/* Native Share Menu (if supported on mobile/desktop) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>Device Share Menu (More Apps)</span>
            </button>
          )}

          {/* Copy Link Strip */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Direct Public Link
            </label>
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent px-2 text-xs font-mono text-slate-700 outline-hidden truncate select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Public competition link copied to clipboard. Ready to paste anywhere!
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>FATIMYAH Educational Trust India</span>
          <span className="font-semibold text-slate-700">Open Public Access</span>
        </div>
      </div>
    </div>
  );
};
