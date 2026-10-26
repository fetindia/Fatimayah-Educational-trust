/**
 * @license
 * DonationImpactChart Component
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 *
 * Interactive data visualization of a donor's yearly donation trends and impact sectors
 * built using Recharts with full responsive containers and brand styling.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  BadgeDollarSign,
  HeartHandshake,
  GraduationCap,
  Heart,
  Building,
  ArrowUpRight,
  Eye,
  Target,
  Trophy,
  SlidersHorizontal,
  RotateCcw,
  Check
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CampaignDonation } from '../../types';

export interface ImpactSectorMeta {
  key: string;
  label: string;
  color: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const IMPACT_SECTORS: Record<string, ImpactSectorMeta> = {
  education: {
    key: 'education',
    label: 'Education & Scholarships',
    color: '#047857',
    description: 'Higher education tuition, student stipends, school fee aid & competition kits',
    icon: GraduationCap
  },
  healthcare: {
    key: 'healthcare',
    label: 'Healthcare & Medical Relief',
    color: '#0284c7',
    description: 'Emergency treatments, medicines, diagnostic aid & patient support',
    icon: Heart
  },
  welfare: {
    key: 'welfare',
    label: 'Community Welfare & Food Drives',
    color: '#d97706',
    description: 'Essential ration packages, winter clothes, orphan care & widow relief',
    icon: HeartHandshake
  },
  madarsa: {
    key: 'madarsa',
    label: 'Religious & Institution Support',
    color: '#7c3aed',
    description: 'Madarsa infrastructure, Quranic education, libraries & seminar halls',
    icon: Building
  },
  empowerment: {
    key: 'empowerment',
    label: 'Women & Skill Empowerment',
    color: '#e11d48',
    description: 'Vocational training, sewing centers & self-reliance seed grants',
    icon: Sparkles
  },
  general: {
    key: 'general',
    label: 'General Trust Corpus Fund',
    color: '#475569',
    description: 'Emergency reserve, community outreach & operational trust missions',
    icon: ShieldCheck
  }
};

const BENCHMARK_MODEL_DATA = {
  yearlyTrends: [
    { year: '2023', amount: 5000, donationsCount: 1 },
    { year: '2024', amount: 15000, donationsCount: 3 },
    { year: '2025', amount: 28000, donationsCount: 5 },
    { year: '2026', amount: 45000, donationsCount: 7 }
  ],
  sectorBreakdown: [
    { key: 'education', name: 'Education & Scholarships', value: 42000, count: 6, color: '#047857' },
    { key: 'welfare', name: 'Community Welfare & Food Drives', value: 25000, count: 4, color: '#d97706' },
    { key: 'healthcare', name: 'Healthcare & Medical Relief', value: 14000, count: 3, color: '#0284c7' },
    { key: 'madarsa', name: 'Religious & Institution Support', value: 8000, count: 2, color: '#7c3aed' },
    { key: 'general', name: 'General Trust Corpus Fund', value: 4000, count: 1, color: '#475569' }
  ]
};

const CURRENT_CALENDAR_YEAR = '2026';
const DEFAULT_ANNUAL_GOAL = 50000;
const PRESET_GOALS = [10000, 25000, 50000, 100000, 250000];

export interface DonationImpactChartProps {
  userId?: string;
  onExploreCampaigns?: () => void;
  className?: string;
  showCardWrapper?: boolean;
}

export const DonationImpactChart: React.FC<DonationImpactChartProps> = ({
  userId,
  onExploreCampaigns,
  className = '',
  showCardWrapper = true
}) => {
  const { currentUser } = useAuth();
  const effectiveUid = userId || currentUser?.uid;

  const storageKey = effectiveUid ? `fet_donor_annual_goal_${effectiveUid}` : 'fet_donor_annual_goal_guest';

  const [annualGoal, setAnnualGoal] = useState<number>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ANNUAL_GOAL;
  });

  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [customGoalInput, setCustomGoalInput] = useState<string>('');

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setAnnualGoal(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }
    setAnnualGoal(DEFAULT_ANNUAL_GOAL);
  }, [storageKey]);

  const [rawDonations, setRawDonations] = useState<CampaignDonation[]>([]);
  const [activeTab, setActiveTab] = useState<'both' | 'trends' | 'sectors'>('both');
  const [trendChartType, setTrendChartType] = useState<'bar' | 'area'>('bar');
  const [useSampleModel, setUseSampleModel] = useState<boolean>(false);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!effectiveUid) {
      setUseSampleModel(true);
      return;
    }

    try {
      const colRef = collection(db, 'campaign_donations');
      const q = query(colRef, where('donorUid', '==', effectiveUid));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: CampaignDonation[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as CampaignDonation;
            list.push({ ...data, id: doc.id });
          });

          list.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeA - timeB;
          });

          setRawDonations(list);
          if (list.length === 0) {
            setUseSampleModel(true);
          } else {
            setUseSampleModel(false);
          }
        },
        (err) => {
          console.warn('Error fetching donor donations for impact chart:', err);
          setUseSampleModel(true);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to subscribe to donations:', e);
      setUseSampleModel(true);
    }
  }, [effectiveUid]);

  const categorizeCause = (title?: string, category?: string): string => {
    const text = `${title || ''} ${category || ''}`.toLowerCase();
    if (text.includes('scholarship') || text.includes('education') || text.includes('tuition') || text.includes('student') || text.includes('school')) {
      return 'education';
    }
    if (text.includes('medical') || text.includes('health') || text.includes('hospital') || text.includes('dialysis') || text.includes('surgery')) {
      return 'healthcare';
    }
    if (text.includes('ration') || text.includes('food') || text.includes('orphan') || text.includes('widow') || text.includes('welfare') || text.includes('relief')) {
      return 'welfare';
    }
    if (text.includes('madarsa') || text.includes('mosque') || text.includes('quran') || text.includes('religious')) {
      return 'madarsa';
    }
    if (text.includes('women') || text.includes('sewing') || text.includes('empowerment') || text.includes('skill')) {
      return 'empowerment';
    }
    return 'general';
  };

  const chartData = useMemo(() => {
    if (useSampleModel || rawDonations.length === 0) {
      const totalAmount = BENCHMARK_MODEL_DATA.sectorBreakdown.reduce((acc, curr) => acc + curr.value, 0);
      const totalCount = BENCHMARK_MODEL_DATA.yearlyTrends.reduce((acc, curr) => acc + curr.donationsCount, 0);
      const topSector = BENCHMARK_MODEL_DATA.sectorBreakdown[0];

      return {
        isSample: true,
        yearlyTrends: BENCHMARK_MODEL_DATA.yearlyTrends,
        sectorBreakdown: BENCHMARK_MODEL_DATA.sectorBreakdown,
        totalContributed: totalAmount,
        totalDonationsCount: totalCount,
        topSector: topSector.name,
        taxExemptAmount: totalAmount,
        yearsActiveCount: BENCHMARK_MODEL_DATA.yearlyTrends.length
      };
    }

    const yearlyMap: Record<string, { year: string; amount: number; donationsCount: number }> = {};
    const sectorMap: Record<string, { value: number; count: number }> = {};

    let totalSum = 0;
    let countSum = 0;

    rawDonations.forEach((donation) => {
      const status = (donation.paymentStatus || 'verified').toLowerCase();
      if (status === 'failed' || status === 'refunded' || status === 'cancelled') return;

      const amt = Number(donation.amount) || 0;
      if (amt <= 0) return;

      totalSum += amt;
      countSum += 1;

      let year = '2026';
      if (donation.createdAt) {
        const d = new Date(donation.createdAt);
        if (!isNaN(d.getFullYear())) {
          year = String(d.getFullYear());
        }
      }

      if (!yearlyMap[year]) {
        yearlyMap[year] = { year, amount: 0, donationsCount: 0 };
      }
      yearlyMap[year].amount += amt;
      yearlyMap[year].donationsCount += 1;

      const sectorKey = categorizeCause(donation.campaignTitle, donation.category);
      if (!sectorMap[sectorKey]) {
        sectorMap[sectorKey] = { value: 0, count: 0 };
      }
      sectorMap[sectorKey].value += amt;
      sectorMap[sectorKey].count += 1;
    });

    const yearlyTrends = Object.values(yearlyMap).sort((a, b) => Number(a.year) - Number(b.year));

    if (yearlyTrends.length === 0) {
      yearlyTrends.push({ year: '2026', amount: totalSum, donationsCount: countSum });
    }

    const sectorBreakdown = Object.entries(sectorMap).map(([key, data]) => {
      const meta = IMPACT_SECTORS[key] || IMPACT_SECTORS.general;
      return {
        key,
        name: meta.label,
        value: data.value,
        count: data.count,
        color: meta.color
      };
    }).sort((a, b) => b.value - a.value);

    if (sectorBreakdown.length === 0) {
      sectorBreakdown.push({
        key: 'general',
        name: 'General Trust Corpus Fund',
        value: totalSum,
        count: countSum,
        color: IMPACT_SECTORS.general.color
      });
    }

    const top = sectorBreakdown[0];

    return {
      isSample: false,
      yearlyTrends,
      sectorBreakdown,
      totalContributed: totalSum,
      totalDonationsCount: countSum,
      topSector: top ? top.name : 'Education & Scholarships',
      taxExemptAmount: totalSum,
      yearsActiveCount: yearlyTrends.length
    };
  }, [rawDonations, useSampleModel]);

  const formatINR = (val: number) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  // Current Year giving calculation for the Donation Goal Tracker
  const currentYearTrend = chartData.yearlyTrends.find((y) => y.year === CURRENT_CALENDAR_YEAR);
  const currentYearAmount = currentYearTrend ? currentYearTrend.amount : 0;
  const currentYearDonationsCount = currentYearTrend ? currentYearTrend.donationsCount : 0;

  const goalProgressPct = Math.round((currentYearAmount / (annualGoal || 1)) * 100);
  const visualProgressPct = Math.min(100, Math.max(0, goalProgressPct));
  const isGoalMet = currentYearAmount >= annualGoal;
  const remainingToGoal = Math.max(0, annualGoal - currentYearAmount);
  const surplusAmount = Math.max(0, currentYearAmount - annualGoal);

  const handleSaveGoal = (newGoal: number) => {
    if (newGoal <= 0) return;
    setAnnualGoal(newGoal);
    setIsEditingGoal(false);
    try {
      localStorage.setItem(storageKey, String(newGoal));
    } catch (e) {
      console.warn('Could not persist annual donation goal:', e);
    }
  };

  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-800 pb-1">
            <span className="text-amber-300">Financial Year {label}</span>
            <span className="text-slate-400 font-mono">{data.donationsCount} contribution{data.donationsCount === 1 ? '' : 's'}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <span className="text-slate-300">Total Donated:</span>
            <span className="font-extrabold text-emerald-400 text-sm font-mono">{formatINR(data.amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
            <span>80G Exemption:</span>
            <span className="text-amber-200">100% Tax Deductible</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomSectorTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = chartData.totalContributed > 0
        ? Math.round((data.value / chartData.totalContributed) * 100)
        : 0;

      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <div className="flex items-center gap-2 font-bold border-b border-slate-800 pb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-white text-xs">{data.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Amount:</span>
            <span className="font-extrabold text-emerald-400 text-sm font-mono">{formatINR(data.value)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
            <span>Sector Share:</span>
            <span className="font-bold text-amber-300">{pct}% of total</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
            <span>Contributions:</span>
            <span className="font-mono">{data.count} drive{data.count === 1 ? '' : 's'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const innerContent = (
    <div className={`space-y-6 ${className}`} id="donation-impact-chart-container">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Philanthropic Impact & Donation Analytics</span>
                {chartData.isSample && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Demonstration Model
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Official visualization of your yearly contribution trends, sector allocations, and 80G tax deductions.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {rawDonations.length === 0 && (
            <button
              type="button"
              onClick={() => setUseSampleModel(!useSampleModel)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="Toggle between real ledger and demonstration model"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{useSampleModel ? 'View Real Ledger' : 'View Demo Model'}</span>
            </button>
          )}

          {/* Tab Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'trends' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Trends</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sectors')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'sectors' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Sectors</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Impact Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/70 space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Donated</span>
            <BadgeDollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
            {formatINR(chartData.totalContributed)}
          </div>
          <p className="text-[10px] text-emerald-800 font-medium">
            Across {chartData.totalDonationsCount} contribution{chartData.totalDonationsCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-200/70 space-y-1">
          <div className="flex items-center justify-between text-sky-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Impact Sector</span>
            <GraduationCap className="w-4 h-4 text-sky-700" />
          </div>
          <div className="text-sm sm:text-base font-black text-slate-900 truncate" title={chartData.topSector}>
            {chartData.topSector}
          </div>
          <p className="text-[10px] text-sky-800 font-medium">
            Primary focus of philanthropic aid
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/70 space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">80G Tax Exemption</span>
            <ShieldCheck className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
            {formatINR(chartData.taxExemptAmount)}
          </div>
          <p className="text-[10px] text-amber-800 font-medium">
            100% Tax Deductible (Sec 80G)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/70 space-y-1">
          <div className="flex items-center justify-between text-purple-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Philanthropic Span</span>
            <Calendar className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
            {chartData.yearsActiveCount} {chartData.yearsActiveCount === 1 ? 'Year' : 'Years'}
          </div>
          <p className="text-[10px] text-purple-800 font-medium">
            Continuous support track record
          </p>
        </div>
      </div>

      {/* ============================================================= */}
      {/* DONATION GOAL TRACKER PROGRESS BAR COMPONENT                  */}
      {/* ============================================================= */}
      <div 
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-md border border-slate-700/60 relative overflow-hidden space-y-4"
        id="donation-goal-tracker-card"
      >
        {/* Decorative backdrop elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div 
              className={`p-2.5 rounded-2xl shrink-0 transition-colors ${
                isGoalMet 
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isGoalMet ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                  <span>Donation Goal Tracker</span>
                  <span className="text-xs font-mono font-bold text-slate-300">({CURRENT_CALENDAR_YEAR})</span>
                </h4>
                {isGoalMet ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    <Sparkles className="w-3 h-3" />
                    Target Achieved!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    {goalProgressPct}% Achieved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Track your personal philanthropic progress towards your annual contribution milestone.
              </p>
            </div>
          </div>

          {/* Adjust Target Button */}
          <div className="relative z-10 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsEditingGoal(!isEditingGoal);
                setCustomGoalInput(String(annualGoal));
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Adjust your annual giving target"
              id="btn-toggle-goal-settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
              <span>{isEditingGoal ? 'Close Settings' : 'Set Goal'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Target Configuration Drawer */}
        {isEditingGoal && (
          <div className="relative z-10 p-4 rounded-2xl bg-slate-950/80 border border-slate-700/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                Select or Customize Annual Contribution Target (FY {CURRENT_CALENDAR_YEAR})
              </span>
              <span className="text-slate-400 text-[11px]">Eligible for 80G tax receipt</span>
            </div>

            {/* Target Presets */}
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_GOALS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSaveGoal(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    annualGoal === preset
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {annualGoal === preset && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{formatINR(preset)}</span>
                </button>
              ))}
            </div>

            {/* Custom Amount Field */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">₹</span>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={customGoalInput}
                  onChange={(e) => setCustomGoalInput(e.target.value)}
                  placeholder="Custom target amount"
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  id="input-custom-donation-goal"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(customGoalInput, 10);
                  if (!isNaN(val) && val > 0) {
                    handleSaveGoal(val);
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                id="btn-apply-custom-goal"
              >
                Apply Custom Goal
              </button>
              <button
                type="button"
                onClick={() => handleSaveGoal(DEFAULT_ANNUAL_GOAL)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset to default ₹50,000 target"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to ₹50k</span>
              </button>
            </div>
          </div>
        )}

        {/* Visual Progress Bar Section */}
        <div className="relative z-10 space-y-2">
          {/* Top Label & Amount Spread */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-semibold">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-300">Progress Towards Target:</span>
              <span className="font-extrabold text-white font-mono text-sm">
                {formatINR(currentYearAmount)}
              </span>
              <span className="text-slate-400 font-normal">of</span>
              <span className="font-extrabold text-amber-300 font-mono text-sm">
                {formatINR(annualGoal)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isGoalMet ? (
                <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>100% + Milestone Exceeded ({goalProgressPct}%)</span>
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {goalProgressPct}% Achieved • {formatINR(remainingToGoal)} remaining
                </span>
              )}
            </div>
          </div>

          {/* Styled Progress Bar Track */}
          <div className="relative w-full h-4 sm:h-5 bg-slate-950/80 rounded-full p-0.5 border border-slate-700/80 overflow-hidden shadow-inner">
            {/* Target Milestone Lines (25%, 50%, 75%) */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10 opacity-30">
              <div className="w-px h-full bg-white left-[25%] absolute" />
              <div className="w-px h-full bg-white left-[50%] absolute" />
              <div className="w-px h-full bg-white left-[75%] absolute" />
            </div>

            {/* Animated Progress Fill */}
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                isGoalMet
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-300 shadow-md shadow-emerald-400/20'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-400'
              }`}
              style={{ width: `${Math.max(visualProgressPct, currentYearAmount > 0 ? 3 : 0)}%` }}
            >
              {/* Subtle Gloss Sheen */}
              <div className="absolute inset-0 bg-white/20 rounded-full" />
            </div>
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
            <span>₹0 (0%)</span>
            <span className="hidden sm:inline">25%</span>
            <span>50%</span>
            <span className="hidden sm:inline">75%</span>
            <span className={isGoalMet ? 'text-amber-300 font-bold' : ''}>
              {formatINR(annualGoal)} (100%)
            </span>
          </div>
        </div>

        {/* Metric Badges & Direct Action Footer */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {CURRENT_CALENDAR_YEAR} Contributed
              </span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                {formatINR(currentYearAmount)}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-1 rounded-lg">
              {currentYearDonationsCount} {currentYearDonationsCount === 1 ? 'gift' : 'gifts'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {isGoalMet ? 'Surplus Beyond Goal' : 'Remaining To Goal'}
              </span>
              <span className={`text-sm font-extrabold font-mono ${isGoalMet ? 'text-amber-300' : 'text-slate-200'}`}>
                {isGoalMet ? `+${formatINR(surplusAmount)}` : formatINR(remainingToGoal)}
              </span>
            </div>
            <div className="text-right">
              {isGoalMet ? (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-1 rounded-lg border border-amber-400/30">
                  Target Met
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/30">
                  {Math.max(0, 100 - goalProgressPct)}% Left
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Target Status
              </span>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {isGoalMet ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Goal Completed</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>In Progress</span>
                  </>
                )}
              </div>
            </div>
            {onExploreCampaigns && (
              <button
                type="button"
                onClick={onExploreCampaigns}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-xs"
                id="btn-goal-contribute"
              >
                <span>Contribute</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Visualizations Area */}
      {rawDonations.length === 0 && !useSampleModel ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h4 className="font-black text-slate-900 text-sm">No Donation Records Found Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your contributions directly fund educational scholarships, orphan care, and emergency healthcare relief across India with 80G tax benefits.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setUseSampleModel(true)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs cursor-pointer"
            >
              View Sample Impact Visualization
            </button>
            {onExploreCampaigns && (
              <button
                type="button"
                onClick={onExploreCampaigns}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Support a Campaign</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Yearly Donation Trends */}
          {(activeTab === 'both' || activeTab === 'trends') && (
            <div className={`${activeTab === 'both' ? 'lg:col-span-7' : 'lg:col-span-12'} bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-700" />
                    <span>Yearly Contribution Trends</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Annual cumulative charitable disbursements (INR)
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setTrendChartType('bar')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      trendChartType === 'bar' ? 'bg-emerald-800 text-white shadow-xs' : 'hover:bg-slate-50'
                    }`}
                  >
                    Bars
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendChartType('area')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      trendChartType === 'area' ? 'bg-emerald-800 text-white shadow-xs' : 'hover:bg-slate-50'
                    }`}
                  >
                    Curve
                  </button>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {trendChartType === 'bar' ? (
                    <BarChart
                      data={chartData.yearlyTrends}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value >= 1000 ? `${value / 1000}k` : value}`}
                      />
                      <Tooltip content={<CustomTrendTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar
                        dataKey="amount"
                        name="Donation Amount"
                        fill="#047857"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={chartData.yearlyTrends}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="donationTrendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#047857" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value >= 1000 ? `${value / 1000}k` : value}`}
                      />
                      <Tooltip content={<CustomTrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#047857"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#donationTrendGradient)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
                  <span>Cumulative disbursements by calendar cycle</span>
                </span>
                <span className="font-semibold text-slate-700">Official INR Record</span>
              </div>
            </div>
          )}

          {/* Chart 2: Impact Sectors Distribution */}
          {(activeTab === 'both' || activeTab === 'sectors') && (
            <div className={`${activeTab === 'both' ? 'lg:col-span-5' : 'lg:col-span-12'} bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4`}>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-sky-700" />
                  <span>Impact Sector Allocation</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Cause-wise philanthropic deployment breakdown
                </p>
              </div>

              <div className="h-56 sm:h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomSectorTooltip />} />
                    <Pie
                      data={chartData.sectorBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                    >
                      {chartData.sectorBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.key}-${index}`}
                          fill={entry.color}
                          stroke="#ffffff"
                          strokeWidth={activePieIndex === index ? 3 : 1.5}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                    {formatINR(chartData.totalContributed)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {chartData.sectorBreakdown.map((sec, idx) => {
                  const pct = chartData.totalContributed > 0
                    ? Math.round((sec.value / chartData.totalContributed) * 100)
                    : 0;
                  return (
                    <div
                      key={sec.key}
                      onMouseEnter={() => setActivePieIndex(idx)}
                      onMouseLeave={() => setActivePieIndex(null)}
                      className={`flex items-center justify-between text-xs p-2 rounded-xl transition-colors ${
                        activePieIndex === idx ? 'bg-white shadow-xs border border-slate-200' : 'hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sec.color }}
                        />
                        <span className="font-semibold text-slate-800 truncate text-[11px]">
                          {sec.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {formatINR(sec.value)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/60 text-slate-700 min-w-8 text-center">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sector Detailed Descriptions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {chartData.sectorBreakdown.slice(0, 3).map((item) => {
          const meta = IMPACT_SECTORS[item.key] || IMPACT_SECTORS.general;
          const IconComp = meta.icon;
          return (
            <div
              key={item.key}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3"
            >
              <div
                className="p-2 rounded-xl text-white shrink-0 shadow-xs"
                style={{ backgroundColor: meta.color }}
              >
                <IconComp className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-bold text-xs text-slate-900 truncate">
                    {meta.label}
                  </h5>
                  <span className="text-[10px] font-mono font-bold text-emerald-800">
                    {formatINR(item.value)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {meta.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Compliance Footer Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Statutory Compliance: Registered under DARPAN <strong>JK/2026/1153821</strong> • PAN <strong>AABTF0015H</strong>.
          </span>
        </div>
        <div className="flex items-center gap-3 font-semibold text-emerald-800 shrink-0">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Form 10BE Ready</span>
          </span>
          {onExploreCampaigns && (
            <button
              type="button"
              onClick={onExploreCampaigns}
              className="hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Active Drives</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return innerContent;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
      {innerContent}
    </div>
  );
};
