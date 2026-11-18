import React, { useState, useMemo } from 'react';
import {
  X,
  Settings,
  Calendar,
  Trophy,
  Users,
  Trash2,
  Plus,
  UserPlus,
  Check,
  AlertTriangle,
  ShieldAlert,
  Palette,
  Search,
  Globe,
  EyeOff
} from 'lucide-react';
import {
  Atama,
  RefereeAccessMap,
  RefereeInfo,
  TournamentBlockData,
  TournamentColorTheme
} from '../types';
import {
  checkRefereeAvailability,
  checkSameDateTournamentConflict,
  formatRangeLabel,
  getMonthNameFromIsoDate,
  getShortDayMonthLabel,
  getTournamentDateSpan,
  isAssignmentPublished,
  SAME_DATE_CONFLICT_WARNING,
  UNAVAILABLE_WEEK_WARNING
} from '../utils/availability';
import {
  getTourTypeFromCategory,
  resolveTourPalette
} from '../utils/tourColors';
import { ConfirmDialogModal } from './ConfirmDialogModal';

interface TournamentEditModalProps {
  tournament: TournamentBlockData;
  allAssignments: Atama[];
  allReferees: RefereeInfo[];
  refereeAccessMap: RefereeAccessMap;
  nextId: number;
  onClose: () => void;
  onSaveTournamentChanges: (
    originalTournamentKey: string,
    updatedAssignments: Atama[],
    newCustomReferees: RefereeInfo[]
  ) => void;
  onDeleteTournament: (tournament: TournamentBlockData) => void;
  onTogglePublishTournament?: (tournament: TournamentBlockData, publish: boolean) => void;
}

type EditTab = 'details' | 'crew' | 'delete';
type ColumnChoice = 'AUTO' | '1' | '2' | '3';
type ScheduleGroupChoice = 'NONE' | 'SALI-CUMA' | 'SALI-PERŞEMBE' | 'DESIGNATED';

interface DraftCrewItem {
  tempId: string;
  existingId?: number;
  hakem: string;
  gorev: string;
  column: ColumnChoice;
  scheduleGroup: ScheduleGroupChoice;
  hakem_sehir: string;
  kokart_ref: string;
  kokart_chair: string;
  cleanNote: string;
}

const ROLE_OPTIONS = [
  'SUPERVISOR',
  'REF',
  'HAKEM ŞEFİ',
  'ASS. REF',
  'KULE HAKEMİ',
  'ÇİZGİ HAKEMİ',
  'DESIGNATED',
  'ATP',
  'WTA',
  'GÖZLEMCİ',
  'TBA',
  'EXCHANGE'
];

const COLOR_OPTIONS: { key: '' | TournamentColorTheme; label: string; swatch: string }[] = [
  { key: '', label: 'Otomatik (Turnuva Tipi)', swatch: 'bg-gradient-to-r from-blue-600 via-orange-500 to-emerald-600' },
  { key: 'blue', label: 'Mavi (ITF WTT)', swatch: 'bg-blue-600' },
  { key: 'emerald', label: 'Yeşil (ITF Juniors)', swatch: 'bg-emerald-600' },
  { key: 'amber', label: 'Turuncu (ITF Masters)', swatch: 'bg-orange-600' },
  { key: 'teal', label: 'Turkuaz (Tennis Europe)', swatch: 'bg-teal-600' },
  { key: 'purple', label: 'Mor (WTA)', swatch: 'bg-purple-600' },
  { key: 'slate', label: 'Siyah / Altın (ATP)', swatch: 'bg-slate-900' },
  { key: 'rose', label: 'Kırmızı (TTF Ulusal)', swatch: 'bg-rose-600' }
];

function parseColumnFromNote(notlar?: string): ColumnChoice {
  if (!notlar) return 'AUTO';
  if (notlar.includes('SÜTUN:1')) return '1';
  if (notlar.includes('SÜTUN:2')) return '2';
  if (notlar.includes('SÜTUN:3')) return '3';
  return 'AUTO';
}

function parseScheduleGroupFromNote(notlar?: string, gorev?: string): ScheduleGroupChoice {
  const n = (notlar || '').toUpperCase();
  const r = (gorev || '').toUpperCase();
  if (r === 'DESIGNATED' || n.includes('DESIGNATED')) return 'DESIGNATED';
  if (n.includes('SALI-CUMA')) return 'SALI-CUMA';
  if (n.includes('SALI-PERŞEMBE')) return 'SALI-PERŞEMBE';
  return 'NONE';
}

function stripInternalNoteTokens(notlar?: string): string {
  if (!notlar) return '';
  return notlar
    .split(/[|·]/)
    .map(p => p.trim())
    .filter(p => {
      if (!p) return false;
      const u = p.toUpperCase();
      if (u.startsWith('SÜTUN:')) return false;
      if (u === 'SALI-CUMA' || u === 'SALI-PERŞEMBE' || u === 'DESIGNATED') return false;
      if (u === 'ATP 50' || u === 'ATP 75' || u === 'ATP 100' || u === 'ATP 125') return false;
      return true;
    })
    .join(' | ');
}

