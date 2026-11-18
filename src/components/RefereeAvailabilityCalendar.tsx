import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Save,
  FileText,
  MapPin,
  Download,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { Atama, AvailabilityRange, RefereeInfo } from '../types';
import {
  formatRangeLabel,
  formatTrDate,
  getRefereeTournamentConflictsForRanges,
  getTournamentDateSpan,
  isAssignmentPublished,
  isDateSpanCoveredByRanges,
  isPastMonthDate,
  normalizeRefereeKey
} from '../utils/availability';
import { downloadIcsCalendar } from '../data/cleaner';
import { ConfirmDialogModal } from './ConfirmDialogModal';

interface RefereeAvailabilityCalendarProps {
  refereeName: string;
  refereeProfile?: RefereeInfo;
  savedRanges: AvailabilityRange[];
  assignments: Atama[];
  onSaveRanges: (refereeName: string, ranges: AvailabilityRange[]) => void;
  onOpenDoc: (assignment: Atama) => void;
  isAdminPreview?: boolean;
}

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const WEEK_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function toIsoDate(year: number, monthIdx: number, day: number): string {
  const m = String(monthIdx + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export const RefereeAvailabilityCalendar: React.FC<RefereeAvailabilityCalendarProps> = ({
  refereeName,
  refereeProfile,
  savedRanges,
  assignments,
  onSaveRanges,
  onOpenDoc,
  isAdminPreview = false
}) => {
  // Draft ranges initialized and synced from savedRanges
  const [draftRanges, setDraftRanges] = useState<AvailabilityRange[]>(() => [...savedRanges]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Confirmation modal states
  const [confirmRemoveRange, setConfirmRemoveRange] = useState<AvailabilityRange | null>(null);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState<boolean>(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState<boolean>(false);

  // Inline range edit state
  const [editingRangeId, setEditingRangeId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState<string>('');
  const [editEnd, setEditEnd] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setDraftRanges([...savedRanges]);
    setHasUnsavedChanges(false);
    setPendingStart(null);
    setHoverDate(null);
    setEditingRangeId(null);
    setEditError(null);
    setInputError(null);
    setRangeNotice(null);
  }, [refereeName, savedRanges]);

  // Visual Calendar Month Navigation (Defaults to November & December 2026)
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(10); // 10 = November (0-indexed)

  // Click-to-select range state
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Manual input fields
  const [manualStart, setManualStart] = useState<string>('2026-11-09');
  const [manualEnd, setManualEnd] = useState<string>('2026-11-25');
  const [manualNote, setManualNote] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [rangeNotice, setRangeNotice] = useState<string | null>(null);

  // Filter assignments for this referee (unpublished drafts stay hidden from referees)
  const myAssignments = useMemo(() => {
    const targetKey = normalizeRefereeKey(refereeName);
    return assignments
      .filter(a => {
        if (normalizeRefereeKey(a.hakem) !== targetKey) return false;
        if (a.durum === 'İPTAL') return false;
        if (!isAdminPreview && !isAssignmentPublished(a)) return false;
        return true;
      })
      .sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [assignments, refereeName, isAdminPreview]);

  // Compute published current/future tournaments that would fall outside current draftRanges
  const uncoveredDraftConflicts = useMemo(() => {
    if (draftRanges.length === 0 && savedRanges.length === 0 && !hasUnsavedChanges) return [];
    return getRefereeTournamentConflictsForRanges(refereeName, draftRanges, assignments, {
      onlyPublished: true,
      ignorePastMonths: true,
      includeWhenRangesEmpty: savedRanges.length > 0 || hasUnsavedChanges
    });
  }, [refereeName, draftRanges, savedRanges.length, hasUnsavedChanges, assignments]);

  // Compute published current/future tournaments impacted if a specific range is removed
  const conflictsForPendingRangeRemoval = useMemo(() => {
    if (!confirmRemoveRange) return [];
    const remaining = draftRanges.filter(r => r.id !== confirmRemoveRange.id);
    const affected = getRefereeTournamentConflictsForRanges(refereeName, remaining, assignments, {
      onlyPublished: true,
      ignorePastMonths: true,
      includeWhenRangesEmpty: true
    });
    // Focus on those specifically overlapping the range being removed
    return affected.filter(c => {
      const span = getTournamentDateSpan(c);
      return span.startDate <= confirmRemoveRange.endDate && span.endDate >= confirmRemoveRange.startDate;
    });
  }, [confirmRemoveRange, draftRanges, refereeName, assignments]);

  // Dual-month display: viewMonth and next month
  const monthsToShow = useMemo(() => {
    const first = { year: viewYear, month: viewMonth };
    const secondMonth = (viewMonth + 1) % 12;
    const secondYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    return [first, { year: secondYear, month: secondMonth }];
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const resolveAndApplyRange = (
    start: string,
    end: string,
    note?: string,
    excludeId?: string
  ): { ok: boolean; error?: string; notice?: string | null } => {
    const s = start <= end ? start : end;
    const e = start <= end ? end : start;
    const others = excludeId ? draftRanges.filter(r => r.id !== excludeId) : draftRanges;

    // 1. Block exact duplicate or any range already completely covered by an existing range
    const existingCovering = others.find(r => s >= r.startDate && e <= r.endDate);
    if (existingCovering) {
      if (existingCovering.startDate === s && existingCovering.endDate === e) {
        return {
          ok: false,
          error: `Bu tarih aralığı (${formatRangeLabel(existingCovering)}) zaten listenizde bulunuyor.`
        };
      }
      return {
        ok: false,
        error: `Seçtiğiniz tarihler (${formatRangeLabel({ id: '', startDate: s, endDate: e })}) mevcut "${formatRangeLabel(existingCovering)}" aralığının zaten içinde yer alıyor.`
      };
    }

    // 2. Check if the new/edited range covers or overlaps existing range(s)
    const overlaps = others.filter(r => s <= r.endDate && e >= r.startDate);
    const nonOverlapping = others.filter(r => !(s <= r.endDate && e >= r.startDate));

    if (overlaps.length > 0) {
      const allCovered = overlaps.every(r => s <= r.startDate && e >= r.endDate);
      const mergedStart = overlaps.reduce((min, r) => (r.startDate < min ? r.startDate : min), s);
      const mergedEnd = overlaps.reduce((max, r) => (r.endDate > max ? r.endDate : max), e);
      const inheritedNote = overlaps.find(r => r.note)?.note;
      const finalNote = note?.trim() || inheritedNote || undefined;

      const mergedRange: AvailabilityRange = {
        id: excludeId || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        startDate: mergedStart,
        endDate: mergedEnd,
        note: finalNote
      };

      const nextList = [...nonOverlapping, mergedRange].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
      setDraftRanges(nextList);
      setHasUnsavedChanges(true);
      setSaveFeedback(null);

      const oldLabels = overlaps.map(o => `"${formatRangeLabel(o)}"`).join(', ');
      return {
        ok: true,
        notice: allCovered
          ? `Yeni seçilen aralık (${formatRangeLabel(mergedRange)}), önceki ${oldLabels} aralığını kapsadığı için eskisiyle değiştirildi.`
          : `Seçilen tarihler ${oldLabels} aralığıyla kesiştiği için tek aralık ("${formatRangeLabel(mergedRange)}") olarak birleştirildi.`
      };
    }

    // 3. Disjoint new/edited range
    const cleanRange: AvailabilityRange = {
      id: excludeId || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      startDate: s,
      endDate: e,
      note: note?.trim() || undefined
    };

    const nextList = [...others, cleanRange].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    );
    setDraftRanges(nextList);
    setHasUnsavedChanges(true);
    setSaveFeedback(null);

    return {
      ok: true,
      notice: excludeId ? `"${formatRangeLabel(cleanRange)}" aralığı güncellendi.` : null
    };
  };

  const addRangeToDraft = (start: string, end: string, note?: string): boolean => {
    const res = resolveAndApplyRange(start, end, note);
    if (!res.ok) {
      setInputError(res.error || 'Aralık eklenemedi.');
      setRangeNotice(null);
      return false;
    }
    setInputError(null);
    setRangeNotice(res.notice || null);
    return true;
  };

  // Click handler on visual calendar cells
  const handleCalendarDayClick = (isoDate: string) => {
    if (!pendingStart) {
      setPendingStart(isoDate);
      setInputError(null);
      setRangeNotice(null);
    } else {
      addRangeToDraft(pendingStart, isoDate);
      setPendingStart(null);
      setHoverDate(null);
    }
  };

  const handleAddManualRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStart || !manualEnd) {
      setInputError('Lütfen başlangıç ve bitiş tarihlerini seçiniz.');
      return;
    }
    const added = addRangeToDraft(manualStart, manualEnd, manualNote);
    if (added) {
      setManualNote('');
    }
  };

  const handleStartEditRange = (range: AvailabilityRange) => {
    setEditingRangeId(range.id);
    setEditStart(range.startDate);
    setEditEnd(range.endDate);
    setEditNote(range.note || '');
    setEditError(null);
  };

  const handleSaveEditRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRangeId) return;
    if (!editStart || !editEnd) {
      setEditError('Başlangıç ve bitiş tarihlerini seçiniz.');
      return;
    }
    const res = resolveAndApplyRange(editStart, editEnd, editNote, editingRangeId);
    if (!res.ok) {
      setEditError(res.error || 'Aralık güncellenemedi.');
      return;
    }
    setEditingRangeId(null);
    setEditError(null);
    setInputError(null);
    setRangeNotice(res.notice || null);
  };

  const handleRemoveRange = (id: string) => {
    if (editingRangeId === id) {
      setEditingRangeId(null);
      setEditError(null);
    }
    setDraftRanges(prev => prev.filter(r => r.id !== id));
    setHasUnsavedChanges(true);
    setSaveFeedback(null);
  };

  const handleClearAllRanges = () => {
    setDraftRanges([]);
    setPendingStart(null);
    setEditingRangeId(null);
    setEditError(null);
    setInputError(null);
    setRangeNotice(null);
    setHasUnsavedChanges(true);
    setSaveFeedback(null);
  };

  const executeSaveAll = () => {
    onSaveRanges(refereeName, draftRanges);
    setHasUnsavedChanges(false);
    setSaveFeedback(
      draftRanges.length > 0
        ? `${draftRanges.length} adet müsaitlik aralığınız onaylanarak sisteme kaydedildi.`
        : 'Müsaitlik listeniz güncellendi (0 aralık).'
    );
    setTimeout(() => setSaveFeedback(null), 6000);
  };

  const handleSaveAll = () => {
    setConfirmSaveOpen(true);
  };

  // Check if a date falls within any saved/draft range
  const getDateRangeStatus = (isoDate: string) => {
    const matchedIdx = draftRanges.findIndex(
      r => isoDate >= r.startDate && isoDate <= r.endDate
    );
    const isStart = draftRanges.some(r => r.startDate === isoDate);
    const isEnd = draftRanges.some(r => r.endDate === isoDate);

    let isInPending = false;
    if (pendingStart && hoverDate) {
      const s = pendingStart <= hoverDate ? pendingStart : hoverDate;
      const e = pendingStart <= hoverDate ? hoverDate : pendingStart;
      isInPending = isoDate >= s && isoDate <= e;
    }

    return {
      isSelected: matchedIdx !== -1,
      rangeIdx: matchedIdx,
      isStart,
      isEnd,
      isPendingStart: pendingStart === isoDate,
      isInPending
    };
  };

  // Render a single month grid
  const renderMonthGrid = (year: number, monthIdx: number) => {
    const firstDayOfMonth = new Date(year, monthIdx, 1);
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    // Convert JS getDay() (0=Sun..6=Sat) to Monday-first (0=Mon..6=Sun)
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div
        key={`${year}-${monthIdx}`}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs"
      >
        <div className="text-center font-bold text-sm text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          {MONTH_NAMES[monthIdx]} {year}
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-1.5">
          {WEEK_DAYS.map(w => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-1 text-xs font-mono">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-9" />;
            }

            const iso = toIsoDate(year, monthIdx, day);
            const status = getDateRangeStatus(iso);
            const hasAssignment = myAssignments.some(a => a.tarih === iso);

            let cellStyle =
              'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 border border-transparent';

            if (status.isPendingStart) {
              cellStyle =
                'bg-amber-500 text-white font-extrabold border-2 border-amber-600 shadow-sm ring-2 ring-amber-300';
            } else if (status.isInPending) {
              cellStyle =
                'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 font-bold border border-amber-300';
            } else if (status.isStart || status.isEnd) {
              cellStyle =
                'bg-emerald-600 text-white font-extrabold border border-emerald-700 shadow-xs';
            } else if (status.isSelected) {
              cellStyle =
                'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 font-bold border border-emerald-300 dark:border-emerald-700';
            }

            return (
              <button
                key={iso}
                type="button"
                onClick={() => handleCalendarDayClick(iso)}
                onMouseEnter={() => pendingStart && setHoverDate(iso)}
                className={`h-9 rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer tabular-nums ${cellStyle}`}
                title={
                  hasAssignment
                    ? `${formatTrDate(iso)} - Bu tarihte turnuva atamanız var`
                    : formatTrDate(iso)
                }
              >
                <span>{day}</span>
                {hasAssignment && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 absolute bottom-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shrink-0 shadow-sm">
              {refereeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isAdminPreview
                    ? 'YÖNETİCİ MÜSAİTLİK GÖRÜNTÜLEME & DÜZENLEME'
                    : 'TTF HAKEM MÜSAİTLİK VE GÖREV PORTALI'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {refereeName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Ref Kokart: <strong className="font-mono text-slate-800 dark:text-slate-200">{refereeProfile?.referee_badge || '-'}</strong>
                </span>
                <span>·</span>
                <span>
                  Kule Kokart: <strong className="font-mono text-slate-800 dark:text-slate-200">{refereeProfile?.chair_badge || '-'}</strong>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{refereeProfile?.hakem_sehir || 'TÜRKİYE'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {myAssignments.length > 0 && (
              <button
                type="button"
                onClick={() => downloadIcsCalendar(refereeName, myAssignments)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Görevlerimi Takvime Aktar (.ics)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAll}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Tüm Müsaitlik Aralıklarını Kaydet ({draftRanges.length})</span>
            </button>
          </div>
        </div>

        {/* Save confirmation or unsaved warning */}
        {saveFeedback && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {hasUnsavedChanges && !saveFeedback && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Kaydedilmemiş değişiklikleriniz var. Seçtiğiniz aralıkların TTF Atama Kuruluna iletilmesi için <strong>"Tüm Müsaitlik Aralıklarını Kaydet"</strong> butonuna basınız.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold shrink-0 cursor-pointer"
            >
              Şimdi Kaydet
            </button>
          </div>
        )}

        {uncoveredDraftConflicts.length > 0 && (
          <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-950 dark:text-rose-100 text-xs space-y-2">
            <div className="font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Müsaitliği kaldırdığınız veya kapsamadığınız tarihler için yayınlanmış (ilan edilmiş) bir turnuvanız var!
              </span>
            </div>
            <ul className="pl-6 list-disc space-y-1 text-[11px] font-semibold">
              {uncoveredDraftConflicts.map(c => (
                <li key={c.assignmentId}>
                  <strong>{c.tesis}</strong> ({c.kategori}) — {formatTrDate(c.tarih)} · {c.sehir} · Görev: {c.gorev}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Multi-Range Calendar + Selected Ranges Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Visual Dual-Month Calendar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            
            {/* Calendar Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  <span>Müsaitlik Takvimi (Birden Fazla Aralık Seçebilirsiniz)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {pendingStart ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Başlangıç seçildi ({formatTrDate(pendingStart)}). Şimdi bitiş gününe tıklayın...
                    </span>
                  ) : (
                    <span>
                      Takvimde önce <strong>başlangıç gününe</strong>, ardından <strong>bitiş gününe</strong> tıklayarak istediğiniz kadar aralık ekleyin.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {pendingStart && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingStart(null);
                      setHoverDate(null);
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer"
                  >
                    Seçimi İptal Et
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Önceki Ay"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewYear(2026);
                    setViewMonth(10);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Kasım–Aralık
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  title="Sonraki Ay"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Alerts inside Calendar Card (for duplicate/covered clicks or replaced/merged range notice) */}
            {inputError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
                <span>{inputError}</span>
                <button
                  type="button"
                  onClick={() => setInputError(null)}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {rangeNotice && !inputError && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 text-xs font-semibold flex items-center justify-between gap-2">
                <span>{rangeNotice}</span>
                <button
                  type="button"
                  onClick={() => setRangeNotice(null)}
                  className="text-blue-500 hover:text-blue-700 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Dual Month Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthsToShow.map(m => renderMonthGrid(m.year, m.month))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
                <span>Aralık Başlangıç / Bitiş</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block"></span>
                <span>Müsait Olduğunuz Günler</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                <span>Mevcut Turnuva Atamanız</span>
              </div>
            </div>
          </div>

          {/* Manual Quick Range Add Form */}
          <form
            onSubmit={handleAddManualRange}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tarih Seçerek Aralık Ekle (Örn: 9 Kasım - 25 Kasım, 1 Aralık - 8 Aralık...)</span>
            </div>

            {inputError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {inputError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Not (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Antalya / Tüm bölgeler"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer h-[34px]"
              >
                <Plus className="w-4 h-4" />
                <span>Aralık Ekle</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Selected Multi-Ranges List & Bulk Save */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Seçilen Müsaitlik Aralıkları ({draftRanges.length})
                </h3>
                {draftRanges.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearAllOpen(true)}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Tümünü Temizle</span>
                  </button>
                )}
              </div>

              {draftRanges.length === 0 ? (
                <div className="py-8 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Henüz müsaitlik aralığı seçilmedi.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Takvimden veya tarih kutularından birden fazla aralık ekleyip topluca kaydedebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {draftRanges.map((range, idx) => {
                    const isEditing = editingRangeId === range.id;

                    if (isEditing) {
                      return (
                        <form
                          key={range.id}
                          onSubmit={handleSaveEditRange}
                          className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                              #{idx + 1} Aralığı Yeniden Belirle
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRangeId(null);
                                setEditError(null);
                              }}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {editError && (
                            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                              {editError}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                Başlangıç
                              </label>
                              <input
                                type="date"
                                value={editStart}
                                onChange={(e) => setEditStart(e.target.value)}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono text-[11px]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                                Bitiş
                              </label>
                              <input
                                type="date"
                                value={editEnd}
                                onChange={(e) => setEditEnd(e.target.value)}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono text-[11px]"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Not (isteğe bağlı)"
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[11px]"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRangeId(null);
                                setEditError(null);
                              }}
                              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              İptal
                            </button>
                            <button
                              type="submit"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Uygula</span>
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={range.id}
                        className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {formatRangeLabel(range)}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                            {range.startDate} → {range.endDate}
                            {range.note && <span className="font-sans ml-2 text-emerald-700 dark:text-emerald-300">({range.note})</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditRange(range)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-md transition-colors cursor-pointer"
                            title="Bu aralığı düzenle"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmRemoveRange(range)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
                            title="Bu aralığı çıkar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Bu aralıkların dışındaki bir turnuvaya atama yapılmak istendiğinde sistem otomatik olarak{' '}
                  <strong>"Hakemlerin bu hafta için müsaitliği yoktur."</strong> uyarısı verir.
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveAll}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Seçili Aralıkları Topluca Kaydet ({draftRanges.length})</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Referee's Assigned Tournaments */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              2026 Görevlendirme Programınız ({myAssignments.length} Turnuva)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              TTF Uluslararası Atamalar tarafından adınıza tanımlanan görevlendirmeler
            </p>
          </div>
        </div>

        {myAssignments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
            Henüz adınıza kayıtlı turnuva görevlendirmesi bulunmamaktadır.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myAssignments.map(a => {
              const isPublished = isAssignmentPublished(a);
              const span = getTournamentDateSpan(a);
              const isFutureOrCurrent = !isPastMonthDate(span.endDate || a.tarih);
              const isOutsideDraft =
                a.durum !== 'İPTAL' &&
                isPublished &&
                isFutureOrCurrent &&
                (draftRanges.length > 0 || savedRanges.length > 0 || hasUnsavedChanges) &&
                !isDateSpanCoveredByRanges(span.startDate, span.endDate, draftRanges);

              return (
                <div
                  key={a.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] uppercase font-bold">{a.ay.slice(0, 3)}</span>
                      <span className="text-sm font-extrabold font-mono leading-none">
                        {a.tarih.split('-')[2] || '01'}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span>
                          {a.tesis} · <span className="text-emerald-700 dark:text-emerald-400">{a.kategori}</span>
                        </span>
                        {isAdminPreview && !isPublished && (
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                            TASLAK (Hakeme Gizli)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{a.tarih}</span>
                        <span>·</span>
                        <span>{a.sehir}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{a.gorev}</span>
                      </div>
                      {isOutsideDraft && (
                        <div className="mt-1 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                          ⚠ Müsaitliği kaldırdığınız tarihler için yayınlanmış bir turnuvanız var (kaydedildiğinde yöneticiye bildirilir).
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenDoc(a)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Görev Belgesi</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialogModal
        isOpen={Boolean(confirmRemoveRange)}
        title={
          conflictsForPendingRangeRemoval.length > 0
            ? 'Dikkat: Yayınlanmış Turnuvanız Etkileniyor!'
            : 'Müsaitlik Aralığını Kaldır'
        }
        message={
          confirmRemoveRange
            ? conflictsForPendingRangeRemoval.length > 0
              ? `Müsaitliği kaldırdığınız "${formatRangeLabel(confirmRemoveRange)}" tarihleri için yayınlanmış (ilan edilmiş) bir turnuvanız var! Yine de kaldırmak istediğinize emin misiniz?`
              : `"${formatRangeLabel(confirmRemoveRange)}" tarih aralığını müsaitlik listenizden çıkarmak istediğinize emin misiniz?`
            : ''
        }
        details={
          conflictsForPendingRangeRemoval.length > 0
            ? conflictsForPendingRangeRemoval.map(
                c => `Yayınlanmış Turnuva: ${c.tesis} (${c.kategori} · ${formatTrDate(c.tarih)})`
              )
            : undefined
        }
        confirmLabel="Evet, Aralığı Çıkar"
        variant={conflictsForPendingRangeRemoval.length > 0 ? 'warning' : 'danger'}
        onCancel={() => setConfirmRemoveRange(null)}
        onConfirm={() => {
          if (confirmRemoveRange) {
            handleRemoveRange(confirmRemoveRange.id);
          }
          setConfirmRemoveRange(null);
        }}
      />

      <ConfirmDialogModal
        isOpen={confirmClearAllOpen}
        title="Tüm Müsaitlik Aralıklarını Temizle"
        message={`Listedeki tüm (${draftRanges.length} adet) müsaitlik aralığını silmek istediğinize emin misiniz?`}
        details={[
          'Tüm seçili müsaitlik aralıklarınız temizlenecektir.',
          ...(myAssignments.filter(a => isAssignmentPublished(a) && !isPastMonthDate(a.tarih)).length > 0
            ? [
                'UYARI: Müsaitliği kaldırdığınız tarihler için yayınlanmış (ilan edilmiş) turnuvanız bulunmaktadır!'
              ]
            : []),
          'Değişikliği yöneticinize bildirmek için ardından Kaydet butonuna basmanız gerekir.'
        ]}
        confirmLabel="Evet, Tümünü Temizle"
        variant="danger"
        onCancel={() => setConfirmClearAllOpen(false)}
        onConfirm={() => {
          setConfirmClearAllOpen(false);
          handleClearAllRanges();
        }}
      />

      <ConfirmDialogModal
        isOpen={confirmSaveOpen}
        title={
          uncoveredDraftConflicts.length > 0
            ? 'Yayınlanmış Turnuva Çakışması — Kaydet ve Onayla'
            : 'Müsaitlik Tarihlerini Onayla ve Kaydet'
        }
        message={
          uncoveredDraftConflicts.length > 0
            ? 'Müsaitliği kaldırdığınız tarihler için yayınlanmış (ilan edilmiş) bir turnuvanız var! Değişikliği yine de onaylayıp kaydetmek istediğinize emin misiniz?'
            : draftRanges.length > 0
              ? `${draftRanges.length} adet müsaitlik aralığını onaylayıp sisteme kaydetmek istediğinize emin misiniz?`
              : 'Müsaitlik aralığınız boş (0 aralık) olarak güncellenecektir. Onaylıyor musunuz?'
        }
        details={[
          ...draftRanges.map(r => `Müsait Aralık: ${formatRangeLabel(r)}`),
          ...(uncoveredDraftConflicts.length > 0
            ? uncoveredDraftConflicts.map(
                c =>
                  `UYARI — Yayınlanmış Turnuva: ${c.tesis} (${c.kategori} · ${formatTrDate(c.tarih)}) — yöneticiye otomatik bildirilecektir!`
              )
            : ['Tarih değişikliği yapıldığında TTF Uluslararası Atamalar yöneticisine otomatik bildirim gönderilir.'])
        ]}
        confirmLabel="Evet, Onayla ve Kaydet"
        variant={uncoveredDraftConflicts.length > 0 ? 'warning' : 'primary'}
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          setConfirmSaveOpen(false);
          executeSaveAll();
        }}
      />
    </div>
  );
};
