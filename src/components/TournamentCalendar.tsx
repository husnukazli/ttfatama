import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Trophy, 
  Users, 
  ChevronRight, 
  Search,
  Filter
} from 'lucide-react';
import { Atama } from '../types';

interface TournamentCalendarProps {
  assignments: Atama[];
  onSelectAssignment: (assignment: Atama) => void;
  onFilterByCity: (city: string) => void;
  onOpenCreateTournament?: () => void;
}

interface GroupedTournament {
  id: string;
  tarih: string;
  tarihEtiket?: string;
  ay: string;
  kategori: string;
  tesis: string;
  sehir: string;
  supervisor: string;
  supervisorKokart: string;
  crewCount: number;
  crew: Atama[];
  isCancelled?: boolean;
}

export const TournamentCalendar: React.FC<TournamentCalendarProps> = ({
  assignments,
  onSelectAssignment,
  onFilterByCity,
  onOpenCreateTournament
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('TÜMÜ');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  // Group assignments into unique tournaments by (tarih + tesis + kategori)
  const tournaments = useMemo(() => {
    const map = new Map<string, GroupedTournament>();

    assignments.forEach(a => {
      const key = `${a.tarih}_${a.tesis}_${a.kategori}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          tarih: a.tarih,
          tarihEtiket: a.tarih_etiket,
          ay: a.ay,
          kategori: a.kategori,
          tesis: a.tesis,
          sehir: a.sehir,
          supervisor: (a.gorev === 'SUPERVISOR' || a.gorev === 'REF') ? a.hakem : '',
          supervisorKokart: (a.gorev === 'SUPERVISOR' || a.gorev === 'REF') ? (a.kokart_ref || a.kokart_chair || '') : '',
          crewCount: 0,
          crew: [],
          isCancelled: a.durum === 'İPTAL'
        });
      }

      const tourney = map.get(key)!;
      if (a.durum !== 'İPTAL') {
        tourney.crewCount += 1;
        tourney.isCancelled = false;
      }
      tourney.crew.push(a);

      if (!tourney.supervisor && (a.gorev === 'SUPERVISOR' || a.gorev === 'REF')) {
        tourney.supervisor = a.hakem;
        tourney.supervisorKokart = a.kokart_ref || a.kokart_chair || '';
      }
    });

    return Array.from(map.values()).sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [assignments]);

  const activeTournamentsCount = useMemo(
    () => tournaments.filter(t => !t.isCancelled).length,
    [tournaments]
  );

  // Filter tournaments
  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      if (selectedMonth !== 'TÜMÜ' && t.ay !== selectedMonth) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.tesis.toLowerCase().includes(q) ||
          t.sehir.toLowerCase().includes(q) ||
          t.kategori.toLowerCase().includes(q) ||
          t.supervisor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tournaments, selectedMonth, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Calendar Navigation & Filters */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>2026 Turnuva Takvimi ve Hakem Heyetleri</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Yıl genelindeki {activeTournamentsCount} aktif ({tournaments.length} toplam) turnuvanın haftalık dağılımı ve başhakemlikleri
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Turnuva, tesis veya şehir..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {onOpenCreateTournament && (
              <button
                onClick={onOpenCreateTournament}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>+ Turnuva Ekle</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedMonth('TÜMÜ')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedMonth === 'TÜMÜ'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tüm Sezon ({tournaments.length})
          </button>
          {months.map(m => {
            const count = tournaments.filter(t => t.ay === m).length;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedMonth === m
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {m} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTournaments.map(t => {
          const firstAssignment = t.crew[0];

          return (
            <div
              key={t.id}
              onClick={() => onSelectAssignment(firstAssignment)}
              className={`bg-white dark:bg-slate-800/90 rounded-xl p-5 border shadow-xs transition-all cursor-pointer flex flex-col justify-between group ${
                t.isCancelled
                  ? 'border-rose-300 dark:border-rose-800/80 opacity-85 hover:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {t.tarihEtiket ? `${t.tarihEtiket} · ${t.ay}` : `${t.tarih} · ${t.ay}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {t.isCancelled && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                        İPTAL
                      </span>
                    )}
                    <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{t.sehir}</span>
                    </span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-1 line-clamp-1">
                  {t.kategori}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-3 line-clamp-1">
                  {t.tesis}
                </h3>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Başhakem / Supervisor:
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{t.isCancelled ? 'İptal Edildi' : (t.supervisor || 'MHK Belirleyecek')}</span>
                    {t.supervisorKokart && !t.isCancelled && (
                      <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-700 dark:text-slate-300">
                        {t.supervisorKokart}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {t.crewCount}
                  </span>
                  <span>{t.isCancelled ? 'İptal Kaydı' : 'Hakem Atandı'}</span>
                </span>

                <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                  <span>Heyeti Gör</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
