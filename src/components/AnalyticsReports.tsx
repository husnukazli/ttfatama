import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  ShieldCheck, 
  Award, 
  MapPin, 
  Printer, 
  Download, 
  CheckCircle2 
} from 'lucide-react';
import { Atama, MetadataInfo, RefereeInfo } from '../types';

interface AnalyticsReportsProps {
  assignments: Atama[];
  metadata: MetadataInfo;
  refereeProfiles: RefereeInfo[];
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  assignments,
  metadata,
  refereeProfiles
}) => {
  // Cities distribution
  const cityCounts: Record<string, number> = {};
  assignments.forEach(a => {
    cityCounts[a.sehir] = (cityCounts[a.sehir] || 0) + 1;
  });

  const sortedCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1]);

  // Roles distribution
  const roleCounts: Record<string, number> = {};
  assignments.forEach(a => {
    roleCounts[a.gorev] = (roleCounts[a.gorev] || 0) + 1;
  });

  // Calculate average assignments per referee
  const totalAssignments = assignments.length;
  const uniqueRefs = refereeProfiles.length || 1;
  const avgPerRef = (totalAssignments / uniqueRefs).toFixed(1);

  // Top active referees
  const topReferees = refereeProfiles.slice(0, 10);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>MERKEZ HAKEM KURULU (MHK) YÖNETİM & DENETİM PANELİ</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            2026 Sezonu Atama ve Görev Dağılım Analizi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tüm Türkiye geneli hakem istatistikleri, adil rotasyon denetimi ve şehir yoğunluk raporları
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>MHK Raporunu Yazdır</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Toplam Görevlendirme</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {totalAssignments}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            100% Onaylı Program
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Aktif Hakem Sayısı</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {uniqueRefs}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Tekil Lisanslı Hakem
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hakem Başına Ortalama</div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {avgPerRef}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Görev / Hakem
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Turnuva Sayısı</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {metadata.toplam_turnuva_sayisi}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {metadata.toplam_turnuva_sayisi} Resmi Turnuva
          </div>
        </div>
      </div>

      {/* Two Column Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* City Breakdown */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Şehirlere Göre Görevlendirme Dağılımı
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Tenis merkezlerinin turnuva ve hakem kapasite dağılımı
          </p>

          <div className="space-y-3">
            {sortedCities.slice(0, 8).map(([city, count]) => {
              const maxCity = sortedCities[0][1] || 1;
              const pct = Math.round((count / maxCity) * 100);

              return (
                <div key={city} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{city}</span>
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white font-semibold tabular-nums">
                      {count} Atama ({Math.round((count / totalAssignments) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Görev Unvanları Dağılımı
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Başhakem, Hakem Şefi, Kule, Çizgi ve Uluslararası görev dağılımı
          </p>

          <div className="space-y-3">
            {Object.entries(roleCounts).map(([role, count]) => {
              const pct = Math.round((count / totalAssignments) * 100);

              return (
                <div key={role} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{role}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Toplam {count} görevlendirme
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                    %{pct}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Top 10 Active Referees Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          En Yüksek Görev Sayısına Sahip Hakemler (İlk 10)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Merkez Hakem Kurulu tarafından en çok tercih edilen deneyimli hakem heyeti
        </p>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {topReferees.map((ref, idx) => (
            <div key={ref.hakem} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400 w-5 font-bold">
                  {idx + 1}.
                </span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {ref.hakem}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {ref.hakem_sehir} · Ref: {ref.referee_badge || '-'} / Kule: {ref.chair_badge || '-'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                  {ref.toplam_atama} Görev
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