export const TournamentEditModal: React.FC<TournamentEditModalProps> = ({
  tournament,
  allAssignments,
  allReferees,
  refereeAccessMap,
  nextId,
  onClose,
  onSaveTournamentChanges,
  onDeleteTournament,
  onTogglePublishTournament
}) => {
  const originalKey = `${tournament.tarih}_${tournament.tesis}_${tournament.kategori}`;

  const [activeTab, setActiveTab] = useState<EditTab>('details');

  // Tournament metadata draft
  const [tarih, setTarih] = useState<string>(tournament.tarih);
  const [baslangicTarih, setBaslangicTarih] = useState<string>(
    () =>
      tournament.baslangicTarih ||
      tournament.rawAssignments.find(a => a.baslangic_tarih)?.baslangic_tarih ||
      tournament.tarih
  );
  const [bitisTarih, setBitisTarih] = useState<string>(
    () =>
      tournament.bitisTarih ||
      tournament.rawAssignments.find(a => a.bitis_tarih)?.bitis_tarih ||
      tournament.tarih
  );
  const [tarihEtiket, setTarihEtiket] = useState<string>(tournament.tarihLabel || '');
  const [isCustomDateLabel, setIsCustomDateLabel] = useState<boolean>(
    Boolean(tournament.rawAssignments[0]?.tarih_etiket)
  );
  const [kategori, setKategori] = useState<string>(tournament.kategori);
  const [tesis, setTesis] = useState<string>(tournament.tesis);
  const [sehir, setSehir] = useState<string>(tournament.sehir);
  const [isCancelled, setIsCancelled] = useState<boolean>(Boolean(tournament.isCancelled));
  const [isPublished, setIsPublished] = useState<boolean>(() =>
    tournament.rawAssignments.some(a => isAssignmentPublished(a))
  );
  const [pendingUnpublishConfirm, setPendingUnpublishConfirm] = useState<boolean>(false);
  const [colorTheme, setColorTheme] = useState<'' | TournamentColorTheme>(
    tournament.rawAssignments.find(a => a.kart_renk)?.kart_renk || ''
  );
  const [atpLevel, setAtpLevel] = useState<string>(tournament.atpLevel || 'ATP 75');
  const [ortaNot, setOrtaNot] = useState<string>(
    () => tournament.ortaNot || tournament.rawAssignments.find(a => a.orta_not)?.orta_not || ''
  );

  // Crew draft initialized from rawAssignments
  const [draftCrew, setDraftCrew] = useState<DraftCrewItem[]>(() =>
    tournament.rawAssignments.map((a, idx) => ({
      tempId: `existing_${a.id}_${idx}`,
      existingId: a.id,
      hakem: a.hakem,
      gorev: a.gorev || 'KULE HAKEMİ',
      column: parseColumnFromNote(a.notlar),
      scheduleGroup: parseScheduleGroupFromNote(a.notlar, a.gorev),
      hakem_sehir: a.hakem_sehir || a.sehir || '',
      kokart_ref: a.kokart_ref || 'N',
      kokart_chair: a.kokart_chair || 'N',
      cleanNote: stripInternalNoteTokens(a.notlar)
    }))
  );

  // Add new referee panel state
  const [addMode, setAddMode] = useState<'existing' | 'custom'>('existing');
  const [refFilterText, setRefFilterText] = useState<string>('');
  const [newRefName, setNewRefName] = useState<string>(allReferees[0]?.hakem || '');
  const [newRefRole, setNewRefRole] = useState<string>('KULE HAKEMİ');
  const [newRefColumn, setNewRefColumn] = useState<ColumnChoice>('AUTO');
  const [newRefScheduleGroup, setNewRefScheduleGroup] = useState<ScheduleGroupChoice>('SALI-CUMA');

  const [customRefName, setCustomRefName] = useState<string>('');
  const [customRefCity, setCustomRefCity] = useState<string>(tournament.sehir || '');
  const [customRefBadgeRef, setCustomRefBadgeRef] = useState<string>('N');
  const [customRefBadgeChair, setCustomRefBadgeChair] = useState<string>('N');
  const [customRefRole, setCustomRefRole] = useState<string>('KULE HAKEMİ');
  const [customRefColumn, setCustomRefColumn] = useState<ColumnChoice>('AUTO');
  const [customRefScheduleGroup, setCustomRefScheduleGroup] = useState<ScheduleGroupChoice>('SALI-CUMA');
  const [newlyRegisteredRefs, setNewlyRegisteredRefs] = useState<RefereeInfo[]>([]);

  // Confirmation states
  const [confirmConflictSave, setConfirmConflictSave] = useState<boolean>(false);
  const [confirmDeleteTournament, setConfirmDeleteTournament] = useState<boolean>(false);
  const [pendingRowRemove, setPendingRowRemove] = useState<DraftCrewItem | null>(null);
  const [pendingDeleteTournamentModal, setPendingDeleteTournamentModal] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const calculatedMonth = useMemo(() => getMonthNameFromIsoDate(tarih), [tarih]);
  const availabilitySpan = useMemo(() => {
    const s = baslangicTarih || tarih;
    const e = bitisTarih || s;
    return s <= e ? { startDate: s, endDate: e } : { startDate: e, endDate: s };
  }, [baslangicTarih, bitisTarih, tarih]);

  const refLookup = useMemo(() => {
    const map = new Map<string, RefereeInfo>();
    allReferees.forEach(r => map.set(r.hakem.toUpperCase(), r));
    newlyRegisteredRefs.forEach(r => map.set(r.hakem.toUpperCase(), r));
    return map;
  }, [allReferees, newlyRegisteredRefs]);

  const combinedReferees = useMemo(() => {
    const map = new Map<string, RefereeInfo>();
    allReferees.forEach(r => map.set(r.hakem.toUpperCase(), r));
    newlyRegisteredRefs.forEach(r => {
      if (!map.has(r.hakem.toUpperCase())) {
        map.set(r.hakem.toUpperCase(), r);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.hakem.localeCompare(b.hakem, 'tr'));
  }, [allReferees, newlyRegisteredRefs]);

  const filteredCandidateRefs = useMemo(() => {
    const q = refFilterText.trim().toLocaleLowerCase('tr');
    if (!q) return combinedReferees;
    return combinedReferees.filter(
      r =>
        r.hakem.toLocaleLowerCase('tr').includes(q) ||
        (r.hakem_sehir && r.hakem_sehir.toLocaleLowerCase('tr').includes(q)) ||
        (r.referee_badge && r.referee_badge.toLocaleLowerCase('tr').includes(q)) ||
        (r.chair_badge && r.chair_badge.toLocaleLowerCase('tr').includes(q))
    );
  }, [combinedReferees, refFilterText]);

  const isScheduleGroupTournament = useMemo(() => {
    const upper = kategori.toUpperCase();
    return upper.includes('15K') || upper.includes('25K') || upper.includes('35K');
  }, [kategori]);

  const resolvedPreviewTourType = useMemo(
    () => getTourTypeFromCategory(kategori),
    [kategori]
  );

  const resolvedPreviewPalette = useMemo(
    () => resolveTourPalette(resolvedPreviewTourType, colorTheme || undefined),
    [resolvedPreviewTourType, colorTheme]
  );

  // Conflict detection across the current draft crew
  const crewConflicts = useMemo(() => {
    if (isCancelled) {
      return { sameDate: [] as { hakem: string; detail: string }[], availability: [] as { hakem: string; rangesText: string }[], duplicates: [] as string[] };
    }

    const sameDate: { hakem: string; detail: string }[] = [];
    const availability: { hakem: string; rangesText: string }[] = [];
    const duplicates: string[] = [];
    const seenInDraft = new Set<string>();

    draftCrew.forEach(item => {
      const upper = item.hakem.trim().toUpperCase();
      if (!upper || upper === 'TBA' || upper === 'EXCHANGE' || upper === '-') return;

      if (seenInDraft.has(upper)) {
        duplicates.push(upper);
      }
      seenInDraft.add(upper);

      const dateConf = checkSameDateTournamentConflict(
        upper,
        availabilitySpan,
        allAssignments,
        originalKey
      );
      if (dateConf.hasConflict) {
        sameDate.push({
          hakem: upper,
          detail: dateConf.conflicts.map(c => `${c.tesis} (${c.kategori})`).join(', ')
        });
      }

      const av = checkRefereeAvailability(upper, availabilitySpan, refereeAccessMap);
      if (av.isConflict) {
        availability.push({
          hakem: upper,
          rangesText: av.ranges.length > 0 ? av.ranges.map(formatRangeLabel).join(', ') : 'Müsaitlik aralığı girilmemiş'
        });
      }
    });

    return { sameDate, availability, duplicates };
  }, [draftCrew, availabilitySpan, isCancelled, allAssignments, originalKey, refereeAccessMap]);

  const hasAnyWarning =
    crewConflicts.sameDate.length > 0 ||
    crewConflicts.availability.length > 0 ||
    crewConflicts.duplicates.length > 0;

  const handleDateChange = (newDate: string) => {
    setTarih(newDate);
    setConfirmConflictSave(false);
    if (!isCustomDateLabel && newDate) {
      setTarihEtiket(getShortDayMonthLabel(newDate));
    }
  };

  const handleSwapRowReferee = (tempId: string, newHakemName: string) => {
    const upper = newHakemName.trim().toUpperCase();
    const info = refLookup.get(upper);
    setDraftCrew(prev =>
      prev.map(row =>
        row.tempId === tempId
          ? {
              ...row,
              hakem: upper,
              hakem_sehir: info?.hakem_sehir || row.hakem_sehir || sehir,
              kokart_ref: info?.referee_badge || row.kokart_ref || 'N',
              kokart_chair: info?.chair_badge || row.kokart_chair || 'N'
            }
          : row
      )
    );
    setConfirmConflictSave(false);
  };

  const handleUpdateRowField = (
    tempId: string,
    field: keyof DraftCrewItem,
    value: string
  ) => {
    setDraftCrew(prev =>
      prev.map(row => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
    setConfirmConflictSave(false);
  };

  const handleRemoveRow = (tempId: string) => {
    setDraftCrew(prev => prev.filter(row => row.tempId !== tempId));
    setConfirmConflictSave(false);
  };

  const handleUpdateRowScheduleGroup = (tempId: string, nextGroup: ScheduleGroupChoice) => {
    setDraftCrew(prev =>
      prev.map(row => {
        if (row.tempId !== tempId) return row;
        const nextCol: ColumnChoice =
          nextGroup === 'SALI-CUMA'
            ? '1'
            : nextGroup === 'SALI-PERŞEMBE'
              ? '3'
              : nextGroup === 'DESIGNATED'
                ? 'AUTO'
                : row.column;
        return { ...row, scheduleGroup: nextGroup, column: nextCol };
      })
    );
    setConfirmConflictSave(false);
  };

  const handleAddExistingReferee = () => {
    const selected = newRefName || filteredCandidateRefs[0]?.hakem;
    if (!selected) return;
    const upper = selected.trim().toUpperCase();
    const info = refLookup.get(upper);
    const activeScheduleGroup: ScheduleGroupChoice = isScheduleGroupTournament
      ? newRefScheduleGroup
      : 'NONE';
    const effectiveCol: ColumnChoice =
      activeScheduleGroup === 'SALI-CUMA'
        ? '1'
        : activeScheduleGroup === 'SALI-PERŞEMBE'
          ? '3'
          : activeScheduleGroup === 'DESIGNATED'
            ? 'AUTO'
            : newRefColumn;

    setDraftCrew(prev => [
      ...prev,
      {
        tempId: `new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        hakem: upper,
        gorev: newRefRole,
        column: effectiveCol,
        scheduleGroup: activeScheduleGroup,
        hakem_sehir: info?.hakem_sehir || sehir,
        kokart_ref: info?.referee_badge || 'N',
        kokart_chair: info?.chair_badge || 'N',
        cleanNote: ''
      }
    ]);
    setConfirmConflictSave(false);
  };

  const handleAddCustomReferee = () => {
    const upper = customRefName.trim().toUpperCase();
    if (!upper) return;
    const cityUpper = customRefCity.trim().toUpperCase() || sehir.trim().toUpperCase() || 'TÜRKİYE';

    if (!refLookup.has(upper) && upper !== 'TBA' && upper !== 'EXCHANGE') {
      setNewlyRegisteredRefs(prev => [
        ...prev,
        {
          hakem: upper,
          hakem_sehir: cityUpper,
          referee_badge: customRefBadgeRef,
          chair_badge: customRefBadgeChair,
          toplam_atama: 0,
          gorev_dagilimi: {},
          sehir_dagilimi: {},
          atamalar: []
        }
      ]);
    }

    const activeScheduleGroup: ScheduleGroupChoice = isScheduleGroupTournament
      ? customRefScheduleGroup
      : 'NONE';
    const effectiveCol: ColumnChoice =
      activeScheduleGroup === 'SALI-CUMA'
        ? '1'
        : activeScheduleGroup === 'SALI-PERŞEMBE'
          ? '3'
          : activeScheduleGroup === 'DESIGNATED'
            ? 'AUTO'
            : customRefColumn;

    setDraftCrew(prev => [
      ...prev,
      {
        tempId: `new_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        hakem: upper,
        gorev: customRefRole,
        column: effectiveCol,
        scheduleGroup: activeScheduleGroup,
        hakem_sehir: cityUpper,
        kokart_ref: customRefBadgeRef,
        kokart_chair: customRefBadgeChair,
        cleanNote: ''
      }
    ]);

    setCustomRefName('');
    setConfirmConflictSave(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!kategori.trim() || !tesis.trim() || !sehir.trim() || !tarih) {
      setFormError('Turnuva kategorisi, tesis, şehir ve ana tablo tarihi alanları boş bırakılamaz.');
      return;
    }

    if (baslangicTarih && bitisTarih && baslangicTarih > bitisTarih) {
      setFormError('Turnuva bitiş tarihi, başlangıç tarihinden önce olamaz.');
      return;
    }

    if (draftCrew.length === 0 && !isCancelled) {
      setFormError('Aktif bir turnuvada en az 1 hakem (veya TBA slotu) bulunmalıdır. Turnuvayı kaldırmak için "Turnuvayı Sil" sekmesini kullanabilirsiniz.');
      return;
    }

    if (hasAnyWarning && !confirmConflictSave) {
      setFormError('Kaydetmeden önce aşağıdaki tarih çakışması / müsaitlik uyarılarını onaylayın.');
      return;
    }

    let runningNewId = nextId;
    const finalKategori = kategori.trim().toUpperCase();
    const finalTesis = tesis.trim().toUpperCase();
    const finalSehir = sehir.trim().toUpperCase();
    const finalDateLabel = tarihEtiket.trim() || getShortDayMonthLabel(tarih);
    const isDefaultAutoDateLabel = finalDateLabel === getShortDayMonthLabel(tarih);

    const buildNotlar = (row: DraftCrewItem): string | undefined => {
      const tokens: string[] = [];
      if (row.cleanNote.trim()) tokens.push(row.cleanNote.trim());
      if (row.scheduleGroup === 'DESIGNATED') {
        tokens.push('DESIGNATED');
      } else if (row.scheduleGroup === 'SALI-CUMA') {
        tokens.push('SÜTUN:1', 'SALI-CUMA');
      } else if (row.scheduleGroup === 'SALI-PERŞEMBE') {
        tokens.push('SÜTUN:3', 'SALI-PERŞEMBE');
      } else if (row.column !== 'AUTO') {
        tokens.push(`SÜTUN:${row.column}`);
      }
      if (resolvedPreviewTourType === 'ATP_CHALLENGER' && atpLevel) {
        tokens.push(atpLevel);
      }
      return tokens.length > 0 ? tokens.join(' | ') : undefined;
    };

    const updatedAssignments: Atama[] =
      draftCrew.length === 0 && isCancelled
        ? [
            {
              id: tournament.rawAssignments[0]?.id ?? runningNewId++,
              tarih,
              baslangic_tarih: baslangicTarih || undefined,
              bitis_tarih: bitisTarih || undefined,
              ay: calculatedMonth,
              kategori: finalKategori,
              tesis: finalTesis,
              sehir: finalSehir,
              hakem: '-',
              gorev: 'İPTAL',
              hakem_sehir: '',
              kokart_ref: '',
              kokart_chair: '',
              durum: 'İPTAL',
              tarih_etiket: isDefaultAutoDateLabel ? undefined : finalDateLabel,
              kart_renk: colorTheme || undefined,
              yayinlandi: isPublished,
              orta_not: ortaNot.trim() || undefined
            }
          ]
        : draftCrew.map(row => {
            const upperName = row.hakem.trim().toUpperCase();
            const isPlaceholder = upperName === 'TBA' || upperName === 'EXCHANGE' || upperName === '-';
            return {
              id: row.existingId ?? runningNewId++,
              tarih,
              baslangic_tarih: baslangicTarih || undefined,
              bitis_tarih: bitisTarih || undefined,
              ay: calculatedMonth,
              kategori: finalKategori,
              tesis: finalTesis,
              sehir: finalSehir,
              hakem: upperName,
              gorev: row.gorev.trim().toUpperCase() || 'KULE HAKEMİ',
              hakem_sehir: row.hakem_sehir || finalSehir,
              kokart_ref: row.kokart_ref || 'N',
              kokart_chair: row.kokart_chair || 'N',
              durum: isCancelled ? 'İPTAL' : isPlaceholder ? 'BEKLEMEDE' : 'ONAYLANDI',
              notlar: buildNotlar(row),
              tarih_etiket: isDefaultAutoDateLabel ? undefined : finalDateLabel,
              kart_renk: colorTheme || undefined,
              yayinlandi: isPublished,
              orta_not: ortaNot.trim() || undefined
            };
          });

    onSaveTournamentChanges(originalKey, updatedAssignments, newlyRegisteredRefs);
    onClose();
  };

  const handlePublishToggleAction = (nextPublish: boolean) => {
    setIsPublished(nextPublish);
    if (onTogglePublishTournament) {
      onTogglePublishTournament(tournament, nextPublish);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Turnuva Kartı Ayarları & Detaylı Düzenleme
              </h2>
              <p className="text-xs text-slate-400">
                {tournament.tesis} · {tournament.kategori} · {tournament.tarihLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            <span>Turnuva Bilgileri, Tarih & Renk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crew')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'crew'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Hakem Kadrosu & Yeni Hakem Ekle ({draftCrew.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delete')}
            className={`ml-auto px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'delete'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Turnuvayı Takvimden Sil</span>
          </button>
        </div>

        {/* Publish / Unpublish Control Strip (Always Accessible from Gear Modal) */}
        <div
          className={`px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0 ${
            isPublished
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
              : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isPublished ? (
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-extrabold">
                {isPublished ? 'Yayın Durumu: YAYINLANDI' : 'Yayın Durumu: TASLAK (Yayınlanmadı)'}
              </span>
              <span className="hidden sm:inline text-[11px] opacity-85 ml-2">
                {isPublished
                  ? '— Atanan hakemler bu turnuvayı kendi görev listelerinde görebilir.'
                  : '— Yayınlanana kadar hakemler kendi sayfalarında bu turnuvayı göremez.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPublished ? (
              <button
                type="button"
                onClick={() => setPendingUnpublishConfirm(true)}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/60 font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Yayından Kaldır</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePublishToggleAction(true)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Turnuvayı Yayınla</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Live Color Card Preview Strip */}
              <div className={`rounded-lg overflow-hidden border-2 ${resolvedPreviewPalette.bannerBorderClass}`}>
                <div className={`px-3 py-2 flex items-center justify-between font-bold text-xs ${resolvedPreviewPalette.bannerBgClass}`}>
                  <span>{resolvedPreviewPalette.label}</span>
                  <span className="font-mono">{tarihEtiket || getShortDayMonthLabel(tarih)}</span>
                  <span>{isCancelled ? 'İPTAL · TTF' : 'TTF'}</span>
                </div>
                <div className={`grid grid-cols-3 text-center py-1.5 text-[11px] font-bold ${resolvedPreviewPalette.subHeaderBgClass}`}>
                  <div className="truncate px-2">{sehir || 'ŞEHİR'}</div>
                  <div className="truncate px-2 border-x border-slate-300/60">{kategori || 'KATEGORİ'}</div>
                  <div className="truncate px-2">{tesis || 'TESİS'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turnuva Adı / Kategorisi
                  </label>
                  <input
                    type="text"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    list="category-presets"
                    placeholder="Örn: 15K COMBINED, ITF J60, MT400..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold uppercase"
                    required
                  />
                  <datalist id="category-presets">
                    <option value="15K COMBINED" />
                    <option value="25K / 35K COMBINED" />
                    <option value="ITF J30" />
                    <option value="ITF J60" />
                    <option value="ITF J100" />
                    <option value="ITF J200" />
                    <option value="MT200" />
                    <option value="MT400" />
                    <option value="MT1000" />
                    <option value="TE -U14&U" />
                    <option value="ATP CHALLENGER" />
                    <option value="WTA 125" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tesis / Kulüp Adı
                  </label>
                  <input
                    type="text"
                    value={tesis}
                    onChange={(e) => setTesis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ev Sahibi Şehir
                  </label>
                  <input
                    type="text"
                    value={sehir}
                    onChange={(e) => setSehir(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                    Ana Tablo Başlangıç Günü ({calculatedMonth} 2026 · Matris & PDF)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={tarih}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-emerald-400 dark:border-emerald-700 rounded-lg font-mono font-semibold"
                      required
                    />
                    <span className="px-2.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                      {calculatedMonth}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turnuva Başlangıç Tarihi (Müsaitlik Kontrolü)
                  </label>
                  <input
                    type="date"
                    value={baslangicTarih}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBaslangicTarih(val);
                      if (bitisTarih && val > bitisTarih) setBitisTarih(val);
                      setConfirmConflictSave(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turnuva Bitiş Tarihi (Müsaitlik Kontrolü)
                  </label>
                  <input
                    type="date"
                    value={bitisTarih}
                    min={baslangicTarih || undefined}
                    onChange={(e) => {
                      setBitisTarih(e.target.value);
                      setConfirmConflictSave(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kart Başlık Tarih Etiketi (İsteğe bağlı aralık)
                  </label>
                  <input
                    type="text"
                    value={tarihEtiket}
                    onChange={(e) => {
                      setTarihEtiket(e.target.value);
                      setIsCustomDateLabel(true);
                    }}
                    placeholder="Örn: 9 Kasım veya 28 Şubat - 09 Mart"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turnuva Durumu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelled(false)}
                      className={`py-2 px-3 rounded-lg border font-bold cursor-pointer ${
                        !isCancelled
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Aktif Turnuva
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCancelled(true)}
                      className={`py-2 px-3 rounded-lg border font-bold cursor-pointer ${
                        isCancelled
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      İptal Edildi
                    </button>
                  </div>
                </div>
              </div>

              {(isScheduleGroupTournament || Boolean(ortaNot.trim())) && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Orta Sütun Notu (İsteğe bağlı · Boş bırakılırsa orta sütun boş kalır)
                  </label>
                  <input
                    type="text"
                    value={ortaNot}
                    onChange={(e) => setOrtaNot(e.target.value)}
                    placeholder="Örn: Eleme Pazar Başlar / Not..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              )}

              {resolvedPreviewTourType === 'ATP_CHALLENGER' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ATP Challenger Seviyesi (Orta Sütun)
                  </label>
                  <select
                    value={atpLevel}
                    onChange={(e) => setAtpLevel(e.target.value)}
                    className="w-full sm:w-56 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                  >
                    <option value="ATP 50">ATP 50</option>
                    <option value="ATP 75">ATP 75</option>
                    <option value="ATP 100">ATP 100</option>
                    <option value="ATP 125">ATP 125</option>
                  </select>
                </div>
              )}

              {/* Card Color Theme Picker (Preserved in Matrix & PDF Export) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>Kart Rengi (Matriste ve PDF Çıktısında Birebir Korunur)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map(opt => {
                    const selected = colorTheme === opt.key;
                    return (
                      <button
                        key={opt.key || 'auto'}
                        type="button"
                        onClick={() => setColorTheme(opt.key)}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          selected
                            ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-sm shrink-0 ${opt.swatch}`}></span>
                        <span className="truncate text-[11px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREW ROSTER MANAGEMENT */}
          {activeTab === 'crew' && (
            <div className="space-y-5">
              {/* Current Crew Table/List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Mevcut Hakem Heyeti ({draftCrew.length} Görevli)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Hakem adı, rolü veya sütun yerini doğrudan güncelleyebilirsiniz.
                  </span>
                </div>

                {draftCrew.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                    Bu turnuvada henüz hakem bulunmuyor. Aşağıdan yeni hakem ekleyebilirsiniz.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {draftCrew.map(row => {
                      const upper = row.hakem.trim().toUpperCase();
                      const av = checkRefereeAvailability(upper, availabilitySpan, refereeAccessMap);
                      const dateConf = checkSameDateTournamentConflict(
                        upper,
                        availabilitySpan,
                        allAssignments,
                        originalKey
                      );
                      const isInList = combinedReferees.some(r => r.hakem.toUpperCase() === upper);

                      return (
                        <div
                          key={row.tempId}
                          className={`p-3 rounded-xl border space-y-2 ${
                            dateConf.hasConflict || av.isConflict
                              ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                              : row.scheduleGroup === 'DESIGNATED'
                                ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
                          }`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            {/* Referee Selector / Name */}
                            <div className="sm:col-span-5">
                              {isInList ? (
                                <select
                                  value={upper}
                                  onChange={(e) => handleSwapRowReferee(row.tempId, e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
                                >
                                  {combinedReferees.map(r => {
                                    const rDateConf = checkSameDateTournamentConflict(
                                      r.hakem,
                                      availabilitySpan,
                                      allAssignments,
                                      originalKey
                                    );
                                    const rAv = checkRefereeAvailability(r.hakem, availabilitySpan, refereeAccessMap);
                                    const tags = [
                                      rAv.isConflict ? '⚠ Müsait değil' : '',
                                      rDateConf.hasConflict ? '⚡ Aynı gün başka turnuva' : ''
                                    ]
                                      .filter(Boolean)
                                      .join(' / ');
                                    return (
                                      <option key={r.hakem} value={r.hakem.toUpperCase()}>
                                        {r.hakem} {r.hakem_sehir ? `(${r.hakem_sehir})` : ''}
                                        {tags ? ` [${tags}]` : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={row.hakem}
                                  onChange={(e) => handleUpdateRowField(row.tempId, 'hakem', e.target.value.toUpperCase())}
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold uppercase text-xs"
                                />
                              )}
                            </div>

                            {/* Role */}
                            <div className="sm:col-span-3">
                              <select
                                value={ROLE_OPTIONS.includes(row.gorev) ? row.gorev : '__CUSTOM__'}
                                onChange={(e) => {
                                  if (e.target.value !== '__CUSTOM__') {
                                    handleUpdateRowField(row.tempId, 'gorev', e.target.value);
                                  }
                                }}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                              >
                                {ROLE_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                                {!ROLE_OPTIONS.includes(row.gorev) && (
                                  <option value="__CUSTOM__">{row.gorev}</option>
                                )}
                              </select>
                            </div>

                            {/* Schedule Group (15K/25K/35K) or Column placement */}
                            <div className="sm:col-span-3">
                              {isScheduleGroupTournament || row.scheduleGroup !== 'NONE' ? (
                                <select
                                  value={row.scheduleGroup}
                                  onChange={(e) => handleUpdateRowScheduleGroup(row.tempId, e.target.value as ScheduleGroupChoice)}
                                  className={`w-full px-2 py-1.5 border rounded-lg text-xs font-semibold ${
                                    row.scheduleGroup === 'DESIGNATED'
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                                  }`}
                                >
                                  <option value="SALI-CUMA">Salı - Cuma</option>
                                  <option value="SALI-PERŞEMBE">Salı - Perşembe</option>
                                  <option value="DESIGNATED">Designated (Ayrı Satır)</option>
                                  <option value="NONE">Genel / Sütun Otomatik</option>
                                </select>
                              ) : (
                                <select
                                  value={row.column}
                                  onChange={(e) => handleUpdateRowField(row.tempId, 'column', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                                >
                                  <option value="AUTO">Sütun: Otomatik</option>
                                  <option value="1">Sol Sütun (1)</option>
                                  <option value="2">Orta Sütun (2)</option>
                                  <option value="3">Sağ Sütun (3)</option>
                                </select>
                              )}
                            </div>

                            {/* Remove button */}
                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setPendingRowRemove(row)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                title="Bu hakemi turnuvadan çıkar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Row-level conflict & availability badges */}
                          {(dateConf.hasConflict || av.isConflict) && (
                            <div className="flex flex-wrap gap-2 text-[11px] pt-0.5">
                              {dateConf.hasConflict && (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>
                                    Aynı gün başka turnuvada: {dateConf.conflicts.map(c => `${c.tesis} (${c.kategori})`).join(', ')}
                                  </span>
                                </span>
                              )}
                              {av.isConflict && (
                                <span className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>{UNAVAILABLE_WEEK_WARNING}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Referee to Tournament */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Turnuvaya Yeni Hakem Ekle</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAddMode('existing')}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        addMode === 'existing'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Kayıtlı Hakemden Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode('custom')}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer flex items-center gap-1 ${
                        addMode === 'custom'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Listede Olmayan Hakem</span>
                    </button>
                  </div>
                </div>

                {addMode === 'existing' ? (
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={refFilterText}
                        onChange={(e) => setRefFilterText(e.target.value)}
                        placeholder="Hakem listesinde ara (ad, şehir, kokart)..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <select
                        value={newRefName}
                        onChange={(e) => setNewRefName(e.target.value)}
                        className="sm:col-span-5 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      >
                        {filteredCandidateRefs.map(r => {
                          const rAv = checkRefereeAvailability(r.hakem, availabilitySpan, refereeAccessMap);
                          const rDateConf = checkSameDateTournamentConflict(
                            r.hakem,
                            availabilitySpan,
                            allAssignments,
                            originalKey
                          );
                          const flags = [
                            rAv.status === 'AVAILABLE' ? '✓ Müsait' : rAv.isConflict ? '⚠ Müsaitliği yok' : '',
                            rDateConf.hasConflict ? '⚡ Aynı gün başka turnuva' : ''
                          ]
                            .filter(Boolean)
                            .join(' | ');
                          return (
                            <option key={r.hakem} value={r.hakem}>
                              {r.hakem} ({r.hakem_sehir}){flags ? ` [${flags}]` : ''}
                            </option>
                          );
                        })}
                      </select>

                      <select
                        value={newRefRole}
                        onChange={(e) => setNewRefRole(e.target.value)}
                        className="sm:col-span-3 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        {ROLE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {isScheduleGroupTournament ? (
                        <select
                          value={newRefScheduleGroup}
                          onChange={(e) => setNewRefScheduleGroup(e.target.value as ScheduleGroupChoice)}
                          className="sm:col-span-2 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        >
                          <option value="SALI-CUMA">Salı - Cuma</option>
                          <option value="SALI-PERŞEMBE">Salı - Perşembe</option>
                          <option value="DESIGNATED">Designated</option>
                        </select>
                      ) : (
                        <select
                          value={newRefColumn}
                          onChange={(e) => setNewRefColumn(e.target.value as ColumnChoice)}
                          className="sm:col-span-2 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="AUTO">Otomatik</option>
                          <option value="1">Sol (1)</option>
                          <option value="2">Orta (2)</option>
                          <option value="3">Sağ (3)</option>
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={handleAddExistingReferee}
                        className="sm:col-span-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ekle</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Hakem Adı Soyadı"
                      value={customRefName}
                      onChange={(e) => setCustomRefName(e.target.value)}
                      className="sm:col-span-4 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-semibold text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Şehir"
                      value={customRefCity}
                      onChange={(e) => setCustomRefCity(e.target.value)}
                      className="sm:col-span-2 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase text-xs"
                    />
                    <select
                      value={customRefRole}
                      onChange={(e) => setCustomRefRole(e.target.value)}
                      className="sm:col-span-2 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      {ROLE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {isScheduleGroupTournament ? (
                      <select
                        value={customRefScheduleGroup}
                        onChange={(e) => setCustomRefScheduleGroup(e.target.value as ScheduleGroupChoice)}
                        className="sm:col-span-2 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <option value="SALI-CUMA">Salı - Cuma</option>
                        <option value="SALI-PERŞEMBE">Salı - Perşembe</option>
                        <option value="DESIGNATED">Designated</option>
                      </select>
                    ) : (
                      <select
                        value={customRefColumn}
                        onChange={(e) => setCustomRefColumn(e.target.value as ColumnChoice)}
                        className="sm:col-span-2 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="AUTO">Otomatik</option>
                        <option value="1">Sol (1)</option>
                        <option value="2">Orta (2)</option>
                        <option value="3">Sağ (3)</option>
                      </select>
                    )}
                    <button
                      type="button"
                      disabled={!customRefName.trim()}
                      onClick={handleAddCustomReferee}
                      className="sm:col-span-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ekle</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DELETE TOURNAMENT */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-950 dark:text-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-sm">
                    Turnuvayı Takvimden Kalıcı Olarak Sil
                  </div>
                  <p className="text-xs text-rose-800 dark:text-rose-300">
                    <strong>{tournament.tesis} ({tournament.kategori})</strong> — {tournament.tarihLabel} turnuvasını ve bu turnuvaya bağlı <strong>{tournament.rawAssignments.length} hakem atamasını</strong> takvimden tamamen silmek üzeresiniz.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmDeleteTournament}
                  onChange={(e) => setConfirmDeleteTournament(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 cursor-pointer"
                />
                <span>Bu turnuvayı ve tüm atamalarını takvimden silmek istediğimi onaylıyorum.</span>
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!confirmDeleteTournament}
                  onClick={() => setPendingDeleteTournamentModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Turnuvayı Takvimden Sil</span>
                </button>
              </div>
            </div>
          )}

          {/* Unified Same-Date & Availability Warnings before Save */}
          {activeTab !== 'delete' && hasAnyWarning && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2.5 text-amber-950 dark:text-amber-100">
              {crewConflicts.sameDate.length > 0 && (
                <div>
                  <div className="font-extrabold text-xs flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{SAME_DATE_CONFLICT_WARNING} ({tarih})</span>
                  </div>
                  <ul className="pl-6 mt-1 list-disc text-[11px] space-y-0.5">
                    {crewConflicts.sameDate.map((c, idx) => (
                      <li key={idx}>
                        <strong>{c.hakem}</strong> aynı tarihte şu turnuvada da görevli: <em>{c.detail}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {crewConflicts.duplicates.length > 0 && (
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  • Aynı hakem bu turnuva kadrosuna birden fazla kez eklenmiş: {Array.from(new Set(crewConflicts.duplicates)).join(', ')}
                </div>
              )}

              {crewConflicts.availability.length > 0 && (
                <div>
                  <div className="font-extrabold text-xs flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{UNAVAILABLE_WEEK_WARNING}</span>
                  </div>
                  <ul className="pl-6 mt-1 list-disc text-[11px] space-y-0.5">
                    {crewConflicts.availability.map((a, idx) => (
                      <li key={idx}>
                        <strong>{a.hakem}</strong> — Müsait aralıkları: <em>{a.rangesText}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <label className="flex items-center gap-2 pt-1 font-bold text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmConflictSave}
                  onChange={(e) => {
                    setConfirmConflictSave(e.target.checked);
                    if (e.target.checked) setFormError(null);
                  }}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <span>Çakışma / müsaitlik uyarılarını inceledim, yine de kaydetmek istiyorum.</span>
              </label>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 font-semibold text-xs">
              {formError}
            </div>
          )}

          {/* Footer Save Bar */}
          {activeTab !== 'delete' && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Kayıt sonrası matriste ve PDF çıktısında anında güncellenir.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Confirmation for removing a referee row */}
      <ConfirmDialogModal
        isOpen={Boolean(pendingRowRemove)}
        title="Hakemi Turnuva Kadrosundan Çıkar"
        message={
          pendingRowRemove
            ? `${pendingRowRemove.hakem} (${pendingRowRemove.gorev}) kaydını bu turnuva kadrosundan kaldırmak istediğinize emin misiniz?`
            : ''
        }
        confirmLabel="Evet, Kadrodan Çıkar"
        variant="danger"
        onCancel={() => setPendingRowRemove(null)}
        onConfirm={() => {
          if (pendingRowRemove) {
            handleRemoveRow(pendingRowRemove.tempId);
          }
          setPendingRowRemove(null);
        }}
      />

      {/* Confirmation for deleting whole tournament */}
      <ConfirmDialogModal
        isOpen={pendingDeleteTournamentModal}
        title="Turnuvayı Kalıcı Olarak Sil"
        message={`${tournament.tesis} (${tournament.kategori} · ${tournament.tarihLabel}) turnuvasını takvimden tamamen silmek istediğinize emin misiniz?`}
        details={[
          `Bu turnuvaya bağlı ${tournament.rawAssignments.length} hakem ataması takvimden kaldırılacaktır.`,
          'Bu işlem geri alınamaz.'
        ]}
        confirmLabel="Evet, Turnuvayı Sil"
        variant="danger"
        onCancel={() => setPendingDeleteTournamentModal(false)}
        onConfirm={() => {
          setPendingDeleteTournamentModal(false);
          onDeleteTournament(tournament);
          onClose();
        }}
      />

      {/* Confirmation for unpublishing tournament */}
      <ConfirmDialogModal
        isOpen={pendingUnpublishConfirm}
        title="Turnuvayı Yayından Kaldır"
        message={`${tournament.tesis} (${tournament.kategori} · ${tournament.tarihLabel}) turnuvasını yayından kaldırmak istediğinize emin misiniz?`}
        details={[
          'Yayından kaldırıldığında bu turnuva taslak durumuna geçer.',
          'Atanan hakemler kendi sayfalarındaki görev listesinde bu turnuvayı göremez.'
        ]}
        confirmLabel="Evet, Yayından Kaldır"
        variant="warning"
        onCancel={() => setPendingUnpublishConfirm(false)}
        onConfirm={() => {
          setPendingUnpublishConfirm(false);
          handlePublishToggleAction(false);
        }}
      />
    </div>
  );
};
