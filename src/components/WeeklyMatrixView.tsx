import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  FileText,
  Eye,
  Award,
  MousePointerClick,
  Info,
  AlertTriangle,
  Settings,
  Globe,
  EyeOff,
  X
} from 'lucide-react';
import { Atama, CrewSlot, RefereeAccessMap, RefereeInfo, TournamentBlockData } from '../types';
import { RefereeAssignmentActionModal } from './RefereeAssignmentActionModal';
import { MatrixPrintPdfModal } from './MatrixPrintPdfModal';
import { TournamentEditModal } from './TournamentEditModal';
import {
  checkRefereeAvailability,
  checkSameDateTournamentConflict,
  getTournamentDateSpan,
  isAssignmentPublished,
  SAME_DATE_CONFLICT_WARNING,
  UNAVAILABLE_WEEK_WARNING
} from '../utils/availability';
import { getTourShortName, getTourTypeFromCategory, resolveTourPalette } from '../utils/tourColors';

export type { CrewSlot, TournamentBlockData };

interface WeeklyMatrixViewProps {
  assignments: Atama[];
  allReferees?: RefereeInfo[];
  refereeAccessMap?: RefereeAccessMap;
  currentReferee: string;
  onOpenDoc: (assignment: Atama) => void;
  onDeleteAssignment?: (assignmentId: number) => void;
  onSwapReferee?: (
    assignmentId: number, 
    newRef: { name: string; badgeRef?: string; badgeChair?: string; city?: string }
  ) => void;
  onChangeRole?: (assignmentId: number, newRole: string) => void;
  onMoveAssignment?: (assignmentId: number, targetTournament: TournamentBlockData) => void;
  onSaveTournamentChanges?: (
    originalTournamentKey: string,
    updatedAssignments: Atama[],
    newCustomReferees: RefereeInfo[]
  ) => void;
  onDeleteTournament?: (tournament: TournamentBlockData) => void;
  onTogglePublishTournament?: (tournament: TournamentBlockData, publish: boolean) => void;
  onViewRefereeProfile?: (refName: string) => void;
}

const MONTH_RANGES: { label: string; start: string; end: string }[] = [
  { label: 'Ocak', start: '2026-01-01', end: '2026-01-31' },
  { label: 'Şubat', start: '2026-02-01', end: '2026-02-28' },
  { label: 'Mart', start: '2026-03-01', end: '2026-03-31' },
  { label: 'Nisan', start: '2026-04-01', end: '2026-04-30' },
  { label: 'Mayıs', start: '2026-05-01', end: '2026-05-31' },
  { label: 'Haziran', start: '2026-06-01', end: '2026-06-30' },
  { label: 'Temmuz', start: '2026-07-01', end: '2026-07-31' },
  { label: 'Ağustos', start: '2026-08-01', end: '2026-08-31' },
  { label: 'Eylül', start: '2026-09-01', end: '2026-09-30' },
  { label: 'Ekim', start: '2026-10-01', end: '2026-10-31' },
  { label: 'Kasım', start: '2026-11-01', end: '2026-11-30' },
  { label: 'Aralık', start: '2026-12-01', end: '2026-12-31' }
];

