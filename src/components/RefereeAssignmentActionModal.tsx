import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  ArrowRightLeft, 
  UserCheck, 
  RefreshCw, 
  FileText, 
  Award, 
  MapPin, 
  Calendar, 
  Trophy, 
  Check, 
  AlertTriangle,
  Search,
  User,
  ShieldAlert
} from 'lucide-react';
import { Atama, RefereeAccessMap, RefereeInfo, TournamentBlockData } from '../types';
import {
  checkRefereeAvailability,
  checkSameDateTournamentConflict,
  formatRangeLabel,
  getTournamentDateSpan,
  SAME_DATE_CONFLICT_WARNING,
  UNAVAILABLE_WEEK_WARNING
} from '../utils/availability';
import { ConfirmDialogModal } from './ConfirmDialogModal';

interface RefereeAssignmentActionModalProps {
  assignment: Atama;
  tournament: TournamentBlockData;
  allTournaments: TournamentBlockData[];
  allAssignments?: Atama[];
  allReferees: RefereeInfo[];
  refereeAccessMap?: RefereeAccessMap;
  onClose: () => void;
  onDelete: (assignmentId: number) => void;
  onSwapReferee: (
    assignmentId: number, 
    newRef: { name: string; badgeRef?: string; badgeChair?: string; city?: string }
  ) => void;
  onChangeRole: (assignmentId: number, newRole: string) => void;
  onMoveTournament: (assignmentId: number, targetTournament: TournamentBlockData) => void;
  onOpenDoc: (assignment: Atama) => void;
  onViewRefereeProfile?: (refName: string) => void;
}

type ActionTab = 'role' | 'swap' | 'move' | 'delete';

