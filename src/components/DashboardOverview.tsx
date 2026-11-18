import React from 'react';
import { 
  Trophy, 
  Users, 
  MapPin, 
  Calendar, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Atama, MetadataInfo, RefereeAccessMap, RefereeInfo } from '../types';
import { getRefereeAccessRecord } from '../utils/availability';

interface DashboardOverviewProps {
  assignments: Atama[];
  metadata: MetadataInfo;
  refereeProfiles: RefereeInfo[];
  refereeAccessMap: RefereeAccessMap;
  onSelectTab: (tab: 'matrix' | 'assignments' | 'myDuties' | 'calendar' | 'referees' | 'analytics') => void;
  onFilterByCity: (city: string) => void;
  onFilterByMonth: (month: string) => void;
  onFilterByBadge: (badge: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  assignments,
  metadata,
  refereeProfiles,
  refereeAccessMap,
  onSelectTab,
  onFilterByCity,
  onFilterByMonth,
  onFilterByBadge
}) => {
  const activeAssignments = assignments.filter(a => a.durum !== 'İPTAL');

  // Compute monthly breakdown
  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const monthlyCounts: Record<string, number> = {};
  months.forEach(m => monthlyCounts[m] = 0);
  activeAssignments.forEach(a => {
    if (monthlyCounts[a.ay] !== undefined) {
      monthlyCounts[a.ay] += 1;
    } else {
      monthlyCounts[a.ay] = 1;
    }
  });

  const maxMonthCount = Math.max(...Object.values(monthlyCounts), 1);

  // Compute kokart distribution
  const kokartCounts: Record<string, number> = {
    'WB (White Badge)': 0,
    'SB / SB-R (Silver)': 0,
    'BB / BB-R (Bronze)': 0,
    'Ulusal (N)': 0,
    'İl Hakemi (IL)': 0
  };

  activeAssignments.forEach(a => {
    const refK = (a.kokart_ref || '').toUpperCase();
    const chairK = (a.kokart_chair || '').toUpperCase();

    if (refK.includes('WB') || chairK.includes('WB')) {
      kokartCounts['WB (White Badge)'] += 1;
    } else if (refK.includes('SB') || chairK.includes('SB')) {
      kokartCounts['SB / SB-R (Silver)'] += 1;
    } else if (refK.includes('BB') || chairK.includes('BB')) {
      kokartCounts['BB / BB-R (Bronze)'] += 1;
    } else if (refK.includes('N') || chairK.includes('N')) {
      kokartCounts['Ulusal (N)'] += 1;
    } else {
      kokartCounts['İl Hakemi (IL)'] += 1;
    }
  });

  // Top Venues
  const venueCounts: Record<string, { count: number; city: string }> = {};
  activeAssignments.forEach(a => {
    const venue = a.tesis || 'Diğer';
    if (!venueCounts[venue]) {
      venueCounts[venue] = { count: 0, city: a.sehir };
    }
    venueCounts[venue].count += 1;
  });

  const sortedVenues = Object.entries(venueCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const activeCities = Array.from(new Set(activeAssignments.map(a => a.sehir).filter(Boolean)));

  // System-wide login & availability stats
  const enabledRefsCount = refereeProfiles.filter(
    r => getRefereeAccessRecord(refereeAccessMap, r.hakem)?.canLogin
  ).length;
  const availabilitySubmittedCount = refereeProfiles.filter(
    r => (getRefereeAccessRecord(refereeAccessMap, r.hakem)?.availability?.length || 0) > 0
  ).length;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Official Admin Welcome Card for TTF Uluslararası Atamalar */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
            <span>TÜRKİYE TENİS FEDERASYONU</span>
            <span aria-hidden="true">·</span>
            <span>YÖNETİCİ PORTALI</span>
            <span aria-hidden="true">·</span>
            <span>2026 SEZONU</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            TTF Uluslararası Atamalar
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            2026 uluslararası ve ulusal turnuva takviminde toplam{' '}
            <strong className="text-emerald-400 font-semibold">{metadata.toplam_turnuva_sayisi} aktif turnuva</strong> ve{' '}
            <span className="text-white font-medium">{activeAssignments.length} resmi hakem görevlendirmesi</span> yönetilmektedir.{' '}
            Şu anda <strong className="text-emerald-400">{enabledRefsCount} hakem</strong> sistem giriş yetkisine sahiptir ve{' '}
            <strong className="text-white">{availabilitySubmittedCount} hakem</strong> müsaitlik aralığı bildirmiştir.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectTab('matrix')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Haftalık Blok Matrisi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab('referees')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <span>Hakem Listesi, Toplu Ekleme & Şifre Yönetimi</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => onSelectTab('assignments')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <span>Tüm 2026 Atama Listesi</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Subtle decorative background watermarks or geometry */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <Trophy className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* 4 Core Quantitative KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Toplam Aktif Atama
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {metadata.toplam_aktif_atama}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>MHK onaylı resmi liste</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Tekil Lisanslı Hakem
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {metadata.tekil_hakem_sayisi}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>WB, SB, BB, Ulusal & İl</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Toplam Turnuva Sayısı
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {metadata.toplam_turnuva_sayisi}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>ITF, ATP, WTA ve Ulusal</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Turnuva Ev Sahibi İller
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {activeCities.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="truncate">
              {activeCities.slice(0, 4).join(', ') || 'Türkiye'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Monthly Chart & Badges Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Assignment Density (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2026 Sezonu Aylık Atama Dağılımı
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ocak - Aralık ayları boyunca haftalık turnuva hakem yoğunluğu
              </p>
            </div>
            <button
              onClick={() => onSelectTab('calendar')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Takvim Görünümü</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-3">
            {months.map(m => {
              const count = monthlyCounts[m] || 0;
              const pct = Math.round((count / maxMonthCount) * 100);

              return (
                <div 
                  key={m} 
                  onClick={() => {
                    onFilterByMonth(m);
                    onSelectTab('assignments');
                  }}
                  className="group flex items-center gap-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded-md transition-colors"
                >
                  <span className="w-16 font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                    {m}
                  </span>
                  <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700/60 rounded overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600/80 dark:bg-emerald-500/80 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-400 transition-all rounded"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kokart & Level Breakdown (1 Col) */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Kokart Seviyeleri
              </h2>
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              ITF ve TTF derecelerine göre görev atama dağılımı
            </p>

            <div className="space-y-4">
              {Object.entries(kokartCounts).map(([label, count]) => {
                const total = activeAssignments.length || 1;
                const ratio = Math.round((count / total) * 100);

                return (
                  <div 
                    key={label}
                    onClick={() => {
                      const code = label.split(' ')[0];
                      onFilterByBadge(code);
                      onSelectTab('assignments');
                    }}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      <span>{label}</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                        {count} ({ratio}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-900 dark:bg-emerald-500 rounded-full"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Toplam Hakem Havuzu</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {metadata.tekil_hakem_sayisi} Hakem
            </span>
          </div>
        </div>

      </div>

      {/* Secondary Row: Top Facilities & Key Upcoming Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Venues */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                En Çok Görevlendirilen Tesisler
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Uluslararası WTT, Challenger ve Ulusal organizasyon merkezleri
              </p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {sortedVenues.map(([venue, info], idx) => (
              <div 
                key={venue}
                onClick={() => {
                  onFilterByCity(info.city);
                  onSelectTab('assignments');
                }}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-slate-400 w-4">
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {venue}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {info.city}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {info.count} Atama
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlighted Landmark Tournaments */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Öne Çıkan Turnuva Görevleri
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Doğrulanmış özel ekipler ve başhakemlik atamaları
              </p>
            </div>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3">
            {/* Tourney 1: Ankara ATP Challenger ATAK PRO */}
            <div 
              onClick={() => onSelectTab('assignments')}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  ATP CHALLENGER (ATAK PRO)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  23.11.2026 · Ankara
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Başhakem: <strong className="text-slate-900 dark:text-white">İLKER ÖRT (REF)</strong> · Şef: ERKAN TARHAN · 5 ATP Kule Hakemi
              </div>
            </div>

            {/* Tourney 2: Antalya Club Alibey MT1000 */}
            <div 
              onClick={() => onSelectTab('matrix')}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  WORLD TEAM & MT1000 MASTERS (CLUB ALİBEY)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  Kasım 2026 · Antalya
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Uluslararası Masters Şampiyonası · Çoklu Hakem & Şef Kadrosu
              </div>
            </div>

            {/* Tourney 3: Antalya Megasaray 25K/35K */}
            <div 
              onClick={() => onSelectTab('assignments')}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  25K MEN / 35K WOMEN (MEGASARAY)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  05.01.2026 · Antalya
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Supervisor: <strong className="text-slate-900 dark:text-white">ALAADDİN BOYAR (WB)</strong> · Megasaray Tennis Academy
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
