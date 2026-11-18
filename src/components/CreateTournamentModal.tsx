import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Trophy, 
  ShieldCheck, 
  Users, 
  UserPlus,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { Atama, RefereeAccessMap, RefereeInfo } from '../types';
import {
  checkRefereeAvailability,
  checkSameDateTournamentConflict,
  formatRangeLabel,
  formatTrDate,
  getMonthNameFromIsoDate,
  SAME_DATE_CONFLICT_WARNING,
  UNAVAILABLE_WEEK_WARNING
} from '../utils/availability';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Atama[];
  refereeProfiles: RefereeInfo[];
  refereeAccessMap: RefereeAccessMap;
  onSaveTournament: (newAssignments: Atama[]) => void;
  onPublishTournamentRecords?: (assignmentIds: number[]) => void;
  onRegisterNewReferee?: (newRef: RefereeInfo) => void;
  nextId: number;
}

type ScheduleGroup = 'SALI-CUMA' | 'SALI-PERŞEMBE' | 'DESIGNATED';

interface CrewMemberDraft {
  hakem: string;
  gorev: string;
  kokart_ref: string;
  kokart_chair: string;
  hakem_sehir: string;
  scheduleGroup?: ScheduleGroup;
}

const BADGE_FILTER_OPTIONS: { key: string; label: string }[] = [
  { key: 'GB', label: 'GB' },
  { key: 'SB', label: 'SB' },
  { key: 'BB', label: 'BB' },
  { key: 'WB', label: 'WB' },
  { key: 'N', label: 'National (N)' },
  { key: 'IL', label: 'İl (IL)' }
];