export const RefereeAssignmentActionModal: React.FC<RefereeAssignmentActionModalProps> = ({
  assignment,
  tournament,
  allTournaments,
  allAssignments = [],
  allReferees,
  refereeAccessMap = {},
  onClose,
  onDelete,
  onSwapReferee,
  onChangeRole,
  onMoveTournament,
  onOpenDoc,
  onViewRefereeProfile
}) => {
  const [activeTab, setActiveTab] = useState<ActionTab>('swap');
  const currentTourSpan = useMemo(() => getTournamentDateSpan(tournament), [tournament]);

  // Role modification state
  const [selectedRole, setSelectedRole] = useState<string>(assignment.gorev || 'KULE HAKEMİ');
  const [customRole, setCustomRole] = useState<string>('');

  // Swap referee state
  const [refSearch, setRefSearch] = useState<string>('');
  const [selectedNewRef, setSelectedNewRef] = useState<RefereeInfo | null>(null);
  const [customNewRefName, setCustomNewRefName] = useState<string>('');

  // Move tournament state
  const [tourSearch, setTourSearch] = useState<string>('');
  const [selectedTargetTourId, setSelectedTargetTourId] = useState<string>('');

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    details?: string[];
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Common quick roles
  const QUICK_ROLES = [
    'SUPERVISOR',
    'REF',
    'HAKEM ŞEFİ',
    'ASS. REF',
    'KULE HAKEMİ',
    'ÇİZGİ HAKEMİ',
    'GÖZLEMCİ',
    'KOORDİNATÖR'
  ];

  // Filtered referees for swap
  const filteredReferees = useMemo(() => {
    const q = refSearch.trim().toLowerCase();
    return allReferees
      .filter(r => r.hakem.toUpperCase() !== assignment.hakem.toUpperCase())
      .filter(r => {
        if (!q) return true;
        return (
          r.hakem.toLowerCase().includes(q) ||
          (r.hakem_sehir && r.hakem_sehir.toLowerCase().includes(q)) ||
          (r.referee_badge && r.referee_badge.toLowerCase().includes(q)) ||
          (r.chair_badge && r.chair_badge.toLowerCase().includes(q))
        );
      })
      .slice(0, 30); // show top matches
  }, [allReferees, refSearch, assignment.hakem]);

  // Candidate tournaments for move (excluding current tournament)
  const candidateTournaments = useMemo(() => {
    const q = tourSearch.trim().toLowerCase();
    return allTournaments
      .filter(t => t.id !== tournament.id)
      .filter(t => {
        if (!q) return true;
        return (
          t.tesis.toLowerCase().includes(q) ||
          t.kategori.toLowerCase().includes(q) ||
          t.sehir.toLowerCase().includes(q) ||
          t.tarihLabel.toLowerCase().includes(q) ||
          t.tarih.includes(q)
        );
      })
      .sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [allTournaments, tournament.id, tourSearch]);

  // Execute Role Update
  const handleApplyRole = () => {
    const roleToSet = customRole.trim() ? customRole.trim().toUpperCase() : selectedRole;
    onChangeRole(assignment.id, roleToSet);
    onClose();
  };

  // Execute Swap Referee
  const handleApplySwap = () => {
    const targetName = selectedNewRef ? selectedNewRef.hakem : customNewRefName.trim().toUpperCase();
    if (!targetName) return;

    setConfirmDialog({
      title: 'Hakem Değişikliğini Onayla',
      message: `${assignment.hakem} yerine ${targetName} adlı hakemi bu göreve atamak istediğinize emin misiniz?`,
      details: [
        `Turnuva: ${tournament.tesis} (${tournament.kategori})`,
        `Görev: ${assignment.gorev}`
      ],
      confirmLabel: 'Evet, Hakemi Değiştir',
      variant: 'warning',
      onConfirm: () => {
        if (selectedNewRef) {
          onSwapReferee(assignment.id, {
            name: selectedNewRef.hakem,
            badgeRef: selectedNewRef.referee_badge,
            badgeChair: selectedNewRef.chair_badge,
            city: selectedNewRef.hakem_sehir
          });
        } else {
          onSwapReferee(assignment.id, {
            name: customNewRefName.trim().toUpperCase(),
            badgeRef: 'N',
            badgeChair: 'N',
            city: 'TÜRKİYE'
          });
        }
        onClose();
      }
    });
  };

  // Execute Move
  const handleApplyMove = () => {
    const target = allTournaments.find(t => t.id === selectedTargetTourId);
    if (!target) return;

    setConfirmDialog({
      title: 'Hakemi Başka Turnuvaya Taşı',
      message: `${assignment.hakem} adlı hakemi ${tournament.tesis} turnuvasından çıkarıp ${target.tesis} (${target.kategori}) turnuvasına taşımak istediğinize emin misiniz?`,
      details: [
        `Hedef Tarih: ${target.tarihLabel || target.tarih}`,
        `Şehir: ${target.sehir}`
      ],
      confirmLabel: 'Evet, Taşı',
      variant: 'warning',
      onConfirm: () => {
        onMoveTournament(assignment.id, target);
        onClose();
      }
    });
  };

  // Execute Delete
  const handleApplyDelete = () => {
    setConfirmDialog({
      title: 'Hakem Atamasını Turnuvadan Kaldır',
      message: `${assignment.hakem} adlı hakemin ${tournament.tesis} (${tournament.kategori}) turnuvasındaki görevini kalıcı olarak kaldırmak istediğinize emin misiniz?`,
      details: [
        `Görev: ${assignment.gorev}`,
        'Bu işlem turnuva matrisinden bu hakemi kaldıracaktır.'
      ],
      confirmLabel: 'Evet, Atamayı Kaldır',
      variant: 'danger',
      onConfirm: () => {
        onDelete(assignment.id);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip with Referee Name & Badge */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-wide uppercase">
                  {assignment.hakem}
                </h3>
                {(assignment.kokart_ref || assignment.kokart_chair) && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                    {assignment.kokart_ref || assignment.kokart_chair}
                  </span>
                )}
                {assignment.sehir && (
                  <span className="text-xs text-slate-400 font-medium">
                    · {assignment.sehir}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                  {assignment.gorev || 'HAKEM'}
                </span>
                <span>·</span>
                <span className="truncate max-w-[280px]">
                  {tournament.tesis} ({tournament.kategori})
                </span>
                <span>·</span>
                <span className="font-mono text-slate-300">
                  {tournament.tarihLabel || tournament.tarih}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs Toolbar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1.5 gap-1.5 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('swap')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'swap'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Hakemi Değiştir</span>
          </button>

          <button
            onClick={() => setActiveTab('move')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'move'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Başka Turnuvaya Taşı</span>
          </button>

          <button
            onClick={() => setActiveTab('role')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'role'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Görevi / Rolü Değiştir</span>
          </button>

          <button
            onClick={() => setActiveTab('delete')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'delete'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 shadow-xs border border-rose-200 dark:border-rose-900 font-bold'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Turnuvadan Kaldır</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          
          {/* TAB 1: SWAP REFEREE (Hakemi Değiştir) */}
          {activeTab === 'swap' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>{assignment.hakem}</strong> yerine bu turnuvaya (<em>{tournament.tesis}</em>) ve bu göreve (<em>{assignment.gorev}</em>) başka bir hakem atayın.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mevcut Hakemler Arasından Seçin ({allReferees.length} Kayıtlı Hakem)
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Hakem adı, şehir veya kokart ara (Örn: ANKARA, WB, SB-R)..."
                    value={refSearch}
                    onChange={(e) => setRefSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Referee list box */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredReferees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Aramanıza uygun hakem bulunamadı.
                    </div>
                  ) : (
                    filteredReferees.map(r => {
                      const isSelected = selectedNewRef?.hakem === r.hakem;
                      const av = checkRefereeAvailability(r.hakem, currentTourSpan, refereeAccessMap);
                      const dateConf = checkSameDateTournamentConflict(
                        r.hakem,
                        currentTourSpan,
                        allAssignments,
                        tournament.id
                      );
                      return (
                        <div
                          key={r.hakem}
                          onClick={() => {
                            setSelectedNewRef(r);
                            setCustomNewRefName('');
                          }}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{r.hakem}</span>
                            {r.hakem_sehir && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                ({r.hakem_sehir})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {dateConf.hasConflict && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Aynı Gün Başka Turnuvada
                              </span>
                            )}
                            {av.status === 'AVAILABLE' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Müsait
                              </span>
                            )}
                            {av.isConflict && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                Müsaitliği Yok
                              </span>
                            )}
                            {(r.referee_badge || r.chair_badge) && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {r.referee_badge || r.chair_badge}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Or type a custom referee name */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Veya Listede Olmayan Yeni Bir Hakem Adı Yazın
                </label>
                <input
                  type="text"
                  placeholder="Yeni Hakem Adı ve Soyadı..."
                  value={customNewRefName}
                  onChange={(e) => {
                    setCustomNewRefName(e.target.value);
                    if (e.target.value) setSelectedNewRef(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Same-Date Conflict Warning for selected replacement */}
              {(selectedNewRef || customNewRefName.trim()) && (() => {
                const targetName = selectedNewRef ? selectedNewRef.hakem : customNewRefName.trim();
                const dateConf = checkSameDateTournamentConflict(
                  targetName,
                  currentTourSpan,
                  allAssignments,
                  tournament.id
                );
                if (!dateConf.hasConflict) return null;
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold">{SAME_DATE_CONFLICT_WARNING}</div>
                      <div className="text-[11px] mt-0.5">{dateConf.warningMessage}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Availability Warning if selected replacement referee is unavailable */}
              {selectedNewRef && (() => {
                const av = checkRefereeAvailability(selectedNewRef.hakem, currentTourSpan, refereeAccessMap);
                if (!av.isConflict) return null;
                return (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold">{UNAVAILABLE_WEEK_WARNING}</div>
                      <div className="text-[11px] mt-0.5">
                        {selectedNewRef.hakem} ({currentTourSpan.startDate === currentTourSpan.endDate ? currentTourSpan.startDate : `${currentTourSpan.startDate} – ${currentTourSpan.endDate}`} tarihlerinde müsait görünmüyor).
                        {av.ranges.length > 0 && ` Seçili aralıkları: ${av.ranges.map(formatRangeLabel).join(', ')}`}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Footer CTA */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={!selectedNewRef && !customNewRefName.trim()}
                  onClick={handleApplySwap}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {selectedNewRef ? `${selectedNewRef.hakem} ile Değiştir` : 'Hakemi Değiştir'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MOVE TO ANOTHER TOURNAMENT (Başka Turnuvaya Taşı) */}
          {activeTab === 'move' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 p-3 rounded-lg text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>{assignment.hakem}</strong> adlı hakemi mevcut turnuvasından (<em>{tournament.tesis}</em>) çıkarıp takvimdeki başka bir turnuvaya aktarın.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hedef Turnuvayı Seçin ({candidateTournaments.length} Alternatif Turnuva)
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Şehir, tesis, kategori veya tarih ile hedef turnuva ara..."
                    value={tourSearch}
                    onChange={(e) => setTourSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {candidateTournaments.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Uygun turnuva bulunamadı.
                    </div>
                  ) : (
                    candidateTournaments.map(t => {
                      const isSelected = selectedTargetTourId === t.id;
                      const tSpan = getTournamentDateSpan(t);
                      const av = checkRefereeAvailability(assignment.hakem, tSpan, refereeAccessMap);
                      const dateConf = checkSameDateTournamentConflict(
                        assignment.hakem,
                        tSpan,
                        allAssignments,
                        tournament.id
                      );
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTargetTourId(t.id)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {t.tesis}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {t.kategori}
                              </span>
                              {dateConf.hasConflict && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Aynı Gün Başka Turnuvada
                                </span>
                              )}
                              {av.status === 'AVAILABLE' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Müsait
                                </span>
                              )}
                              {av.isConflict && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Müsaitliği Yok
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <span>{t.sehir}</span>
                              <span>·</span>
                              <span className="font-mono">{t.tarihLabel || t.tarih}</span>
                              <span>·</span>
                              <span>Mevcut Kadro: {t.rawAssignments.length} Hakem</span>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Same-date & availability warnings when moving referee */}
              {selectedTargetTourId && (() => {
                const targetTour = allTournaments.find(t => t.id === selectedTargetTourId);
                if (!targetTour) return null;
                const targetSpan = getTournamentDateSpan(targetTour);
                const av = checkRefereeAvailability(assignment.hakem, targetSpan, refereeAccessMap);
                const dateConf = checkSameDateTournamentConflict(
                  assignment.hakem,
                  targetSpan,
                  allAssignments,
                  tournament.id
                );
                if (!av.isConflict && !dateConf.hasConflict) return null;
                return (
                  <div className="space-y-2">
                    {dateConf.hasConflict && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-extrabold">{SAME_DATE_CONFLICT_WARNING}</div>
                          <div className="text-[11px] mt-0.5">{dateConf.warningMessage}</div>
                        </div>
                      </div>
                    )}
                    {av.isConflict && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-extrabold">{UNAVAILABLE_WEEK_WARNING}</div>
                          <div className="text-[11px] mt-0.5">
                            {assignment.hakem} ({targetSpan.startDate === targetSpan.endDate ? targetSpan.startDate : `${targetSpan.startDate} – ${targetSpan.endDate}`} tarihlerinde müsait görünmüyor).
                            {av.ranges.length > 0 && ` Seçili aralıkları: ${av.ranges.map(formatRangeLabel).join(', ')}`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Footer CTA */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={!selectedTargetTourId}
                  onClick={handleApplyMove}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Seçilen Turnuvaya Taşı</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CHANGE ROLE (Görevi / Rolü Değiştir) */}
          {activeTab === 'role' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>{assignment.hakem}</strong> hakeminin bu turnuvadaki resmi görev unvanını güncelleyin.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Hızlı Rol Seçin:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUICK_ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role);
                        setCustomRole('');
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                        selectedRole === role && !customRole
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Veya Özel Görev Unvanı Yazın
                </label>
                <input
                  type="text"
                  placeholder="Örn: ATP KULE HAKEMİ, CHIEF UMPIRE..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Footer CTA */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleApplyRole}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Görevi Güncelle ({customRole.trim() || selectedRole})</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DELETE REFEREE (Turnuvadan Kaldır) */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-4 rounded-xl text-rose-950 dark:text-rose-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    Görevlendirmeyi İptal Et / Kaldır
                  </h4>
                  <p className="text-xs text-rose-800 dark:text-rose-300">
                    <strong>{assignment.hakem}</strong> hakemini <strong>{tournament.tesis}</strong> ({tournament.kategori}) turnuvasındaki <em>{assignment.gorev}</em> görevinden çıkarmak üzeresiniz.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 text-slate-600 dark:text-slate-400">
                <div>• Bu işlem hakemin sistem profilini silmez, yalnızca bu turnuvadaki atamasını kaldırır.</div>
                <div>• Turnuva toplam hakem sayısı güncellenecektir.</div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirmDeleteCheck"
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="confirmDeleteCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Bu atamayı kaldırmak istediğimi onaylıyorum
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    disabled={!confirmDelete}
                    onClick={handleApplyDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Turnuvadan Kaldır</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Extra Quick Action Strip at Bottom */}
        <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              onOpenDoc(assignment);
              onClose();
            }}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resmi Görevlendirme Belgesini İncele</span>
          </button>

          {onViewRefereeProfile && (
            <button
              type="button"
              onClick={() => {
                onViewRefereeProfile(assignment.hakem);
                onClose();
              }}
              className="text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Hakemin Tüm Görevleri</span>
              <span>→</span>
            </button>
          )}
        </div>

      </div>

      <ConfirmDialogModal
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        details={confirmDialog?.details}
        confirmLabel={confirmDialog?.confirmLabel || 'Onayla'}
        variant={confirmDialog?.variant || 'warning'}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => {
          const fn = confirmDialog?.onConfirm;
          setConfirmDialog(null);
          if (fn) fn();
        }}
      />
    </div>
  );
};
