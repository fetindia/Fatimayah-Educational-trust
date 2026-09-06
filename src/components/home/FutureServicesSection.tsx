/**
 * @license
 * Future Services Section (FET Store & FET Travel)
 * Fatimyah Educational Trust India (FET India)
 * Education • Service • Empowerment
 * 
 * NOTE: Automatically remains HIDDEN while corresponding modules are disabled.
 */

import React from 'react';
import { 
  ShoppingBag, 
  Compass, 
  BookOpen, 
  Sparkles, 
  Plane, 
  Shirt, 
  Heart, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useModules } from '../../contexts/ModuleContext';
import { useConfig } from '../../contexts/ConfigContext';

export const FutureServicesSection: React.FC = () => {
  const { config } = useConfig();
  const { getModuleByCode } = useModules();

  const storeModule = getModuleByCode('m-ecommerce');
  const travelModule = getModuleByCode('m-travel');

  const isStoreVisible = storeModule?.lifecycle === 'PUBLISHED' && storeModule?.isPubliclyVisible;
  const isTravelVisible = travelModule?.lifecycle === 'PUBLISHED' && travelModule?.isPubliclyVisible;

  // STRICT REQUIREMENT: These future services must automatically remain hidden while their modules are disabled.
  if (!isStoreVisible && !isTravelVisible) {
    return null;
  }

  const primaryGreen = config.primaryGreen || '#0D6E42';
  const primaryBlue = config.primaryBlue || '#0B2545';
  const accentAmber = config.accentAmber || '#D97706';

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-200" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
            <Sparkles className="w-4 h-4 text-amber-800" />
            <span>Authorized Value-Added Trust Services</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            FET Community Services & Portfolios
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            All proceeds and surpluses from authorized trust services directly support the FET Higher Education Scholarship Endowment.
          </p>
        </div>

        {/* Dynamic Services Grid */}
        <div className={`grid gap-8 ${isStoreVisible && isTravelVisible ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
          
          {/* Service Card 1: FET Store */}
          {isStoreVisible && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: primaryGreen }}
                  >
                    <ShoppingBag className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                    FET Official Store
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    FET Community Store & Publications
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Authentic garments, modest Islamic wear, certified non-alcoholic perfumes (attar), and classical academic & spiritual literature.
                  </p>
                </div>

                {/* Sub-portfolios */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <Shirt className="w-4 h-4 text-emerald-700" />
                    <h5 className="text-xs font-bold text-slate-900">Garments & Modest Wear</h5>
                    <p className="text-[11px] text-slate-500">Premium quality apparel, abayas, and institutional uniforms.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h5 className="text-xs font-bold text-slate-900">Pure Attar & Fragrances</h5>
                    <p className="text-[11px] text-slate-500">Traditional alcohol-free artisan perfumes & concentrates.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <h5 className="text-xs font-bold text-slate-900">Books & Academic Texts</h5>
                    <p className="text-[11px] text-slate-500">Islamic jurisprudence, history, translations & school textbooks.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <h5 className="text-xs font-bold text-slate-900">100% Non-Profit</h5>
                    <p className="text-[11px] text-slate-500">Revenues channel directly into minority scholarships.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Nationwide Express Delivery</span>
                <button
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Browse Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Service Card 2: FET Travel */}
          {isTravelVisible && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: primaryBlue }}
                  >
                    <Plane className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
                    FET Pilgrimage & Travel
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Umrah & Sacred Ziyarat Delegations
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Guided spiritual pilgrimage journeys with senior scholarly guides, 5-star proximity accommodations, medical accompany, and visa logistics.
                  </p>
                </div>

                {/* Sub-portfolios */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <Compass className="w-4 h-4 text-blue-700" />
                    <h5 className="text-xs font-bold text-slate-900">Umrah Delegations</h5>
                    <p className="text-[11px] text-slate-500">Makkah & Madinah departures with scholarly guidance.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <h5 className="text-xs font-bold text-slate-900">Holy Ziyarat (Iraq & Iran)</h5>
                    <p className="text-[11px] text-slate-500">Karbala, Najaf, Mashhad & Qom comprehensive packages.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <h5 className="text-xs font-bold text-slate-900">Direct Visa & Flight Sync</h5>
                    <p className="text-[11px] text-slate-500">Complete end-to-end transparent regulatory paperwork.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <h5 className="text-xs font-bold text-slate-900">Medical Escort on Board</h5>
                    <p className="text-[11px] text-slate-500">Dedicated doctor and elderly assistance team included.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Official Ministry Authorized</span>
                <button
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Inquire Pilgrimage Itinerary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