function matchesBadgeFilters(badgeValue: string | undefined, selectedKeys: string[]): boolean {
  if (selectedKeys.length === 0) return true;
  const raw = (badgeValue || '').trim().toUpperCase();
  if (!raw || raw === '-') return false;
  return selectedKeys.some(key => {
    if (key === 'GB') return raw === 'GB';
    if (key === 'SB') return raw === 'SB' || raw === 'SB-R' || raw.startsWith('SB');
    if (key === 'BB') return raw === 'BB' || raw === 'BB-R' || raw.startsWith('BB');
    if (key === 'WB') return raw === 'WB' || raw === 'WB-R' || raw.startsWith('WB');
    if (key === 'N') return raw === 'N' || raw === 'NATIONAL' || raw === 'ULUSAL';
    if (key === 'IL') return raw === 'IL' || raw === 'İL';
    return raw === key;
  });
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  assignments,
  refereeProfiles,
  refereeAccessMap,
  onSaveTournament,
  onPublishTournamentRecords,
  onRegisterNewReferee,
  nextId
}) => {
  // Tournament Fields
  const [kategori, setKategori] = useState('ITF J60');
  const [customKategori, setCustomKategori] = useState('');
  
  const [sehir, setSehir] = useState('İZMİR');
  const [customSehir, setCustomSehir] = useState('');

  const [tesis, setTesis] = useState('KÜLTÜRPARK TENİS KULÜBÜ');
  const [customTesis, setCustomTesis] = useState('');
  
  const [baslangicTarih, setBaslangicTarih] = useState('2026-11-14');
  const [bitisTarih, setBitisTarih] = useState('2026-11-22');
  const [anaTabloTarih, setAnaTabloTarih] = useState('2026-11-16');
  const [notlar, setNotlar] = useState('');

  // Supervisor (Başhakem) - neutral default + badge filters
  const [supervisorType, setSupervisorType] = useState<'existing' | 'custom'>('existing');
  const [supBadgeFilters, setSupBadgeFilters] = useState<string[]>([]);
  const [supervisor, setSupervisor] = useState(refereeProfiles[0]?.hakem || '');
  const [customSupName, setCustomSupName] = useState('');
  const [customSupCity, setCustomSupCity] = useState('');
  const [customSupRefBadge, setCustomSupRefBadge] = useState('WB');
  const [customSupChairBadge, setCustomSupChairBadge] = useState('N');

  // Hakem Şefi
  const [hakemSefi, setHakemSefi] = useState('');
  const [customSefiName, setCustomSefiName] = useState('');
  const [isCustomSefi, setIsCustomSefi] = useState(false);

  // Additional Crew List (starts empty or clean so admin assigns intentionally)
  const [additionalCrew, setAdditionalCrew] = useState<CrewMemberDraft[]>([]);

  // Mode for adding next crew member: 'existing' vs 'custom' + badge filters + schedule group (for 15K/25K/35K)
  const [crewAddMode, setCrewAddMode] = useState<'existing' | 'custom'>('existing');
  const [crewBadgeFilters, setCrewBadgeFilters] = useState<string[]>([]);
  const [selectedNewRef, setSelectedNewRef] = useState(refereeProfiles[1]?.hakem || refereeProfiles[0]?.hakem || '');
  const [selectedNewRole, setSelectedNewRole] = useState('KULE HAKEMİ');
  const [selectedScheduleGroup, setSelectedScheduleGroup] = useState<ScheduleGroup>('SALI-CUMA');

  // Unlisted custom crew member input fields
  const [unlistedName, setUnlistedName] = useState('');
  const [unlistedRole, setUnlistedRole] = useState('KULE HAKEMİ');
  const [unlistedCity, setUnlistedCity] = useState('');
  const [unlistedRefBadge, setUnlistedRefBadge] = useState('N');
  const [unlistedChairBadge, setUnlistedChairBadge] = useState('N');
  const [unlistedScheduleGroup, setUnlistedScheduleGroup] = useState<ScheduleGroup>('SALI-CUMA');

  // Validation & Availability / Same-date override confirmation
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOverrideAvailability, setConfirmOverrideAvailability] = useState<boolean>(false);
  const [confirmOverrideDateConflict, setConfirmOverrideDateConflict] = useState<boolean>(false);
  const [savedDraftPrompt, setSavedDraftPrompt] = useState<{
    ids: number[];
    title: string;
    tarih: string;
    count: number;
  } | null>(null);

  // Alphabetically sorted referee master list + filtered lists by badge checkboxes
  const sortedReferees = useMemo(() => {
    return [...refereeProfiles].sort((a, b) => a.hakem.localeCompare(b.hakem, 'tr-TR'));
  }, [refereeProfiles]);

  const filteredSupervisorReferees = useMemo(() => {
    return sortedReferees.filter(r => matchesBadgeFilters(r.referee_badge, supBadgeFilters));
  }, [sortedReferees, supBadgeFilters]);

  const filteredCrewReferees = useMemo(() => {
    return sortedReferees.filter(r => {
      const effectiveBadge =
        r.chair_badge && r.chair_badge !== '-' ? r.chair_badge : r.referee_badge;
      return matchesBadgeFilters(effectiveBadge, crewBadgeFilters);
    });
  }, [sortedReferees, crewBadgeFilters]);

  const handleToggleSupBadgeFilter = (badgeKey: string) => {
    const next = supBadgeFilters.includes(badgeKey)
      ? supBadgeFilters.filter(k => k !== badgeKey)
      : [...supBadgeFilters, badgeKey];
    setSupBadgeFilters(next);
    const nextList = sortedReferees.filter(r => matchesBadgeFilters(r.referee_badge, next));
    if (supervisor && !nextList.some(r => r.hakem === supervisor)) {
      setSupervisor('');
    }
  };

  const handleToggleCrewBadgeFilter = (badgeKey: string) => {
    const next = crewBadgeFilters.includes(badgeKey)
      ? crewBadgeFilters.filter(k => k !== badgeKey)
      : [...crewBadgeFilters, badgeKey];
    setCrewBadgeFilters(next);
    const nextList = sortedReferees.filter(r => {
      const effectiveBadge =
        r.chair_badge && r.chair_badge !== '-' ? r.chair_badge : r.referee_badge;
      return matchesBadgeFilters(effectiveBadge, next);
    });
    if (!nextList.some(r => r.hakem === selectedNewRef)) {
      setSelectedNewRef(nextList[0]?.hakem || '');
    }
  };

  // Calculated Month (from Main Draw start date shown on Matrix & PDF)
  const calculatedMonth = useMemo(() => {
    return getMonthNameFromIsoDate(anaTabloTarih);
  }, [anaTabloTarih]);

  // Tournament start..end span used strictly for availability & overlapping tournament checks
  const availabilitySpan = useMemo(() => {
    const s = baslangicTarih || anaTabloTarih;
    const e = bitisTarih || s;
    return s <= e ? { startDate: s, endDate: e } : { startDate: e, endDate: s };
  }, [baslangicTarih, bitisTarih, anaTabloTarih]);

  const availabilitySpanLabel = useMemo(() => {
    return `${formatTrDate(availabilitySpan.startDate)} – ${formatTrDate(availabilitySpan.endDate)}`;
  }, [availabilitySpan]);

  // Existing city suggestions
  const existingCities = useMemo(() => {
    const set = new Set<string>(["İZMİR", "ANTALYA", "ANKARA", "İSTANBUL", "BURSA", "ADANA", "SAMSUN", "MERSİN", "TRABZON", "GAZİANTEP", "MUĞLA", "ESKİŞEHİR", "KAYSERİ", "KONYA", "BATMAN"]);
    assignments.forEach(a => { if (a.sehir) set.add(a.sehir); });
    return Array.from(set).sort();
  }, [assignments]);

  // Date conflict detection helper (already assigned elsewhere on overlapping dates, ignoring cancelled İPTAL)
  const checkConflict = (refName: string, spanToCheck: { startDate: string; endDate: string }) => {
    const res = checkSameDateTournamentConflict(refName, spanToCheck, assignments);
    return res.conflicts[0] || null;
  };

  const finalSupervisorName = supervisorType === 'custom' 
    ? customSupName.trim().toUpperCase() 
    : supervisor;

  const finalSefiName = isCustomSefi ? customSefiName.trim().toUpperCase() : hakemSefi.trim().toUpperCase();

  const supervisorConflict = useMemo(() => {
    return checkConflict(finalSupervisorName, availabilitySpan);
  }, [finalSupervisorName, availabilitySpan, assignments]);

  // Availability check for Supervisor (against Tournament Start..End span)
  const supervisorAvailability = useMemo(() => {
    return checkRefereeAvailability(finalSupervisorName, availabilitySpan, refereeAccessMap);
  }, [finalSupervisorName, availabilitySpan, refereeAccessMap]);

  // Availability & same-date conflict check for currently selected candidate crew member
  const selectedCandidateAvailability = useMemo(() => {
    return checkRefereeAvailability(selectedNewRef, availabilitySpan, refereeAccessMap);
  }, [selectedNewRef, availabilitySpan, refereeAccessMap]);

  const selectedCandidateDateConflict = useMemo(() => {
    return checkSameDateTournamentConflict(selectedNewRef, availabilitySpan, assignments);
  }, [selectedNewRef, availabilitySpan, assignments]);

  // Collect ALL same-date duplicate tournament conflicts across the draft (Supervisor + Hakem Şefi + Crew)
  const sameDateConflictsInDraft = useMemo(() => {
    const list: { name: string; role: string; existingEvent: string }[] = [];

    if (finalSupervisorName) {
      const res = checkSameDateTournamentConflict(finalSupervisorName, availabilitySpan, assignments);
      if (res.hasConflict) {
        list.push({
          name: finalSupervisorName,
          role: 'SUPERVISOR',
          existingEvent: res.conflicts.map(c => `${c.sehir} · ${c.tesis} (${c.kategori})`).join(', ')
        });
      }
    }

    if (finalSefiName) {
      const res = checkSameDateTournamentConflict(finalSefiName, availabilitySpan, assignments);
      if (res.hasConflict) {
        list.push({
          name: finalSefiName,
          role: 'HAKEM ŞEFİ',
          existingEvent: res.conflicts.map(c => `${c.sehir} · ${c.tesis} (${c.kategori})`).join(', ')
        });
      }
    }

    additionalCrew.forEach(m => {
      const res = checkSameDateTournamentConflict(m.hakem, availabilitySpan, assignments);
      if (res.hasConflict) {
        list.push({
          name: m.hakem,
          role: m.gorev,
          existingEvent: res.conflicts.map(c => `${c.sehir} · ${c.tesis} (${c.kategori})`).join(', ')
        });
      }
    });

    return list;
  }, [finalSupervisorName, finalSefiName, additionalCrew, availabilitySpan, assignments]);

  // Collect ALL unavailable referees currently in the draft (Supervisor + Hakem Şefi + Crew)
  const unavailableRefsInDraft = useMemo(() => {
    const list: { name: string; role: string; rangesText: string }[] = [];

    if (finalSupervisorName) {
      const res = checkRefereeAvailability(finalSupervisorName, availabilitySpan, refereeAccessMap);
      if (res.isConflict) {
        list.push({
          name: finalSupervisorName,
          role: 'SUPERVISOR',
          rangesText: res.ranges.length > 0 ? res.ranges.map(formatRangeLabel).join(', ') : 'Müsaitlik aralığı girilmemiş'
        });
      }
    }

    if (finalSefiName) {
      const res = checkRefereeAvailability(finalSefiName, availabilitySpan, refereeAccessMap);
      if (res.isConflict) {
        list.push({
          name: finalSefiName,
          role: 'HAKEM ŞEFİ',
          rangesText: res.ranges.length > 0 ? res.ranges.map(formatRangeLabel).join(', ') : 'Müsaitlik aralığı girilmemiş'
        });
      }
    }

    additionalCrew.forEach(m => {
      const res = checkRefereeAvailability(m.hakem, availabilitySpan, refereeAccessMap);
      if (res.isConflict) {
        list.push({
          name: m.hakem,
          role: m.gorev,
          rangesText: res.ranges.length > 0 ? res.ranges.map(formatRangeLabel).join(', ') : 'Müsaitlik aralığı girilmemiş'
        });
      }
    });

    return list;
  }, [finalSupervisorName, finalSefiName, additionalCrew, availabilitySpan, refereeAccessMap]);

  const refMap = useMemo(() => {
    const map = new Map<string, RefereeInfo>();
    refereeProfiles.forEach(r => map.set(r.hakem, r));
    return map;
  }, [refereeProfiles]);

  const finalSehir = sehir === 'ÖZEL_SEHIR' ? (customSehir.trim().toUpperCase() || 'TÜRKİYE') : sehir;
  const finalTesis = tesis === 'ÖZEL_TESIS' ? (customTesis.trim().toUpperCase() || 'TENİS KORTU') : tesis;
  const finalKategori = kategori === 'ÖZEL_KAT' ? (customKategori.trim().toUpperCase() || 'ULUSAL TURNUVA') : kategori;
  const isScheduleGroupTournament =
    finalKategori.includes('15K') || finalKategori.includes('25K') || finalKategori.includes('35K');

  // Add an existing referee to draft crew
  const handleAddExistingCrew = () => {
    if (!selectedNewRef) return;
    if (additionalCrew.some(c => c.hakem.toUpperCase() === selectedNewRef.toUpperCase())) {
      setFormError(`${selectedNewRef} zaten bu turnuva heyetine eklendi.`);
      return;
    }
    setFormError(null);
    setConfirmOverrideAvailability(false);
    const info = refMap.get(selectedNewRef);
    setAdditionalCrew(prev => [
      ...prev,
      {
        hakem: selectedNewRef,
        gorev: selectedNewRole,
        kokart_ref: info?.referee_badge || 'N',
        kokart_chair: info?.chair_badge || 'N',
        hakem_sehir: info?.hakem_sehir || finalSehir,
        scheduleGroup: isScheduleGroupTournament ? selectedScheduleGroup : undefined
      }
    ]);
  };

  // Add an unlisted custom referee to draft crew
  const handleAddUnlistedCrew = () => {
    const trimmedName = unlistedName.trim().toUpperCase();
    if (!trimmedName) return;

    const memberCity = unlistedCity.trim().toUpperCase() || finalSehir;
    setFormError(null);
    setConfirmOverrideAvailability(false);

    setAdditionalCrew(prev => [
      ...prev,
      {
        hakem: trimmedName,
        gorev: unlistedRole,
        kokart_ref: unlistedRefBadge,
        kokart_chair: unlistedChairBadge,
        hakem_sehir: memberCity,
        scheduleGroup: isScheduleGroupTournament ? unlistedScheduleGroup : undefined
      }
    ]);

    if (onRegisterNewReferee) {
      onRegisterNewReferee({
        hakem: trimmedName,
        hakem_sehir: memberCity,
        referee_badge: unlistedRefBadge,
        chair_badge: unlistedChairBadge,
        toplam_atama: 0,
        gorev_dagilimi: {},
        sehir_dagilimi: {},
        atamalar: []
      });
    }

    setUnlistedName('');
  };

  const handleUpdateCrewScheduleGroup = (index: number, nextGroup: ScheduleGroup) => {
    setAdditionalCrew(prev =>
      prev.map((item, i) => (i === index ? { ...item, scheduleGroup: nextGroup } : item))
    );
  };

  const handleRemoveCrewMember = (index: number) => {
    setAdditionalCrew(prev => prev.filter((_, i) => i !== index));
    setConfirmOverrideAvailability(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!baslangicTarih || !bitisTarih || !anaTabloTarih) {
      setFormError('Lütfen turnuva başlangıç, bitiş ve ana tablo başlangıç gününü seçiniz.');
      return;
    }

    if (baslangicTarih > bitisTarih) {
      setFormError('Turnuva bitiş tarihi, başlangıç tarihinden önce olamaz.');
      return;
    }

    if (!finalSupervisorName) {
      setFormError('Lütfen bir Başhakem (Supervisor) belirleyiniz.');
      return;
    }

    // If there are availability conflicts and admin hasn't confirmed override yet, stop and warn!
    if (unavailableRefsInDraft.length > 0 && !confirmOverrideAvailability) {
      setFormError(UNAVAILABLE_WEEK_WARNING);
      return;
    }

    // If there are same-date duplicate tournament conflicts and admin hasn't confirmed override yet, stop and warn!
    if (sameDateConflictsInDraft.length > 0 && !confirmOverrideDateConflict) {
      setFormError(SAME_DATE_CONFLICT_WARNING);
      return;
    }

    let curId = nextId;
    const newRecords: Atama[] = [];

    // 1. Add Supervisor
    let supKokartRef = 'WB';
    let supKokartChair = 'N';
    let supCity = finalSehir;

    if (supervisorType === 'custom') {
      supKokartRef = customSupRefBadge;
      supKokartChair = customSupChairBadge;
      supCity = customSupCity.trim().toUpperCase() || finalSehir;

      if (onRegisterNewReferee) {
        onRegisterNewReferee({
          hakem: finalSupervisorName,
          hakem_sehir: supCity,
          referee_badge: supKokartRef,
          chair_badge: supKokartChair,
          toplam_atama: 0,
          gorev_dagilimi: {},
          sehir_dagilimi: {},
          atamalar: []
        });
      }
    } else {
      const supInfo = refMap.get(supervisor);
      supKokartRef = supInfo?.referee_badge || 'WB';
      supKokartChair = supInfo?.chair_badge || 'N';
      supCity = supInfo?.hakem_sehir || finalSehir;
    }

    newRecords.push({
      id: curId++,
      tarih: anaTabloTarih,
      baslangic_tarih: baslangicTarih,
      bitis_tarih: bitisTarih,
      ay: calculatedMonth,
      kategori: finalKategori,
      tesis: finalTesis,
      sehir: finalSehir,
      hakem: finalSupervisorName,
      gorev: finalKategori.includes('CHALLENGER') ? 'REF' : 'SUPERVISOR',
      hakem_sehir: supCity,
      kokart_ref: supKokartRef,
      kokart_chair: supKokartChair,
      durum: 'ONAYLANDI',
      notlar: notlar || `${finalTesis} ${finalKategori} Turnuvası Başhakemliği`,
      yayinlandi: false
    });

    // 2. Add Hakem Şefi if specified
    if (finalSefiName) {
      const sefiInfo = refMap.get(finalSefiName);
      newRecords.push({
        id: curId++,
        tarih: anaTabloTarih,
        baslangic_tarih: baslangicTarih,
        bitis_tarih: bitisTarih,
        ay: calculatedMonth,
        kategori: finalKategori,
        tesis: finalTesis,
        sehir: finalSehir,
        hakem: finalSefiName,
        gorev: 'HAKEM ŞEFİ',
        hakem_sehir: sefiInfo?.hakem_sehir || finalSehir,
        kokart_ref: sefiInfo?.referee_badge || 'N',
        kokart_chair: sefiInfo?.chair_badge || 'BB',
        durum: 'ONAYLANDI',
        notlar: notlar || `${finalTesis} Hakem Şefi`,
        yayinlandi: false
      });
    }

    // 3. Add Additional Crew
    additionalCrew.forEach(member => {
      const group = isScheduleGroupTournament ? member.scheduleGroup || 'SALI-CUMA' : undefined;
      const scheduleTokens: string[] = [];
      if (notlar.trim()) scheduleTokens.push(notlar.trim());
      if (group === 'SALI-CUMA') {
        scheduleTokens.push('SÜTUN:1', 'SALI-CUMA');
      } else if (group === 'SALI-PERŞEMBE') {
        scheduleTokens.push('SÜTUN:3', 'SALI-PERŞEMBE');
      } else if (group === 'DESIGNATED') {
        scheduleTokens.push('DESIGNATED');
      }

      newRecords.push({
        id: curId++,
        tarih: anaTabloTarih,
        baslangic_tarih: baslangicTarih,
        bitis_tarih: bitisTarih,
        ay: calculatedMonth,
        kategori: finalKategori,
        tesis: finalTesis,
        sehir: finalSehir,
        hakem: member.hakem,
        gorev: member.gorev,
        hakem_sehir: member.hakem_sehir,
        kokart_ref: member.kokart_ref,
        kokart_chair: member.kokart_chair,
        durum: 'ONAYLANDI',
        notlar: scheduleTokens.length > 0 ? scheduleTokens.join(' | ') : undefined,
        yayinlandi: false
      });
    });

    onSaveTournament(newRecords);
    setSavedDraftPrompt({
      ids: newRecords.map(r => r.id),
      title: `${finalTesis} (${finalKategori})`,
      tarih: anaTabloTarih,
      count: newRecords.length
    });
  };

  if (!isOpen) return null;

  const handleCloseAll = () => {
    setSavedDraftPrompt(null);
    onClose();
  };

  if (savedDraftPrompt) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
          <div className="p-5 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">Turnuva Taslak Olarak Kaydedildi</h2>
                <p className="text-xs text-emerald-100">
                  {savedDraftPrompt.title} · {savedDraftPrompt.count} hakem ataması
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseAll}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs sm:text-sm">
            <p className="font-bold text-slate-900 dark:text-white text-base">
              Turnuvayı şimdi yayınlamak da ister misiniz?
            </p>
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
              Turnuvayı yayınlamadan taslak olarak bırakırsanız, atanan hakemler kendi sayfalarındaki görevlendirme listesinde bu turnuvayı göremez. Atamalarınızı tamamladıktan sonra Haftalık Matris üzerinden çark (Ayarlar) simgesinden dilediğiniz zaman yayınlayabilirsiniz.
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCloseAll}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              Hayır, Taslak Olarak Bırak
            </button>
            <button
              type="button"
              onClick={() => {
                onPublishTournamentRecords?.(savedDraftPrompt.ids);
                handleCloseAll();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Evet, Şimdi Yayınla</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Yeni Turnuva & Hakem Atama Sihirbazı
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                TTF Uluslararası Atamalar · Hakem müsaitlik aralıkları otomatik kontrol edilir
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAll}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* SECTION 1: TOURNAMENT DETAILS */}
          <div className="space-y-4">
            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. Turnuva, Şehir ve Tesis Bilgileri</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Turnuva Kategorisi
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ITF J30">ITF J30 (Juniors)</option>
                  <option value="ITF J60">ITF J60 (Juniors)</option>
                  <option value="ITF J100">ITF J100 (Juniors)</option>
                  <option value="ITF J200">ITF J200 (Juniors)</option>
                  <option value="15K COMBINED">15K COMBINED (WTT)</option>
                  <option value="15K MEN / 15K WOMEN">15K MEN / 15K WOMEN (WTT)</option>
                  <option value="25K / 35K COMBINED">25K / 35K COMBINED (WTT)</option>
                  <option value="25K MEN / 35K WOMEN">25K MEN / 35K WOMEN (WTT)</option>
                  <option value="ATP CHALLENGER">ATP CHALLENGER</option>
                  <option value="WTA 125">WTA 125</option>
                  <option value="MT400 MASTERS">MT400 MASTERS</option>
                  <option value="MT200">MT200 MASTERS</option>
                  <option value="TÜRKİYE BÜYÜKLER ŞAMPİYONASI">TÜRKİYE BÜYÜKLER ŞAMPİYONASI</option>
                  <option value="TTF 16 YAŞ ŞAMPİYONASI">TTF 16 YAŞ ŞAMPİYONASI</option>
                  <option value="ÖZEL_KAT">+ Listede Olmayan Yeni Kategori Ekle...</option>
                </select>
                {kategori === 'ÖZEL_KAT' && (
                  <input
                    type="text"
                    placeholder="Örn: ITF J300 veya TTF SONBAHAR KUPASI"
                    value={customKategori}
                    onChange={(e) => setCustomKategori(e.target.value)}
                    className="mt-2 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-500 rounded-lg text-slate-900 dark:text-white"
                    required
                  />
                )}
              </div>

              {/* City (with custom city capability) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Ev Sahibi Şehir</span>
                  {sehir === 'ÖZEL_SEHIR' && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Yeni Şehir Modu</span>
                  )}
                </label>
                <select
                  value={sehir}
                  onChange={(e) => setSehir(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {existingCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="ÖZEL_SEHIR">+ Listede Olmayan Yeni Şehir Ekle...</option>
                </select>
                {sehir === 'ÖZEL_SEHIR' && (
                  <div className="mt-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      placeholder="Yeni şehir adını yazınız (Örn: DENİZLİ, AYDIN, ÇANAKKALE)"
                      value={customSehir}
                      onChange={(e) => setCustomSehir(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-500 rounded-lg uppercase font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Facility / Venue */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tesis / Kulüp
                </label>
                <select
                  value={tesis}
                  onChange={(e) => setTesis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="KÜLTÜRPARK TENİS KULÜBÜ">KÜLTÜRPARK TENİS KULÜBÜ (İZMİR)</option>
                  <option value="MEGASARAY">MEGASARAY TENNIS ACADEMY (ANTALYA)</option>
                  <option value="ATAK PRO">ATAK PRO (ANKARA)</option>
                  <option value="ENKA SPOR KULÜBÜ">ENKA SPOR KULÜBÜ (İSTANBUL)</option>
                  <option value="TED SPOR KULÜBÜ">TED SPOR KULÜBÜ (İSTANBUL)</option>
                  <option value="ROBINSON ÇAMYUVA">ROBINSON ÇAMYUVA (ANTALYA)</option>
                  <option value="ATDSK">ATDSK (ADANA)</option>
                  <option value="PODYUMPARK">PODYUMPARK (BURSA)</option>
                  <option value="SAMSUN TENİS KULÜBÜ">SAMSUN TENİS KULÜBÜ</option>
                  <option value="ANKARA TENİS KULÜBÜ">ANKARA TENİS KULÜBÜ (ATK)</option>
                  <option value="ÖZEL_TESIS">+ Listede Olmayan Yeni Tesis / Kulüp Ekle...</option>
                </select>
                {tesis === 'ÖZEL_TESIS' && (
                  <div className="mt-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      placeholder="Yeni tesis adını yazınız (Örn: HİTİT TENİS KULÜBÜ)"
                      value={customTesis}
                      onChange={(e) => setCustomTesis(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-500 rounded-lg uppercase font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Three Separate Tournament Dates */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turnuva Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={baslangicTarih}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBaslangicTarih(val);
                      if (bitisTarih && val > bitisTarih) {
                        setBitisTarih(val);
                      }
                      setConfirmOverrideAvailability(false);
                      setConfirmOverrideDateConflict(false);
                    }}
                    min="2026-01-01"
                    max="2027-12-31"
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Müsaitlik kontrol başlangıcı
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turnuva Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={bitisTarih}
                    min={baslangicTarih || '2026-01-01'}
                    max="2027-12-31"
                    onChange={(e) => {
                      setBitisTarih(e.target.value);
                      setConfirmOverrideAvailability(false);
                      setConfirmOverrideDateConflict(false);
                    }}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Müsaitlik kontrol bitişi
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center justify-between">
                    <span>Ana Tablo Başlangıç Günü</span>
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                      {calculatedMonth}
                    </span>
                  </label>
                  <input
                    type="date"
                    value={anaTabloTarih}
                    onChange={(e) => setAnaTabloTarih(e.target.value)}
                    min="2026-01-01"
                    max="2027-12-31"
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-mono font-semibold"
                    required
                  />
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
                    Matris ve PDF’te sadece bu tarih gösterilir
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: SUPERVISOR */}
          <div className="space-y-4">
            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Başhakem (Supervisor / REF) Ataması</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-[11px]">
                <button
                  type="button"
                  onClick={() => setSupervisorType('existing')}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                    supervisorType === 'existing' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Kayıtlı Hakemlerden Seç
                </button>
                <button
                  type="button"
                  onClick={() => setSupervisorType('custom')}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer flex items-center gap-1 ${
                    supervisorType === 'custom' 
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Listede Olmayan Hakem Ekle</span>
                </button>
              </div>
            </div>

            {supervisorType === 'existing' ? (
              <div className="space-y-2.5">
                {/* Side-by-side Badge Filter Checkboxes for Supervisor */}
                <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mr-1">
                    Kokart Filtresi:
                  </span>
                  {BADGE_FILTER_OPTIONS.map(opt => {
                    const checked = supBadgeFilters.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors ${
                          checked
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleSupBadgeFilter(opt.key)}
                          className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                  <span className="ml-auto text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {filteredSupervisorReferees.length} / {sortedReferees.length} hakem
                  </span>
                  {supBadgeFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSupBadgeFilters([])}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <select
                  value={supervisor}
                  onChange={(e) => {
                    setSupervisor(e.target.value);
                    setConfirmOverrideAvailability(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">
                    {filteredSupervisorReferees.length === 0
                      ? '-- Seçili kokarta uygun hakem bulunamadı --'
                      : '-- Başhakem Seçiniz --'}
                  </option>
                  {filteredSupervisorReferees.map(r => {
                    const av = checkRefereeAvailability(r.hakem, availabilitySpan, refereeAccessMap);
                    const avLabel = av.status === 'AVAILABLE'
                      ? ' [✓ Müsait]'
                      : av.isConflict
                        ? ' [⚠ Müsaitliği Yok]'
                        : '';
                    return (
                      <option key={r.hakem} value={r.hakem}>
                        {r.hakem} ({r.referee_badge || 'N'} / {r.chair_badge || 'N'} - {r.hakem_sehir}){avLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span>Listede Olmayan Yeni Başhakem Kaydı:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Hakem Adı Soyadı
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: AHMET YILMAZ"
                      value={customSupName}
                      onChange={(e) => setCustomSupName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md uppercase font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      İkamet Şehri
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: İSTANBUL veya İZMİR"
                      value={customSupCity}
                      onChange={(e) => setCustomSupCity(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Referee Kokartı
                    </label>
                    <select
                      value={customSupRefBadge}
                      onChange={(e) => setCustomSupRefBadge(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                    >
                      <option value="WB">WB (White Badge)</option>
                      <option value="SB-R">SB-R (Silver Badge Ref)</option>
                      <option value="BB-R">BB-R (Bronze Badge Ref)</option>
                      <option value="GB">GB (Gold Badge)</option>
                      <option value="N">N (Ulusal Hakem)</option>
                      <option value="IL">IL (İl Hakemi)</option>
                      <option value="ADAY">Aday Hakem</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Chair Kokartı
                    </label>
                    <select
                      value={customSupChairBadge}
                      onChange={(e) => setCustomSupChairBadge(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                    >
                      <option value="WB">WB (White Badge)</option>
                      <option value="BB">BB (Bronze Badge)</option>
                      <option value="SB">SB (Silver Badge)</option>
                      <option value="GB">GB (Gold Badge)</option>
                      <option value="N">N (Ulusal Hakem)</option>
                      <option value="IL">IL (İl Hakemi)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Supervisor Availability Check Alert */}
            {finalSupervisorName && supervisorAvailability.isConflict && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <div className="font-bold">{UNAVAILABLE_WEEK_WARNING}</div>
                  <div className="text-[11px] mt-0.5">
                    <strong>{finalSupervisorName}</strong> bu turnuva tarih aralığında ({availabilitySpanLabel}) müsait görünmüyor.{' '}
                    {supervisorAvailability.ranges.length > 0
                      ? `Seçili müsaitlikleri: ${supervisorAvailability.ranges.map(formatRangeLabel).join(', ')}`
                      : 'Henüz müsaitlik aralığı bildirilmemiş.'}
                  </div>
                </div>
              </div>
            )}

            {/* Supervisor Conflict feedback */}
            {supervisorConflict && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-[11px] flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Çakışma Uyarısı:</strong> {finalSupervisorName}, {availabilitySpanLabel} tarihlerinde zaten <strong>{supervisorConflict.sehir} ({supervisorConflict.tesis})</strong> turnuvasında görevlidir!
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: CREW ROSTER */}
          <div className="space-y-4">
            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>3. Kule ve Çizgi Hakemleri Heyeti ({additionalCrew.length + (finalSupervisorName ? 1 : 0)} Hakem)</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-[11px]">
                <button
                  type="button"
                  onClick={() => setCrewAddMode('existing')}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                    crewAddMode === 'existing' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Kayıtlı Hakem Seç
                </button>
                <button
                  type="button"
                  onClick={() => setCrewAddMode('custom')}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer flex items-center gap-1 ${
                    crewAddMode === 'custom' 
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Listede Olmayan Hakem Tanımla</span>
                </button>
              </div>
            </div>

            {/* Currently assigned crew preview */}
            <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/40">
              {finalSupervisorName && (
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="text-slate-900 dark:text-white">{finalSupervisorName}</span>
                    <span className="text-[11px] font-mono text-purple-700 dark:text-purple-400">
                      [SUPERVISOR / BAŞHAKEM]
                    </span>
                    {supervisorAvailability.isConflict && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        ⚠ Müsaitliği yok
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">Asil Yetkili</span>
                </div>
              )}

              {(() => {
                const renderCrewRow = (crew: CrewMemberDraft, idx: number) => {
                  const av = checkRefereeAvailability(crew.hakem, availabilitySpan, refereeAccessMap);
                  const dateConf = checkSameDateTournamentConflict(crew.hakem, availabilitySpan, assignments);
                  const group = crew.scheduleGroup || 'SALI-CUMA';
                  const isDesignated = isScheduleGroupTournament && group === 'DESIGNATED';

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between gap-2 p-2 rounded border ${
                        isDesignated
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700'
                          : av.isConflict
                            ? 'bg-white dark:bg-slate-800 border-rose-300 dark:border-rose-800'
                            : dateConf.hasConflict
                              ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-800'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        {isDesignated && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white uppercase">
                            DESIGNATED
                          </span>
                        )}
                        <span className={`font-medium ${isDesignated ? 'text-indigo-950 dark:text-indigo-100 font-bold' : 'text-slate-900 dark:text-white'}`}>
                          {crew.hakem}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {crew.gorev}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {crew.hakem_sehir} (Ref: {crew.kokart_ref} / Kule: {crew.kokart_chair})
                        </span>
                        {dateConf.hasConflict && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded" title={dateConf.warningMessage}>
                            ⚡ Aynı gün başka turnuvada
                          </span>
                        )}
                        {av.isConflict && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            ⚠ Müsaitliği yok
                          </span>
                        )}
                        {av.status === 'AVAILABLE' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            ✓ Müsait
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isScheduleGroupTournament && (
                          <select
                            value={group}
                            onChange={(e) => handleUpdateCrewScheduleGroup(idx, e.target.value as ScheduleGroup)}
                            className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                              group === 'DESIGNATED'
                                ? 'bg-indigo-100 dark:bg-indigo-900/70 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700'
                                : group === 'SALI-PERŞEMBE'
                                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            <option value="SALI-CUMA">Salı - Cuma</option>
                            <option value="SALI-PERŞEMBE">Salı - Perşembe</option>
                            <option value="DESIGNATED">Designated</option>
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveCrewMember(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Bu hakemi ekipten çıkar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                };

                if (!isScheduleGroupTournament || additionalCrew.length === 0) {
                  return additionalCrew.map((crew, idx) => renderCrewRow(crew, idx));
                }

                const saliCumaItems = additionalCrew
                  .map((c, idx) => ({ c, idx }))
                  .filter(x => (x.c.scheduleGroup || 'SALI-CUMA') === 'SALI-CUMA');
                const saliPersembeItems = additionalCrew
                  .map((c, idx) => ({ c, idx }))
                  .filter(x => x.c.scheduleGroup === 'SALI-PERŞEMBE');
                const designatedItems = additionalCrew
                  .map((c, idx) => ({ c, idx }))
                  .filter(x => x.c.scheduleGroup === 'DESIGNATED');

                return (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Salı - Cuma Grubu */}
                      <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-1.5">
                        <div className="text-[11px] font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wide flex items-center justify-between">
                          <span>Salı - Cuma Grubu</span>
                          <span className="font-mono">{saliCumaItems.length}</span>
                        </div>
                        {saliCumaItems.length === 0 ? (
                          <div className="text-[11px] text-slate-400 py-2 text-center">Henüz hakem eklenmedi</div>
                        ) : (
                          saliCumaItems.map(x => renderCrewRow(x.c, x.idx))
                        )}
                      </div>

                      {/* Salı - Perşembe Grubu */}
                      <div className="p-2.5 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 space-y-1.5">
                        <div className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wide flex items-center justify-between">
                          <span>Salı - Perşembe Grubu</span>
                          <span className="font-mono">{saliPersembeItems.length}</span>
                        </div>
                        {saliPersembeItems.length === 0 ? (
                          <div className="text-[11px] text-slate-400 py-2 text-center">Henüz hakem eklenmedi</div>
                        ) : (
                          saliPersembeItems.map(x => renderCrewRow(x.c, x.idx))
                        )}
                      </div>
                    </div>

                    {/* Designated Hakemler (Ayrı satır ve farklı arka plan) */}
                    {designatedItems.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800 space-y-1.5">
                        <div className="text-[11px] font-extrabold text-indigo-800 dark:text-indigo-200 uppercase tracking-wide flex items-center justify-between">
                          <span>Designated Hakemler (Ayrı Satır)</span>
                          <span className="font-mono">{designatedItems.length}</span>
                        </div>
                        <div className="space-y-1.5">
                          {designatedItems.map(x => renderCrewRow(x.c, x.idx))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Crew Member Add Panel */}
            {crewAddMode === 'existing' ? (
              <div className="space-y-2.5 pt-1">
                {/* Side-by-side Badge Filter Checkboxes for Kule / Çizgi Hakemleri */}
                <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mr-1">
                    Kokart Filtresi:
                  </span>
                  {BADGE_FILTER_OPTIONS.map(opt => {
                    const checked = crewBadgeFilters.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors ${
                          checked
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCrewBadgeFilter(opt.key)}
                          className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                  <span className="ml-auto text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {filteredCrewReferees.length} / {sortedReferees.length} hakem
                  </span>
                  {crewBadgeFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCrewBadgeFilters([])}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedNewRef}
                    onChange={(e) => setSelectedNewRef(e.target.value)}
                    className="w-full sm:flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    {filteredCrewReferees.length === 0 ? (
                      <option value="">-- Seçili kokartlara uygun hakem yok --</option>
                    ) : (
                      filteredCrewReferees.map(r => {
                        const av = checkRefereeAvailability(r.hakem, availabilitySpan, refereeAccessMap);
                        const dateConf = checkSameDateTournamentConflict(r.hakem, availabilitySpan, assignments);
                        const avTag = av.status === 'AVAILABLE'
                          ? ' [✓ Müsait]'
                          : av.isConflict
                            ? ' [⚠ Müsaitliği Yok]'
                            : '';
                        const confTag = dateConf.hasConflict ? ' [⚡ Aynı gün başka turnuvada]' : '';
                        return (
                          <option key={r.hakem} value={r.hakem}>
                            {r.hakem} ({r.hakem_sehir} - Ref:{r.referee_badge}/Kule:{r.chair_badge}){avTag}{confTag}
                          </option>
                        );
                      })
                    )}
                  </select>

                  <select
                    value={selectedNewRole}
                    onChange={(e) => setSelectedNewRole(e.target.value)}
                    className="w-full sm:w-36 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="KULE HAKEMİ">Kule Hakemi</option>
                    <option value="HAKEM ŞEFİ">Hakem Şefi</option>
                    <option value="ÇİZGİ HAKEMİ">Çizgi Hakemi</option>
                    <option value="ATP">ATP Kule</option>
                    <option value="WTA">WTA Kule</option>
                    <option value="GÖZLEMCİ">Gözlemci Hakem</option>
                  </select>

                  {isScheduleGroupTournament && (
                    <select
                      value={selectedScheduleGroup}
                      onChange={(e) => setSelectedScheduleGroup(e.target.value as ScheduleGroup)}
                      className="w-full sm:w-40 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs font-bold text-indigo-950 dark:text-indigo-100"
                      title="15K / 25K / 35K çalışma grubu seçimi"
                    >
                      <option value="SALI-CUMA">Salı - Cuma</option>
                      <option value="SALI-PERŞEMBE">Salı - Perşembe</option>
                      <option value="DESIGNATED">Designated</option>
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={handleAddExistingCrew}
                    disabled={!selectedNewRef}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 disabled:opacity-45 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Atama Yap</span>
                  </button>
                </div>

                {selectedCandidateDateConflict.hasConflict && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 text-[11px] flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{selectedCandidateDateConflict.warningMessage}</span>
                  </div>
                )}

                {selectedCandidateAvailability.isConflict && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 text-[11px] flex items-center gap-2 font-semibold">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {UNAVAILABLE_WEEK_WARNING} ({selectedNewRef})
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Listede Olmayan Yeni Hakem Bilgileri:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Hakem Adı Soyadı"
                    value={unlistedName}
                    onChange={(e) => setUnlistedName(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md uppercase font-semibold text-xs"
                  />

                  <select
                    value={unlistedRole}
                    onChange={(e) => setUnlistedRole(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs"
                  >
                    <option value="KULE HAKEMİ">Kule Hakemi</option>
                    <option value="HAKEM ŞEFİ">Hakem Şefi</option>
                    <option value="ÇİZGİ HAKEMİ">Çizgi Hakemi</option>
                    <option value="BAŞHAKEM YRD.">Başhakem Yardımcısı</option>
                    <option value="GÖZLEMCİ">Gözlemci</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Şehir (Örn: İZMİR)"
                    value={unlistedCity}
                    onChange={(e) => setUnlistedCity(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md uppercase text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500 text-[11px]">Kokartlar:</span>
                    <select
                      value={unlistedRefBadge}
                      onChange={(e) => setUnlistedRefBadge(e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    >
                      <option value="WB">Ref: WB</option>
                      <option value="SB-R">Ref: SB-R</option>
                      <option value="BB-R">Ref: BB-R</option>
                      <option value="N">Ref: Ulusal (N)</option>
                      <option value="IL">Ref: İl (IL)</option>
                    </select>

                    <select
                      value={unlistedChairBadge}
                      onChange={(e) => setUnlistedChairBadge(e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    >
                      <option value="WB">Kule: WB</option>
                      <option value="BB">Kule: BB</option>
                      <option value="SB">Kule: SB</option>
                      <option value="N">Kule: Ulusal (N)</option>
                      <option value="IL">Kule: İl (IL)</option>
                    </select>

                    {isScheduleGroupTournament && (
                      <select
                        value={unlistedScheduleGroup}
                        onChange={(e) => setUnlistedScheduleGroup(e.target.value as ScheduleGroup)}
                        className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 rounded text-xs font-bold text-indigo-950 dark:text-indigo-100"
                      >
                        <option value="SALI-CUMA">Salı - Cuma</option>
                        <option value="SALI-PERŞEMBE">Salı - Perşembe</option>
                        <option value="DESIGNATED">Designated</option>
                      </select>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddUnlistedCrew}
                    disabled={!unlistedName.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Listeye Ekle & Atama Yap</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              MHK Görev Açıklaması / Turnuva Notu
            </label>
            <input
              type="text"
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              placeholder="Örn: Kulüp kortlarında teknik toplantı saat 09:30'da yapılacaktır."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          {/* Global Same-Date Duplicate Tournament Conflict Banner */}
          {sameDateConflictsInDraft.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 rounded-xl space-y-2 text-amber-950 dark:text-amber-100">
              <div className="flex items-center gap-2 font-extrabold text-xs uppercase text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Aynı Tarihte Çift Turnuva Çakışması Uyarısı ({availabilitySpanLabel})</span>
              </div>
              <ul className="space-y-1 text-[11px] pl-7 list-disc">
                {sameDateConflictsInDraft.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.name}</strong> ({item.role}) — Aynı tarihte şu turnuvada zaten görevli: <em>{item.existingEvent}</em>
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 pt-2 pl-1 font-bold text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmOverrideDateConflict}
                  onChange={(e) => {
                    setConfirmOverrideDateConflict(e.target.checked);
                    if (e.target.checked) setFormError(null);
                  }}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <span>Aynı tarih çakışma uyarısını gördüm, yine de atamayı kaydetmek istiyorum.</span>
              </label>
            </div>
          )}

          {/* Global Availability Conflict Banner */}
          {unavailableRefsInDraft.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-700 rounded-xl space-y-2 text-rose-950 dark:text-rose-100">
              <div className="flex items-center gap-2 font-extrabold text-xs uppercase text-rose-700 dark:text-rose-300">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{UNAVAILABLE_WEEK_WARNING}</span>
              </div>
              <ul className="space-y-1 text-[11px] pl-7 list-disc">
                {unavailableRefsInDraft.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.name}</strong> ({item.role}) — Müsait aralıkları: <em>{item.rangesText}</em>
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 pt-2 pl-1 font-bold text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmOverrideAvailability}
                  onChange={(e) => {
                    setConfirmOverrideAvailability(e.target.checked);
                    if (e.target.checked) setFormError(null);
                  }}
                  className="w-4 h-4 accent-rose-600 cursor-pointer"
                />
                <span>Müsaitlik uyarısını gördüm, yine de atamayı kaydetmek istiyorum.</span>
              </label>
            </div>
          )}

          {formError && unavailableRefsInDraft.length === 0 && sameDateConflictsInDraft.length === 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-semibold">
              {formError}
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Toplam <strong className="text-slate-900 dark:text-white font-mono">{additionalCrew.length + (finalSupervisorName ? 1 : 0)} resmi atama</strong> kaydedilecek.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold cursor-pointer"
              >
                İptal
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Turnuvayı ve Atamaları Kaydet</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