export const WeeklyMatrixView: React.FC<WeeklyMatrixViewProps> = ({
  assignments,
  allReferees = [],
  refereeAccessMap = {},
  currentReferee,
  onOpenDoc,
  onDeleteAssignment,
  onSwapReferee,
  onChangeRole,
  onMoveAssignment,
  onSaveTournamentChanges,
  onDeleteTournament,
  onTogglePublishTournament,
  onViewRefereeProfile
}) => {
  // Date range filter state (defaults to full 2026 season Jan–Dec from PDF)
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');
  const [selectedTourType, setSelectedTourType] = useState<string>('ALL');
  const [publishFilter, setPublishFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [highlightRef, setHighlightRef] = useState<string>('');
  const [showCancelled, setShowCancelled] = useState<boolean>(true);

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [editingTournament, setEditingTournament] = useState<TournamentBlockData | null>(null);
  const [editingMiddleNote, setEditingMiddleNote] = useState<{
    tour: TournamentBlockData;
    text: string;
  } | null>(null);
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<{
    assignment: Atama;
    tournament: TournamentBlockData;
  } | null>(null);

  // Format Turkish date label e.g. "9 Kasım", "23 Kasım"
  const formatTurkishDateLabel = (dateStr: string, ay: string): string => {
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      const day = parseInt(parts[2], 10);
      return `${day} ${ay}`;
    }
    return `${dateStr} ${ay}`;
  };

  // Convert raw assignments into structured tournament blocks matching the 2026 PDF
  const tournamentBlocks = useMemo(() => {
    const map = new Map<string, TournamentBlockData>();

    assignments.forEach(a => {
      const key = `${a.tarih}_${a.tesis}_${a.kategori}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          tarih: a.tarih,
          baslangicTarih: a.baslangic_tarih,
          bitisTarih: a.bitis_tarih,
          tarihLabel: a.tarih_etiket || formatTurkishDateLabel(a.tarih, a.ay),
          ay: a.ay,
          sehir: a.sehir,
          kategori: a.kategori,
          tesis: a.tesis,
          tourType: getTourTypeFromCategory(a.kategori),
          colorTheme: a.kart_renk,
          supervisor: '',
          hakemSefi: '',
          assRef: '',
          crewCol1: [],
          crewCol2: [],
          crewCol3: [],
          designatedSlots: [],
          rawAssignments: [],
          isCancelled: a.durum === 'İPTAL',
          isPublished: isAssignmentPublished(a),
          atpLevel: a.notlar?.includes('ATP 50') ? 'ATP 50' : a.notlar?.includes('ATP 100') ? 'ATP 100' : a.notlar?.includes('ATP 125') ? 'ATP 125' : 'ATP 75',
          ortaNot: a.orta_not || undefined
        });
      }

      const tour = map.get(key)!;
      tour.rawAssignments.push(a);
      if (a.baslangic_tarih && !tour.baslangicTarih) tour.baslangicTarih = a.baslangic_tarih;
      if (a.bitis_tarih && !tour.bitisTarih) tour.bitisTarih = a.bitis_tarih;
      if (a.kart_renk) tour.colorTheme = a.kart_renk;
      if (a.durum === 'İPTAL') tour.isCancelled = true;
      if (a.orta_not && !tour.ortaNot) tour.ortaNot = a.orta_not;
      tour.isPublished = tour.rawAssignments.some(item => isAssignmentPublished(item));
      if (a.notlar?.includes('ATP 50')) tour.atpLevel = 'ATP 50';
      else if (a.notlar?.includes('ATP 100')) tour.atpLevel = 'ATP 100';
      else if (a.notlar?.includes('ATP 125')) tour.atpLevel = 'ATP 125';

      const slot: CrewSlot = {
        assignment: a,
        hakem: a.hakem,
        role: a.gorev
      };

      const roleUpper = (a.gorev || '').toUpperCase();
      const noteUpper = (a.notlar || '').toUpperCase();
      const isDesignatedSlot =
        roleUpper === 'DESIGNATED' ||
        (noteUpper.includes('DESIGNATED') &&
          roleUpper !== 'SUPERVISOR' &&
          !roleUpper.includes('ŞEF') &&
          !roleUpper.includes('CHIEF') &&
          !roleUpper.includes('ASS') &&
          !roleUpper.includes('YRD'));

      if (isDesignatedSlot) {
        if (!tour.designatedSlots) tour.designatedSlots = [];
        tour.designatedSlots.push(slot);
      } else if (roleUpper === 'SUPERVISOR') {
        if (!tour.supervisorSlot) {
          tour.supervisor = a.hakem;
          tour.supervisorSlot = slot;
        } else {
          distributeCrewSlot(tour, slot, a.notlar);
        }
      } else if (roleUpper === 'REF') {
        if (tour.tourType === 'ATP_CHALLENGER' || tour.tourType === 'WTA') {
          tour.assRef = a.hakem;
          tour.assRefSlot = slot;
        } else if (!tour.supervisorSlot) {
          tour.supervisor = a.hakem;
          tour.supervisorSlot = slot;
        } else {
          distributeCrewSlot(tour, slot, a.notlar);
        }
      } else if (roleUpper.includes('ŞEF') || roleUpper.includes('CHIEF')) {
        tour.hakemSefi = a.hakem;
        tour.hakemSefiSlot = slot;
      } else if (roleUpper.includes('ASS') || roleUpper.includes('YRD')) {
        tour.assRef = a.hakem;
        tour.assRefSlot = slot;
      } else {
        distributeCrewSlot(tour, slot, a.notlar);
      }
    });

    function distributeCrewSlot(tour: TournamentBlockData, slot: CrewSlot, notlar?: string) {
      const upper = (notlar || '').toUpperCase();
      if (upper.includes('SÜTUN:1') || upper.includes('SALI-CUMA')) {
        tour.crewCol1.push(slot);
        return;
      }
      if (upper.includes('SÜTUN:2')) {
        tour.crewCol2.push(slot);
        return;
      }
      if (upper.includes('SÜTUN:3') || upper.includes('SALI-PERŞEMBE')) {
        tour.crewCol3.push(slot);
        return;
      }
      if (tour.crewCol1.length <= tour.crewCol2.length && tour.crewCol1.length <= tour.crewCol3.length) {
        tour.crewCol1.push(slot);
      } else if (tour.crewCol2.length <= tour.crewCol3.length) {
        tour.crewCol2.push(slot);
      } else {
        tour.crewCol3.push(slot);
      }
    }

    // Make sure supervisor label is populated appropriately
    map.forEach(t => {
      if (!t.supervisorSlot && t.rawAssignments.length > 0) {
        if (t.tourType === 'ATP_CHALLENGER') {
          t.supervisor = 'ATP';
        } else if (t.tourType === 'WTA') {
          t.supervisor = 'WTA';
        } else {
          t.supervisor = t.rawAssignments[0].hakem;
          t.supervisorSlot = {
            assignment: t.rawAssignments[0],
            hakem: t.rawAssignments[0].hakem,
            role: t.rawAssignments[0].gorev
          };
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [assignments]);

  // Filter blocks by date range, tour type, publish status, and cancellation visibility
  const filteredBlocks = useMemo(() => {
    return tournamentBlocks.filter(b => {
      if (!showCancelled && b.isCancelled) return false;
      if (publishFilter === 'PUBLISHED' && !b.isPublished) return false;
      if (publishFilter === 'DRAFT' && b.isPublished) return false;
      if (startDate && b.tarih < startDate) return false;
      if (endDate && b.tarih > endDate) return false;
      if (selectedTourType !== 'ALL' && b.tourType !== selectedTourType) return false;
      return true;
    });
  }, [tournamentBlocks, startDate, endDate, selectedTourType, showCancelled, publishFilter]);

  // Group filtered blocks by Week / Tarih
  const groupedWeeks = useMemo(() => {
    const weekMap = new Map<string, TournamentBlockData[]>();

    filteredBlocks.forEach(b => {
      const weekKey = b.tarihLabel;
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(b);
    });

    return Array.from(weekMap.entries()).map(([label, blocks]) => ({
      weekLabel: label,
      primaryDate: blocks[0]?.tarih || '',
      blocks
    })).sort((a, b) => a.primaryDate.localeCompare(b.primaryDate));
  }, [filteredBlocks]);

  // Total statistics for selected date range (active non-cancelled count)
  const activeBlocksInRange = filteredBlocks.filter(b => !b.isCancelled);
  const cancelledBlocksInRange = filteredBlocks.filter(b => b.isCancelled);
  const totalTournamentsInRange = activeBlocksInRange.length;
  const totalAssignmentsInRange = activeBlocksInRange.reduce((acc, b) => acc + b.rawAssignments.length, 0);

  // Quick preset ranges
  const handleApplyFullYear = () => {
    setStartDate('2026-01-01');
    setEndDate('2026-12-31');
    setSelectedTourType('ALL');
  };

  const handleApplyMonth = (m: { start: string; end: string }) => {
    setStartDate(m.start);
    setEndDate(m.end);
  };

  const isHighlighted = (name?: string) => {
    if (!highlightRef || !name) return false;
    return name.toUpperCase().includes(highlightRef.toUpperCase().trim());
  };

  // Open referee action popup
  const handleSlotClick = (slot: CrewSlot | undefined, tour: TournamentBlockData) => {
    if (!slot) return;
    setSelectedSlotForAction({
      assignment: slot.assignment,
      tournament: tour
    });
  };

  return (
    <div className="space-y-6 pb-16">
      <div className={isPrintModalOpen ? 'no-print space-y-6' : 'space-y-6'}>
      
      {/* 1. TOP HEADER & FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
              <Trophy className="w-4 h-4" />
              <span>TÜRKİYE TENİS FEDERASYONU · MERKEZ HAKEM KURULU</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Haftalık Turnuva Blok Matrisi (Genel Görünüm)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Turnuva tipine göre renklendirilmiş resmi haftalık hakem panosu · Hakem isimlerine tıklayarak <strong>Kaldır</strong>, <strong>Değiştir</strong> veya <strong>Taşı</strong> yapabilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleApplyFullYear}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                startDate === '2026-01-01' && endDate === '2026-12-31'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              Tüm Yıl 2026 (Ocak–Aralık)
            </button>

            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value as 'ALL' | 'PUBLISHED' | 'DRAFT')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Yayın durumuna göre filtrele"
            >
              <option value="ALL">Tüm Yayın Durumları</option>
              <option value="PUBLISHED">Yayınlananlar</option>
              <option value="DRAFT">Taslaklar (Yayınlanmamış)</option>
            </select>

            <button
              type="button"
              onClick={() => setShowCancelled(prev => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                showCancelled
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {showCancelled ? 'İptal Turnuvalar Görünür' : 'İptal Turnuvalar Gizli'}
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Görünümü Yazdır / PDF</span>
            </button>
          </div>
        </div>

        {/* 12-Month Quick Navigation Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Hızlı Ay Seçimi:
          </span>
          {MONTH_RANGES.map(m => {
            const isActive = startDate === m.start && endDate === m.end;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => handleApplyMonth(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Date Range Inputs & Referee Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Tournament Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Turnuva Tipi Filtresi
            </label>
            <select
              value={selectedTourType}
              onChange={(e) => setSelectedTourType(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="ALL">Tüm Turnuva Tipleri (Renkli)</option>
              <option value="ITF_WTT">ITF World Tennis Tour (15K/25K/35K)</option>
              <option value="ITF_JUNIORS">ITF Juniors (J30/J60/J100/J200)</option>
              <option value="ITF_MASTERS">ITF Masters Tour (MT & World Team)</option>
              <option value="TENNIS_EUROPE">Tennis Europe (U12/U14/U16/U18)</option>
              <option value="ATP_CHALLENGER">ATP Challenger Tour</option>
              <option value="WTA">WTA Tour / WTA 125</option>
              <option value="TTF_NATIONAL">TTF Ulusal Şampiyonalar</option>
            </select>
          </div>

          {/* Referee Highlighter Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
              <span>Hakem Vurgula / Ara</span>
              {highlightRef && (
                <button 
                  onClick={() => setHighlightRef('')}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Temizle
                </button>
              )}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Örn: Hakem adı yazın..."
                value={highlightRef}
                onChange={(e) => setHighlightRef(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

        </div>

        {/* 2. PROMINENT ACTIVE DATE RANGE INDICATOR */}
        <div className="p-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                SEÇİLEN AKTİF TARİH ARALIĞI
              </div>
              <div className="text-sm font-extrabold font-mono tabular-nums text-white tracking-wide">
                {startDate} — {endDate}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-slate-300">
              <strong className="text-emerald-400 font-bold">{groupedWeeks.length}</strong> Hafta
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">
              <strong className="text-emerald-400 font-bold">{totalTournamentsInRange}</strong> Aktif Turnuva
            </span>
            {cancelledBlocksInRange.length > 0 && (
              <>
                <span className="text-slate-500">·</span>
                <span className="text-rose-300">
                  <strong className="text-rose-400 font-bold">{cancelledBlocksInRange.length}</strong> İptal
                </span>
              </>
            )}
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">
              <strong className="text-emerald-400 font-bold">{totalAssignmentsInRange}</strong> Hakem Görevi
            </span>
          </div>
        </div>

        {/* 3. COLOR LEGEND */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] font-semibold">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mr-1">
              Turnuva Renkleri:
            </span>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>ITF WTT (15K/25K/35K)</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>ITF Juniors</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
              <span>ITF Masters</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              <span>Tennis Europe</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span>WTA 125</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 text-white border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>ATP Challenger</span>
            </div>
          </div>

          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Kart düzenleme için çark simgesine, hakem işlemi için hakem adına tıklayın</span>
          </div>
        </div>

      </div>

      {/* 4. MAIN SPREADSHEET MATRIX VIEW */}
      {groupedWeeks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Seçilen tarih aralığında ({startDate} — {endDate}) kayıtlı turnuva bloku bulunamadı.
          </p>
          <button
            onClick={handleApplyFullYear}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Tüm 2026 Sezonunu Göster
          </button>
        </div>
      ) : (
        <div className="space-y-8" id="weekly-matrix-container">
          {groupedWeeks.map(week => (
            <div key={week.weekLabel} className="space-y-3">
              
              {/* Week Title Row */}
              <div className="flex items-center justify-between border-b-2 border-slate-300 dark:border-slate-700 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                    {week.weekLabel} Haftası
                  </h2>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {week.blocks.length} Eş Zamanlı Turnuva
                </div>
              </div>

              {/* Tournament Cards Horizontal Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
                {week.blocks.map(tour => {
                  const palette = resolveTourPalette(tour.tourType, tour.colorTheme);
                  const shortName = getTourShortName(tour.tourType);
                  const isMajorEvent =
                    tour.kategori.includes('WORLD') ||
                    tour.kategori.includes('CHALLENGER') ||
                    tour.tourType === 'ATP_CHALLENGER' ||
                    tour.tourType === 'WTA' ||
                    Boolean(tour.hakemSefiSlot || tour.assRefSlot);

                  const tourSpan = getTournamentDateSpan(tour);

                  const getSameDateConf = (refName?: string) =>
                    !tour.isCancelled && refName
                      ? checkSameDateTournamentConflict(refName, tourSpan, assignments, tour.id)
                      : { hasConflict: false, conflicts: [], warningMessage: '' };

                  const sameDateConflictsOnCard = tour.isCancelled
                    ? []
                    : Array.from(
                        new Map(
                          tour.rawAssignments
                            .map(a => ({
                              hakem: a.hakem,
                              res: checkSameDateTournamentConflict(a.hakem, tourSpan, assignments, tour.id)
                            }))
                            .filter(x => x.res.hasConflict)
                            .map(x => [x.hakem.toUpperCase(), x])
                        ).values()
                      );

                  return (
                    <div 
                      key={tour.id}
                      className={`bg-white dark:bg-slate-900 border-2 ${tour.isCancelled ? 'border-rose-400 opacity-85' : palette.bannerBorderClass} rounded-lg shadow-sm overflow-hidden text-xs flex flex-col transition-all hover:shadow-md`}
                    >
                      {/* 1. Header Banner */}
                      <div className={`px-3 py-2 flex items-center justify-between gap-2 font-bold ${palette.bannerBgClass}`}>
                        <div className="flex items-center gap-1.5 font-sans tracking-wide text-xs min-w-0">
                          <span className="uppercase text-[11px] tracking-wider truncate max-w-[130px]">
                            {shortName}
                          </span>
                        </div>

                        {/* Date Center */}
                        <div className="text-sm font-extrabold tracking-wider font-mono tabular-nums whitespace-nowrap">
                          {tour.tarihLabel}
                        </div>

                        {/* Status / TTF + Gear Settings Button */}
                        <div className="flex items-center gap-1.5 text-[10px] font-sans uppercase tracking-widest shrink-0">
                          {tour.isCancelled && (
                            <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded font-extrabold">
                              İPTAL
                            </span>
                          )}
                          {!tour.isPublished && !tour.isCancelled && (
                            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-extrabold tracking-normal">
                              TASLAK
                            </span>
                          )}
                          <span className="bg-black/20 px-1.5 py-0.5 rounded">TTF</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTournament(tour);
                            }}
                            className="p-1.5 rounded-md bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
                            title="Turnuva Ayarları & Detaylı Düzenleme (Yayınla, Tarih, İsim, Hakem, Silme)"
                            aria-label="Turnuva kartını düzenle"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 2. Subheader Row: ŞEHİR | KATEGORİ | TESİS */}
                      <div className={`grid grid-cols-3 text-center py-2 px-1 font-bold border-b border-slate-300 dark:border-slate-700 text-[11px] ${palette.subHeaderBgClass}`}>
                        <div className="truncate px-1 uppercase tracking-wide" title={tour.sehir}>
                          {tour.sehir}
                        </div>
                        <div className="truncate px-1 border-x border-slate-300 dark:border-slate-700 uppercase" title={tour.kategori}>
                          {tour.kategori}
                        </div>
                        <div className="truncate px-1 uppercase tracking-wide" title={tour.tesis}>
                          {tour.tesis}
                        </div>
                      </div>

                      {/* Draft notice strip if not published */}
                      {!tour.isPublished && !tour.isCancelled && (
                        <div className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-center font-bold text-[10px] tracking-wide flex items-center justify-center gap-1.5">
                          <EyeOff className="w-3 h-3 shrink-0" />
                          <span>TASLAK · Henüz yayınlanmadı (hakemlere görünmez)</span>
                        </div>
                      )}

                      {/* Cancelled notice strip if cancelled */}
                      {tour.isCancelled && (
                        <div className="px-3 py-1.5 bg-rose-600 text-white text-center font-extrabold text-[11px] tracking-widest uppercase">
                          İPTAL EDİLDİ
                        </div>
                      )}

                      {/* 3. Official Leadership Bar */}
                      {isMajorEvent ? (
                        <div className="grid grid-cols-3 text-center border-b border-slate-300 dark:border-slate-700 font-semibold text-[11px] divide-x divide-slate-300 dark:divide-slate-700 bg-slate-100 dark:bg-slate-800">
                          {/* Col 1: Supervisor */}
                          {(() => {
                            const conf = getSameDateConf(tour.supervisorSlot?.hakem);
                            return (
                              <div 
                                onClick={() => handleSlotClick(tour.supervisorSlot, tour)}
                                className={`p-1.5 transition-colors group relative ${tour.supervisorSlot ? 'cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-950/40' : ''} ${conf.hasConflict ? 'bg-amber-100/80 dark:bg-amber-950/50' : ''}`}
                                title={conf.hasConflict ? conf.warningMessage : tour.supervisorSlot ? 'Hakemi değiştir / kaldır / taşı için tıklayın' : undefined}
                              >
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                                  <span>SUPERVISOR</span>
                                </div>
                                <div className={`font-bold mt-0.5 truncate ${conf.hasConflict ? 'text-amber-900 dark:text-amber-200 font-extrabold' : isHighlighted(tour.supervisor) ? 'bg-amber-300 text-slate-950 px-1 rounded font-extrabold' : 'text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>
                                  {conf.hasConflict ? `⚡ ${tour.supervisor}` : (tour.supervisor || '-')}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Col 2 & 3 */}
                          {tour.tourType === 'WTA' ? (
                            <>
                              {(() => {
                                const conf = getSameDateConf(tour.assRefSlot?.hakem);
                                return (
                                  <div 
                                    onClick={() => handleSlotClick(tour.assRefSlot, tour)}
                                    className={`p-1.5 transition-colors group ${tour.assRefSlot ? 'cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-950/40' : ''} ${conf.hasConflict ? 'bg-amber-100/80 dark:bg-amber-950/50' : ''}`}
                                    title={conf.hasConflict ? conf.warningMessage : 'Hakemi değiştir / kaldır / taşı için tıklayın'}
                                  >
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                                      REF
                                    </div>
                                    <div className={`font-bold mt-0.5 truncate ${conf.hasConflict ? 'text-amber-900 dark:text-amber-200 font-extrabold' : tour.assRef && isHighlighted(tour.assRef) ? 'bg-amber-300 text-slate-950 px-1 rounded font-extrabold' : 'text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>
                                      {conf.hasConflict ? `⚡ ${tour.assRef}` : (tour.assRef || '-')}
                                    </div>
                                  </div>
                                );
                              })()}
                              {(() => {
                                const conf = getSameDateConf(tour.hakemSefiSlot?.hakem);
                                return (
                                  <div 
                                    onClick={() => handleSlotClick(tour.hakemSefiSlot, tour)}
                                    className={`p-1.5 transition-colors group ${tour.hakemSefiSlot ? 'cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-950/40' : ''} ${conf.hasConflict ? 'bg-amber-100/80 dark:bg-amber-950/50' : ''}`}
                                    title={conf.hasConflict ? conf.warningMessage : 'Hakemi değiştir / kaldır / taşı için tıklayın'}
                                  >
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                                      HAKEM ŞEFİ
                                    </div>
                                    <div className={`font-bold mt-0.5 truncate ${conf.hasConflict ? 'text-amber-900 dark:text-amber-200 font-extrabold' : tour.hakemSefi && isHighlighted(tour.hakemSefi) ? 'bg-amber-300 text-slate-950 px-1 rounded font-extrabold' : 'text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>
                                      {conf.hasConflict ? `⚡ ${tour.hakemSefi}` : (tour.hakemSefi || '-')}
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          ) : (
                            <>
                              {(() => {
                                const conf = getSameDateConf(tour.hakemSefiSlot?.hakem);
                                return (
                                  <div 
                                    onClick={() => handleSlotClick(tour.hakemSefiSlot, tour)}
                                    className={`p-1.5 transition-colors group ${tour.hakemSefiSlot ? 'cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-950/40' : ''} ${conf.hasConflict ? 'bg-amber-100/80 dark:bg-amber-950/50' : ''}`}
                                    title={conf.hasConflict ? conf.warningMessage : 'Hakemi değiştir / kaldır / taşı için tıklayın'}
                                  >
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                                      Hakem Şefi
                                    </div>
                                    <div className={`font-bold mt-0.5 truncate ${conf.hasConflict ? 'text-amber-900 dark:text-amber-200 font-extrabold' : tour.hakemSefi && isHighlighted(tour.hakemSefi) ? 'bg-amber-300 text-slate-950 px-1 rounded font-extrabold' : 'text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>
                                      {conf.hasConflict ? `⚡ ${tour.hakemSefi}` : (tour.hakemSefi || '-')}
                                    </div>
                                  </div>
                                );
                              })()}
                              {(() => {
                                const conf = getSameDateConf(tour.assRefSlot?.hakem);
                                return (
                                  <div 
                                    onClick={() => handleSlotClick(tour.assRefSlot, tour)}
                                    className={`p-1.5 transition-colors group ${tour.assRefSlot ? 'cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-950/40' : ''} ${conf.hasConflict ? 'bg-amber-100/80 dark:bg-amber-950/50' : ''}`}
                                    title={conf.hasConflict ? conf.warningMessage : 'Hakemi değiştir / kaldır / taşı için tıklayın'}
                                  >
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                                      {tour.tourType === 'ATP_CHALLENGER' ? 'Ref.' : 'Ass. Ref.'}
                                    </div>
                                    <div className={`font-bold mt-0.5 truncate ${conf.hasConflict ? 'text-amber-900 dark:text-amber-200 font-extrabold' : tour.assRef && isHighlighted(tour.assRef) ? 'bg-amber-300 text-slate-950 px-1 rounded font-extrabold' : 'text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>
                                      {conf.hasConflict ? `⚡ ${tour.assRef}` : (tour.assRef || '-')}
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      ) : (
                        (() => {
                          const conf = getSameDateConf(tour.supervisorSlot?.hakem);
                          return (
                            <div 
                              onClick={() => handleSlotClick(tour.supervisorSlot, tour)}
                              className={`flex items-center border-b border-slate-300 dark:border-slate-700 divide-x divide-slate-300 dark:divide-slate-700 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors group ${conf.hasConflict ? 'bg-amber-100/80 dark:bg-amber-950/50' : 'bg-slate-100 dark:bg-slate-800'}`}
                              title={conf.hasConflict ? conf.warningMessage : "Supervisor'ı değiştir / kaldır / taşı için tıklayın"}
                            >
                              <div className={`px-3 py-1.5 font-bold uppercase text-[11px] shrink-0 ${palette.tagBgClass}`}>
                                SUPERVISOR
                              </div>
                              <div className={`px-3 py-1.5 font-bold text-xs flex-1 truncate flex items-center justify-between ${
                                conf.hasConflict
                                  ? 'text-amber-900 dark:text-amber-200 font-extrabold'
                                  : isHighlighted(tour.supervisor)
                                    ? 'bg-amber-300 text-slate-950 font-extrabold'
                                    : 'text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
                              }`}>
                                <span className="truncate">{conf.hasConflict ? `⚡ ${tour.supervisor}` : (tour.supervisor || 'BELİRLENECEK')}</span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-100 text-slate-500 font-normal transition-opacity">
                                  Düzenle ✎
                                </span>
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {/* 4. Roster Columns + Dedicated Designated Row */}
                      {(() => {
                        const designatedList = tour.designatedSlots || [];
                        const hasScheduleNotes = tour.rawAssignments.some(a => {
                          const u = (a.notlar || '').toUpperCase();
                          return u.includes('SALI-CUMA') || u.includes('SALI-PERŞEMBE');
                        });
                        const isScheduleSplit =
                          (tour.kategori.toUpperCase().includes('15K') ||
                            tour.kategori.toUpperCase().includes('25K') ||
                            tour.kategori.toUpperCase().includes('35K')) &&
                          tour.crewCol2.length === 0 &&
                          (tour.crewCol3.length > 0 || hasScheduleNotes);
                        const isSingleCol = !isScheduleSplit && tour.crewCol2.length === 0 && tour.crewCol3.length === 0;
                        const isAtpSplit = tour.tourType === 'ATP_CHALLENGER' && tour.crewCol2.length === 0 && tour.crewCol3.length > 0;
                        const isWtaSplit = tour.tourType === 'WTA' && tour.crewCol2.length === 0 && tour.crewCol3.length > 0;

                        const renderSlot = (slot: CrewSlot, i: number, centered = false) => {
                          const av = checkRefereeAvailability(slot.hakem, tourSpan, refereeAccessMap);
                          const dateConf = getSameDateConf(slot.hakem);
                          const isPlaceholder = slot.hakem === 'TBA' || slot.hakem === 'EXCHANGE';
                          const titleText = [
                            dateConf.hasConflict ? dateConf.warningMessage : '',
                            av.isConflict ? `${slot.hakem}: ${UNAVAILABLE_WEEK_WARNING}` : '',
                            `${slot.hakem} (${slot.role || 'Hakem'}) - Tıklayarak yönet`
                          ]
                            .filter(Boolean)
                            .join(' | ');

                          return (
                            <div 
                              key={i} 
                              onClick={() => handleSlotClick(slot, tour)}
                              className={`p-1.5 truncate font-medium cursor-pointer transition-colors group flex items-center ${centered ? 'justify-center gap-1' : 'justify-between'} ${
                                av.isConflict
                                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-bold'
                                  : dateConf.hasConflict
                                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold'
                                    : isPlaceholder
                                      ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 italic'
                                      : isHighlighted(slot.hakem) 
                                        ? 'bg-amber-200 dark:bg-amber-400/90 text-slate-950 font-bold' 
                                        : 'text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-900 dark:hover:text-emerald-200'
                              }`}
                              title={titleText}
                            >
                              <span className="truncate">
                                {av.isConflict ? `⚠ ${slot.hakem}` : dateConf.hasConflict ? `⚡ ${slot.hakem}` : slot.hakem}
                              </span>
                              <span className="text-[9px] opacity-0 group-hover:opacity-100 text-emerald-600 dark:text-emerald-400 font-bold ml-1 shrink-0">
                                ✎
                              </span>
                            </div>
                          );
                        };

                        return (
                          <>
                            {isSingleCol ? (
                              (tour.crewCol1.length > 0 || designatedList.length === 0) && (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px] min-h-[100px] bg-white dark:bg-slate-900">
                                  {tour.crewCol1.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-[11px]">
                                      {tour.isCancelled ? 'İptal edildi · Ekip atanmadı' : 'Ekip listesi henüz eklenmedi'}
                                    </div>
                                  ) : (
                                    tour.crewCol1.map((slot, i) => renderSlot(slot, i, true))
                                  )}
                                </div>
                              )
                            ) : (
                              <div
                                className={`grid divide-x divide-slate-200 dark:divide-slate-800 text-[11px] min-h-[120px] bg-white dark:bg-slate-900 ${
                                  isScheduleSplit ? 'grid-cols-[1fr_0.55fr_1fr]' : 'grid-cols-2 sm:grid-cols-3'
                                }`}
                              >
                                {/* Col 1 */}
                                <div className="min-w-0 divide-y divide-slate-100 dark:divide-slate-800/80">
                                  {isScheduleSplit && (
                                    <div className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/90 dark:bg-slate-800/60 text-center">
                                      Salı - Cuma
                                    </div>
                                  )}
                                  {tour.crewCol1.length === 0 && isScheduleSplit ? (
                                    <div className="p-2 text-center text-[10px] text-slate-400 italic">-</div>
                                  ) : (
                                    tour.crewCol1.map((slot, i) => renderSlot(slot, i))
                                  )}
                                </div>

                                {/* Col 2 */}
                                {isScheduleSplit ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditingMiddleNote({ tour, text: tour.ortaNot || '' })}
                                    title={
                                      tour.ortaNot
                                        ? `Orta sütun notunu düzenle: ${tour.ortaNot}`
                                        : 'Orta sütuna not eklemek için tıklayın'
                                    }
                                    className="min-w-0 flex flex-col items-center justify-center p-1.5 text-center bg-slate-50/40 dark:bg-slate-800/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer group/mid relative"
                                  >
                                    {tour.ortaNot ? (
                                      <>
                                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-snug">
                                          {tour.ortaNot}
                                        </span>
                                        <span className="mt-1 text-[9px] opacity-0 group-hover/mid:opacity-100 text-emerald-700 dark:text-emerald-400 font-bold transition-opacity">
                                          Düzenle ✎
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[9px] opacity-0 group-hover/mid:opacity-100 text-emerald-700 dark:text-emerald-400 font-bold transition-opacity select-none">
                                        + Not ekle
                                      </span>
                                    )}
                                  </button>
                                ) : isAtpSplit ? (
                                  <div className="hidden sm:flex items-center justify-center font-extrabold text-xs text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/30">
                                    {tour.atpLevel || 'ATP 75'}
                                  </div>
                                ) : isWtaSplit ? (
                                  <div className="hidden sm:flex items-center justify-center font-extrabold text-xs text-purple-800 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20">
                                    WTA 125
                                  </div>
                                ) : (
                                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {tour.crewCol2.map((slot, i) => renderSlot(slot, i))}
                                  </div>
                                )}

                                {/* Col 3 */}
                                <div className="min-w-0 divide-y divide-slate-100 dark:divide-slate-800/80">
                                  {isScheduleSplit && (
                                    <div className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/90 dark:bg-slate-800/60 text-center">
                                      Salı - Perşembe
                                    </div>
                                  )}
                                  {tour.crewCol3.length === 0 && isScheduleSplit ? (
                                    <div className="p-2 text-center text-[10px] text-slate-400 italic">-</div>
                                  ) : (
                                    tour.crewCol3.map((slot, i) => renderSlot(slot, i))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Designated Referee Dedicated Row */}
                            {designatedList.length > 0 && (
                              <div className="bg-indigo-50/90 dark:bg-indigo-950/45 border-t border-indigo-200 dark:border-indigo-800 px-2.5 py-2 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-extrabold tracking-wider uppercase">
                                    DESIGNATED
                                  </span>
                                  <span className="text-[10px] font-semibold text-indigo-800 dark:text-indigo-300">
                                    {designatedList.length} Hakem
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {designatedList.map((slot, idx) => {
                                    const av = checkRefereeAvailability(slot.hakem, tourSpan, refereeAccessMap);
                                    const dateConf = getSameDateConf(slot.hakem);
                                    const hl = isHighlighted(slot.hakem);
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSlotClick(slot, tour)}
                                        title={
                                          [
                                            dateConf.hasConflict ? dateConf.warningMessage : '',
                                            av.isConflict ? `${slot.hakem}: ${UNAVAILABLE_WEEK_WARNING}` : '',
                                            `${slot.hakem} (${slot.role || 'Designated'}) - Tıklayarak yönet`
                                          ]
                                            .filter(Boolean)
                                            .join(' | ')
                                        }
                                        className={`px-2 py-1 rounded-md border text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                          av.isConflict
                                            ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 text-rose-900 dark:text-rose-200'
                                            : dateConf.hasConflict
                                              ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 text-amber-900 dark:text-amber-200'
                                              : hl
                                                ? 'bg-amber-300 border-amber-500 text-slate-950 font-extrabold'
                                                : 'bg-white dark:bg-indigo-900/60 border-indigo-200 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                                        }`}
                                      >
                                        <span>
                                          {av.isConflict ? `⚠ ${slot.hakem}` : dateConf.hasConflict ? `⚡ ${slot.hakem}` : slot.hakem}
                                        </span>
                                        <span className="text-[9px] opacity-60">✎</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {/* Same-Date Duplicate Tournament Conflict Strip */}
                      {sameDateConflictsOnCard.length > 0 && (
                        <div className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 border-t border-amber-300 dark:border-amber-800 text-[10px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate" title={sameDateConflictsOnCard.map(c => c.res.warningMessage).join(' | ')}>
                            {SAME_DATE_CONFLICT_WARNING} ({sameDateConflictsOnCard.map(c => c.hakem).join(', ')})
                          </span>
                        </div>
                      )}

                      {/* Availability Conflict Strip if any assigned referee lacks availability */}
                      {(() => {
                        const conflictRefs = tour.rawAssignments.filter(
                          a => checkRefereeAvailability(a.hakem, tourSpan, refereeAccessMap).isConflict
                        );
                        if (conflictRefs.length === 0) return null;
                        return (
                          <div className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-800 text-[10px] font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">
                              {UNAVAILABLE_WEEK_WARNING} ({conflictRefs.map(c => c.hakem).join(', ')})
                            </span>
                          </div>
                        );
                      })()}

                      {/* Card Footer: Total Crew & Action */}
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono truncate">
                          {tour.rawAssignments.length} Hakem Atandı
                        </span>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {onTogglePublishTournament && (
                            <button
                              type="button"
                              onClick={() => onTogglePublishTournament(tour, !tour.isPublished)}
                              className={`font-bold flex items-center gap-1 cursor-pointer ${
                                tour.isPublished
                                  ? 'text-slate-500 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300'
                                  : 'text-emerald-700 hover:text-emerald-800 dark:text-emerald-400'
                              }`}
                              title={tour.isPublished ? 'Yayından Kaldır' : 'Hakemlere Yayınla'}
                            >
                              {tour.isPublished ? (
                                <>
                                  <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Yayında</span>
                                </>
                              ) : (
                                <>
                                  <Globe className="w-3 h-3" />
                                  <span>Yayınla</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingTournament(tour)}
                            className="text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Settings className="w-3 h-3" />
                            <span>Düzenle</span>
                          </button>

                          {tour.rawAssignments[0] && (
                            <button
                              onClick={() => onOpenDoc(tour.rawAssignments[0])}
                              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Resmi Belge</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}
      </div>

      {/* 5. REFEREE ACTION MODAL (Kaldır, Değiştir, Başka Turnuvaya Taşı) */}
      {selectedSlotForAction && (
        <RefereeAssignmentActionModal
          assignment={selectedSlotForAction.assignment}
          tournament={selectedSlotForAction.tournament}
          allTournaments={tournamentBlocks}
          allAssignments={assignments}
          allReferees={allReferees}
          refereeAccessMap={refereeAccessMap}
          onClose={() => setSelectedSlotForAction(null)}
          onDelete={(id) => {
            if (onDeleteAssignment) onDeleteAssignment(id);
          }}
          onSwapReferee={(id, newRef) => {
            if (onSwapReferee) onSwapReferee(id, newRef);
          }}
          onChangeRole={(id, newRole) => {
            if (onChangeRole) onChangeRole(id, newRole);
          }}
          onMoveTournament={(id, target) => {
            if (onMoveAssignment) onMoveAssignment(id, target);
          }}
          onOpenDoc={onOpenDoc}
          onViewRefereeProfile={onViewRefereeProfile}
        />
      )}

      {/* 6. TOURNAMENT CARD FULL EDIT MODAL (Çark / Settings Modal) */}
      {editingTournament && onSaveTournamentChanges && onDeleteTournament && (
        <TournamentEditModal
          tournament={editingTournament}
          allAssignments={assignments}
          allReferees={allReferees}
          refereeAccessMap={refereeAccessMap}
          nextId={assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1}
          onClose={() => setEditingTournament(null)}
          onSaveTournamentChanges={onSaveTournamentChanges}
          onDeleteTournament={onDeleteTournament}
          onTogglePublishTournament={onTogglePublishTournament}
        />
      )}

      {/* 7. PRINT & PDF MODAL (Yazdır & PDF Dışa Aktar) */}
      {isPrintModalOpen && (
        <MatrixPrintPdfModal
          groupedWeeks={groupedWeeks}
          startDate={startDate}
          endDate={endDate}
          totalTournaments={totalTournamentsInRange}
          totalAssignments={totalAssignmentsInRange}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* 8. MIDDLE COLUMN NOTE EDITOR MODAL */}
      {editingMiddleNote && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingMiddleNote(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold">Orta Sütun Notu</h3>
                <p className="text-[11px] text-slate-400">
                  {editingMiddleNote.tour.tesis} · {editingMiddleNote.tour.kategori} · {editingMiddleNote.tour.tarihLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMiddleNote(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onSaveTournamentChanges) {
                  const trimmed = editingMiddleNote.text.trim();
                  const updated = editingMiddleNote.tour.rawAssignments.map(a => ({
                    ...a,
                    orta_not: trimmed || undefined
                  }));
                  onSaveTournamentChanges(editingMiddleNote.tour.id, updated, []);
                }
                setEditingMiddleNote(null);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Orta Sütunda Görünecek Not (İsteğe bağlı)
                </label>
                <textarea
                  rows={3}
                  autoFocus
                  value={editingMiddleNote.text}
                  onChange={(e) =>
                    setEditingMiddleNote(prev => (prev ? { ...prev, text: e.target.value } : null))
                  }
                  placeholder="Boş bırakırsanız orta sütun temiz ve boş görünür..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {editingMiddleNote.text.trim() ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingMiddleNote(prev => (prev ? { ...prev, text: '' } : null))
                    }
                    className="px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-semibold cursor-pointer"
                  >
                    Notu Temizle
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMiddleNote(null)}
                    className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
