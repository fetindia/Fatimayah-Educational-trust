/**
 * @license
 * Super Admin Control Panel: Verified Qur'anic Verses Registry
 * Fatimyah Educational Trust India (FET India)
 * 
 * Manages authentic, role-specific Qur'anic verses displayed on:
 * - Role-Specific Official Identity Cards (Front & Back)
 * - Section 80G Tax Exemption Donation Receipts
 * - Digital Examination & Merit Certificates
 * 
 * Strict Constraint: Fixed Qur'anic Arabic text only; no loose paraphrases.
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  Edit3, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useConfig } from '../../../contexts/ConfigContext';
import { useAuth } from '../../../contexts/AuthContext';
import { RoleQuranicVerseSetting, UserRole } from '../../../types';
import { DEFAULT_ROLE_QURANIC_VERSES } from '../../../data/quranicVerses';

interface VerseCategoryMeta {
  key: string;
  label: string;
  roleBadge: string;
  badgeBg: string;
  usedIn: string;
}

const CATEGORIES: VerseCategoryMeta[] = [
  {
    key: 'core_member',
    label: 'Core Members / Trustees',
    roleBadge: 'Leadership & Trust Governance',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    usedIn: 'Core Member ID Cards (Front & Back)'
  },
  {
    key: 'volunteer',
    label: 'Volunteers / Khidmat Team',
    roleBadge: 'Grassroots Community Service',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
    usedIn: 'Volunteer ID Cards (Front & Back)'
  },
  {
    key: 'donor',
    label: 'Donors & Philanthropists',
    roleBadge: 'Section 80G Philanthropy',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    usedIn: 'Donor ID Cards & Official 80G Tax Receipts'
  },
  {
    key: 'student',
    label: 'Students & Candidates',
    roleBadge: 'Academic & Competition Merit',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    usedIn: 'Student ID Cards & Examination Badges'
  },
  {
    key: 'teacher',
    label: 'Teachers & Academic Mentors',
    roleBadge: 'Scholarly Guidance',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    usedIn: 'Faculty & Educator ID Cards'
  },
  {
    key: 'administrator',
    label: 'Administrators & Staff',
    roleBadge: 'Institutional Trustworthiness',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    usedIn: 'Executive & Staff ID Cards'
  }
];

export const AdminQuranicVersesSettings: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const { currentUser, userProfile, isSuperAdmin } = useAuth();

  const [versesState, setVersesState] = useState<Record<string, RoleQuranicVerseSetting>>({
    ...DEFAULT_ROLE_QURANIC_VERSES,
    ...(config.roleQuranicVerses || {})
  });

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editArabic, setEditArabic] = useState<string>('');
  const [editSurah, setEditSurah] = useState<string>('');
  const [editEnglish, setEditEnglish] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const adminCredentials = {
    uid: currentUser?.uid || 'admin',
    email: currentUser?.email || 'superadmin@fetindia.com',
    role: (userProfile?.role || 'super_admin') as UserRole
  };

  const startEdit = (key: string) => {
    const current = versesState[key] || DEFAULT_ROLE_QURANIC_VERSES[key];
    setEditingKey(key);
    setEditArabic(current?.arabicText || '');
    setEditSurah(current?.reference || '');
    setEditEnglish(current?.englishTranslation || '');
    setErrorMessage(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setErrorMessage(null);
  };

  const saveEdit = async () => {
    if (!editingKey) return;
    if (!editArabic.trim()) {
      setErrorMessage('Arabic Qur’anic text is mandatory.');
      return;
    }
    if (!editSurah.trim()) {
      setErrorMessage('Surah & verse reference citation is mandatory.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updatedSetting: RoleQuranicVerseSetting = {
        roleKey: editingKey,
        arabicText: editArabic.trim(),
        reference: editSurah.trim(),
        englishTranslation: editEnglish.trim(),
        enabled: true,
        isCustom: true
      };

      const updatedMap: Record<string, RoleQuranicVerseSetting> = {
        ...versesState,
        [editingKey]: updatedSetting
      };

      await updateConfig({
        roleQuranicVerses: updatedMap
      }, adminCredentials);

      setVersesState(updatedMap);
      setEditingKey(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update Qur’anic verse:', err);
      setErrorMessage(err.message || 'Failed to update configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Reset all role-specific Qur’anic verses to verified canonical defaults?')) {
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig({
        roleQuranicVerses: DEFAULT_ROLE_QURANIC_VERSES
      }, adminCredentials);
      setVersesState(DEFAULT_ROLE_QURANIC_VERSES);
      setEditingKey(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to reset verses:', err);
      setErrorMessage(err.message || 'Failed to reset verses.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="admin-quranic-verses-section">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200">
              <BookOpen className="w-5 h-5 text-amber-700" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Official Qur’anic Verses Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Central registry of canonical Qur’anic verses printed on ID Cards, 80G Tax Receipts, and Credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Changes Saved
            </span>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Reset to verified canonical texts"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Defaults</span>
            </button>
          )}
        </div>
      </div>

      {/* Theological Guideline Callout */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Canonical Arabic Text Integrity:
          </p>
          <p className="text-[11.5px] leading-relaxed text-amber-900">
            Arabic verses must represent exact, verified Qur’anic text with diacritical vocalization (Harakat). Translations are provided for administrative clarity but are not substituted for the sacred Arabic text on print artifacts.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Verses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const verse = versesState[cat.key] || DEFAULT_ROLE_QURANIC_VERSES[cat.key];
          const isEditing = editingKey === cat.key;

          return (
            <div 
              key={cat.key}
              className={`rounded-2xl border transition-all p-5 space-y-4 ${
                isEditing 
                  ? 'border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20' 
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    {cat.usedIn}
                  </p>
                </div>

                {!isEditing && isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => startEdit(cat.key)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors"
                    title={`Edit verse for ${cat.label}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View / Edit Mode */}
              {isEditing ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Arabic Qur’anic Text (Pure Sacred Scripture):
                    </label>
                    <textarea
                      value={editArabic}
                      onChange={(e) => setEditArabic(e.target.value)}
                      dir="rtl"
                      rows={3}
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 font-serif text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Surah & Verse Reference (e.g., Qur'an 3:104):
                    </label>
                    <input
                      type="text"
                      value={editSurah}
                      onChange={(e) => setEditSurah(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      English Context / Translation (Administrative Reference):
                    </label>
                    <textarea
                      value={editEnglish}
                      onChange={(e) => setEditEnglish(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Arabic Display Badge */}
                  <div 
                    className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 text-center shadow-2xs"
                    dir="rtl"
                  >
                    <p 
                      className="font-serif font-bold text-base sm:text-lg text-amber-950 leading-relaxed"
                      style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}
                    >
                      {verse?.arabicText || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                    </p>
                    <div className="text-[10px] font-sans font-bold text-amber-900 tracking-wide mt-1" dir="ltr">
                      {verse?.reference || 'Holy Qur’an'}
                    </div>
                  </div>

                  {verse?.englishTranslation && (
                    <p className="text-[11px] text-slate-600 italic leading-relaxed pl-1">
                      "{verse.englishTranslation}"
                    </p>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
