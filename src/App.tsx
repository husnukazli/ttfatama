import React, { useState, useEffect, useMemo } from 'react';
import {
  generateInitialAssignments,
  buildRefereeProfiles,
  METADATA_DEFAULT
} from './data/initialData';
import {
  Atama,
  AvailabilityChangeNotification,
  AvailabilityRange,
  FilterState,
  MetadataInfo,
  RefereeAccessMap,
  RefereeInfo,
  TournamentBlockData,
  UserSession
} from './types';
import { Header, ActiveTabType } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { AssignmentsTable } from './components/AssignmentsTable';
import { TournamentCalendar } from './components/TournamentCalendar';
import { RefereesDirectory } from './components/RefereesDirectory';
import { AnalyticsReports } from './components/AnalyticsReports';
import { DataCleanerModal } from './components/DataCleanerModal';
import { OfficialDocumentModal } from './components/OfficialDocumentModal';
import { CreateTournamentModal } from './components/CreateTournamentModal';
import { WeeklyMatrixView } from './components/WeeklyMatrixView';
import { RefereeAvailabilityCalendar } from './components/RefereeAvailabilityCalendar';
import { LandingAuthPage } from './components/LandingAuthPage';
import { AdminStartupAlertModal } from './components/AdminStartupAlertModal';
import {
  checkSameDateTournamentConflict,
  diffAvailabilityRanges,
  findRefereeAccessEntry,
  generateRefereePassword,
  getAllLiveTournamentAvailabilityConflicts,
  getRefereeAccessRecord,
  getRefereeTournamentConflictsForRanges,
  getTournamentDateSpan,
  normalizeRefereeKey
} from './utils/availability';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const STORAGE_KEYS = {
  ASSIGNMENTS: 'ttf_2026_assignments_v3',
  CUSTOM_REFEREES: 'ttf_2026_custom_referees_v3',
  ACCESS_MAP: 'ttf_2026_referee_access_v3',
  SESSION: 'ttf_2026_auth_session_v4',
  NOTIFICATIONS: 'ttf_2026_availability_notifications_v1',
  REFEREE_OVERRIDES: 'ttf_2026_referee_overrides_v1'
};

export interface RefereeProfileUpdate {
  hakem: string;
  hakem_sehir: string;
  referee_badge: string;
  chair_badge: string;
  email?: string;
  telefon?: string;
}

function safeWriteStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

const LEGACY_STORAGE_KEYS = [
  'ttf_2026_assignments_v1',
  'ttf_2026_custom_referees_v1',
  'ttf_2026_referee_access_v1',
  'ttf_2026_user_session_v1',
  'ttf_2026_assignments_v2',
  'ttf_2026_custom_referees_v2',
  'ttf_2026_referee_access_v2',
  'ttf_2026_user_session_v2'
];

export default function App() {
  // Assignments state with localStorage persistence
  const [assignments, setAssignments] = useState<Atama[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return generateInitialAssignments();
  });

  const [metadata, setMetadata] = useState<MetadataInfo>(METADATA_DEFAULT);

  // User Session (Defaults to UNAUTHENTICATED Gatekeeper Login Page)
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'ADMIN' || (parsed.role === 'REFEREE' && parsed.refereeName))) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return { role: 'UNAUTHENTICATED' };
  });

  const [activeTab, setActiveTab] = useState<ActiveTabType>('overview');
  // Optional referee being inspected in availability view by admin
  const [inspectedAvailabilityRef, setInspectedAvailabilityRef] = useState<string | null>(null);

  // Theme state: Light mode default
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('ttf_theme');
    if (saved) return saved === 'dark';
    return false;
  });

  // User-added single & bulk referees pool
  const [customReferees, setCustomReferees] = useState<RefereeInfo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_REFEREES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Admin overrides for referee profile fields (promotions, badge losses, city, email, phone)
  const [refereeOverrides, setRefereeOverrides] = useState<Record<string, RefereeProfileUpdate>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REFEREE_OVERRIDES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return {};
  });

  // Referee Login Permission (checkbox), Admin-Assigned Passwords, and Multi-Range Availability Map
  const [refereeAccessMap, setRefereeAccessMap] = useState<RefereeAccessMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCESS_MAP);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  // Referee Availability Change Notifications (for Admin startup alert)
  const [availabilityNotifications, setAvailabilityNotifications] = useState<AvailabilityChangeNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Modal states
  const [isCleanerOpen, setIsCleanerOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isAdminStartupAlertOpen, setIsAdminStartupAlertOpen] = useState<boolean>(false);
  const [selectedDocAssignment, setSelectedDocAssignment] = useState<Atama | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Cross-component table filter state
  const [tableFilter, setTableFilter] = useState<Partial<FilterState>>({});

  // Clean legacy v1/v2 storage once on mount (never touch v3 access/assignments!)
  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }, []);

  // Persist states
  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
  }, [assignments]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.CUSTOM_REFEREES, customReferees);
  }, [customReferees]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.REFEREE_OVERRIDES, refereeOverrides);
  }, [refereeOverrides]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.ACCESS_MAP, refereeAccessMap);
  }, [refereeAccessMap]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.NOTIFICATIONS, availabilityNotifications);
  }, [availabilityNotifications]);

  useEffect(() => {
    safeWriteStorage(STORAGE_KEYS.SESSION, session);
  }, [session]);

  // Sync dark class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ttf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ttf_theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => {
    setIsDark(prev => !prev);
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5500);
  };

  // Build referee profiles, combine with custom referees, and apply admin profile overrides
  const refereeProfiles = useMemo(() => {
    const baseProfiles = buildRefereeProfiles(assignments);
    const existingMap = new Map<string, RefereeInfo>();
    baseProfiles.forEach(p => existingMap.set(normalizeRefereeKey(p.hakem), p));

    customReferees.forEach(cr => {
      const key = normalizeRefereeKey(cr.hakem);
      const existing = existingMap.get(key);
      if (!existing) {
        baseProfiles.push(cr);
        existingMap.set(key, cr);
      } else {
        if (cr.email && !existing.email) existing.email = cr.email;
        if (cr.telefon && !existing.telefon) existing.telefon = cr.telefon;
      }
    });

    return baseProfiles.map(p => {
      const ov = refereeOverrides[normalizeRefereeKey(p.hakem)];
      if (!ov) return p;
      return {
        ...p,
        hakem_sehir: ov.hakem_sehir || p.hakem_sehir,
        referee_badge: ov.referee_badge || p.referee_badge,
        chair_badge: ov.chair_badge || p.chair_badge,
        email: ov.email !== undefined ? ov.email : p.email,
        telefon: ov.telefon !== undefined ? ov.telefon : p.telefon
      };
    });
  }, [assignments, customReferees, refereeOverrides]);

  // Keep metadata counts synced dynamically (active non-cancelled tournaments & assignments)
  const liveMetadata: MetadataInfo = useMemo(() => {
    const activeOnly = assignments.filter(a => a.durum !== 'İPTAL');
    const tournamentKeys = new Set(activeOnly.map(a => `${a.tarih}_${a.tesis}_${a.kategori}`));
    return {
      ...metadata,
      toplam_aktif_atama: activeOnly.length,
      tekil_hakem_sayisi: refereeProfiles.length,
      toplam_turnuva_sayisi: tournamentKeys.size
    };
  }, [metadata, assignments, refereeProfiles]);

  const enabledRefereeCount = useMemo(() => {
    return refereeProfiles.filter(r => getRefereeAccessRecord(refereeAccessMap, r.hakem)?.canLogin).length;
  }, [refereeProfiles, refereeAccessMap]);

  // Live tournament-vs-availability conflicts and unread notifications
  const liveAvailabilityConflicts = useMemo(
    () => getAllLiveTournamentAvailabilityConflicts(assignments, refereeAccessMap),
    [assignments, refereeAccessMap]
  );

  const unreadNotificationCount = useMemo(
    () => availabilityNotifications.filter(n => !n.isRead).length,
    [availabilityNotifications]
  );

  const totalAdminAlertsCount = useMemo(() => {
    const conflictTournamentsCount = liveAvailabilityConflicts.reduce(
      (sum, c) => sum + c.tournaments.length,
      0
    );
    return unreadNotificationCount + conflictTournamentsCount;
  }, [unreadNotificationCount, liveAvailabilityConflicts]);

  // Show Admin startup alert modal on initial page load if already authenticated as Admin and alerts/conflicts exist
  useEffect(() => {
    if (session.role === 'ADMIN' && (unreadNotificationCount > 0 || liveAvailabilityConflicts.length > 0)) {
      setIsAdminStartupAlertOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single referee registration
  const handleRegisterNewReferee = (
    newRef: RefereeInfo,
    accessConfig?: { canLogin: boolean; password: string }
  ) => {
    const key = normalizeRefereeKey(newRef.hakem);
    setCustomReferees(prev => {
      if (prev.some(r => normalizeRefereeKey(r.hakem) === key)) {
        return prev;
      }
      return [{ ...newRef, hakem: key }, ...prev];
    });

    if (accessConfig) {
      setRefereeAccessMap(prev => {
        const matched = findRefereeAccessEntry(prev, newRef.hakem);
        const targetKey = matched?.key || key;
        const existing = matched?.record;
        const next = {
          ...prev,
          [targetKey]: {
            hakem: targetKey,
            canLogin: accessConfig.canLogin,
            password: accessConfig.password || existing?.password || generateRefereePassword(),
            availability: existing?.availability || [],
            updatedAt: new Date().toISOString()
          }
        };
        safeWriteStorage(STORAGE_KEYS.ACCESS_MAP, next);
        return next;
      });
    }

    if (newRef.email || newRef.telefon) {
      setRefereeOverrides(prev => {
        const next: Record<string, RefereeProfileUpdate> = {
          ...prev,
          [key]: {
            hakem: key,
            hakem_sehir: newRef.hakem_sehir,
            referee_badge: newRef.referee_badge,
            chair_badge: newRef.chair_badge,
            email: newRef.email || undefined,
            telefon: newRef.telefon || undefined
          }
        };
        safeWriteStorage(STORAGE_KEYS.REFEREE_OVERRIDES, next);
        return next;
      });
    }

    triggerToast(`Hakem ${key} (${newRef.hakem_sehir}) sisteme başarıyla eklendi.`);
  };

  // Update existing referee profile (name, city, badges, email, phone)
  const handleUpdateRefereeProfile = (originalName: string, updated: RefereeProfileUpdate) => {
    const origKey = normalizeRefereeKey(originalName);
    const nextKey = normalizeRefereeKey(updated.hakem) || origKey;
    const cleanCity = updated.hakem_sehir.trim().toUpperCase() || 'TÜRKİYE';
    const cleanRefBadge = updated.referee_badge.trim() || '-';
    const cleanChairBadge = updated.chair_badge.trim() || '-';
    const cleanEmail = updated.email?.trim() || undefined;
    const cleanTelefon = updated.telefon?.trim() || undefined;

    const cleanProfile: RefereeProfileUpdate = {
      hakem: nextKey,
      hakem_sehir: cleanCity,
      referee_badge: cleanRefBadge,
      chair_badge: cleanChairBadge,
      email: cleanEmail,
      telefon: cleanTelefon
    };

    setRefereeOverrides(prev => {
      const next = { ...prev };
      if (origKey !== nextKey) {
        delete next[origKey];
      }
      next[nextKey] = cleanProfile;
      safeWriteStorage(STORAGE_KEYS.REFEREE_OVERRIDES, next);
      return next;
    });

    setCustomReferees(prev =>
      prev.map(r => {
        if (normalizeRefereeKey(r.hakem) === origKey) {
          return {
            ...r,
            hakem: nextKey,
            hakem_sehir: cleanCity,
            referee_badge: cleanRefBadge,
            chair_badge: cleanChairBadge,
            email: cleanEmail,
            telefon: cleanTelefon
          };
        }
        return r;
      })
    );

    setAssignments(prev =>
      prev.map(a => {
        if (normalizeRefereeKey(a.hakem) === origKey) {
          return {
            ...a,
            hakem: nextKey,
            hakem_sehir: cleanCity,
            kokart_ref: cleanRefBadge,
            kokart_chair: cleanChairBadge
          };
        }
        return a;
      })
    );

    if (origKey !== nextKey) {
      setRefereeAccessMap(prev => {
        const matched = findRefereeAccessEntry(prev, origKey);
        if (!matched) return prev;
        const next = { ...prev };
        delete next[matched.key];
        next[nextKey] = {
          ...matched.record,
          hakem: nextKey,
          updatedAt: new Date().toISOString()
        };
        safeWriteStorage(STORAGE_KEYS.ACCESS_MAP, next);
        return next;
      });

      setAvailabilityNotifications(prev => {
        const next = prev.map(n =>
          normalizeRefereeKey(n.refereeName) === origKey
            ? { ...n, refereeName: nextKey }
            : n
        );
        safeWriteStorage(STORAGE_KEYS.NOTIFICATIONS, next);
        return next;
      });

      if (inspectedAvailabilityRef && normalizeRefereeKey(inspectedAvailabilityRef) === origKey) {
        setInspectedAvailabilityRef(nextKey);
      }
    }

    triggerToast(`${nextKey} hakem bilgileri başarıyla güncellendi.`);
  };

  // Bulk referee registration
  const handleBulkAddReferees = (
    newRefs: RefereeInfo[],
    options: { grantLogin: boolean; passwordMode: 'AUTO' | 'FIXED'; fixedPassword?: string }
  ) => {
    setCustomReferees(prev => {
      const existingSet = new Set(prev.map(r => normalizeRefereeKey(r.hakem)));
      const uniqueNew = newRefs
        .map(r => ({ ...r, hakem: normalizeRefereeKey(r.hakem) }))
        .filter(r => !existingSet.has(r.hakem));
      return [...uniqueNew, ...prev];
    });

    if (options.grantLogin) {
      setRefereeAccessMap(prev => {
        const next = { ...prev };
        newRefs.forEach(r => {
          const matched = findRefereeAccessEntry(next, r.hakem);
          const targetKey = matched?.key || normalizeRefereeKey(r.hakem);
          const existing = matched?.record;
          next[targetKey] = {
            hakem: targetKey,
            canLogin: true,
            password:
              options.passwordMode === 'FIXED' && options.fixedPassword
                ? options.fixedPassword
                : existing?.password || generateRefereePassword(),
            availability: existing?.availability || [],
            updatedAt: new Date().toISOString()
          };
        });
        safeWriteStorage(STORAGE_KEYS.ACCESS_MAP, next);
        return next;
      });
    }

    triggerToast(`${newRefs.length} hakem toplu olarak sisteme ilave edildi.`);
  };

  // Toggle login permission checkbox (Tik)
  const handleToggleLoginAccess = (refName: string, canLogin: boolean) => {
    setRefereeAccessMap(prev => {
      const matched = findRefereeAccessEntry(prev, refName);
      const targetKey = matched?.key || normalizeRefereeKey(refName);
      const existing = matched?.record;
      const next = {
        ...prev,
        [targetKey]: {
          hakem: targetKey,
          canLogin,
          password: existing?.password || generateRefereePassword(),
          availability: existing?.availability || [],
          updatedAt: new Date().toISOString()
        }
      };
      safeWriteStorage(STORAGE_KEYS.ACCESS_MAP, next);
      return next;
    });
  };

  // Update admin-assigned password
  const handleUpdateRefereePassword = (refName: string, newPassword: string) => {
    setRefereeAccessMap(prev => {
      const matched = findRefereeAccessEntry(prev, refName);
      const targetKey = matched?.key || normalizeRefereeKey(refName);
      const existing = matched?.record;
      const next = {
        ...prev,
        [targetKey]: {
          hakem: targetKey,
          canLogin: existing?.canLogin ?? true,
          password: newPassword,
          availability: existing?.availability || [],
          updatedAt: new Date().toISOString()
        }
      };
      safeWriteStorage(STORAGE_KEYS.ACCESS_MAP, next);
      return next;
    });
  };

  // Bulk set login access for filtered list
  const handleBulkSetAccessForFiltered = (
    refNames: string[],
    canLogin: boolean,
    fixedPassword?: string
  ) => {
    setRefereeAccessMap(prev => {
      const next = { ...prev };
      refNames.forEach(name => {
        const matched = findRefereeAccessEntry(next, name);
        const targetKey = matched?.key || normalizeRefereeKey(name);
        const existing = matched?.record;
        next[targetKey] = {
          hakem: targetKey,
          canLogin,
          password: canLogin
            ? fixedPassword || existing?.password || generateRefereePassword()
            : existing?.password || '',
          availability: existing?.availability || [],
          updatedAt: new Date().toISOString()
        };
      });
      safeWriteStorage(STORAGE_KEYS.ACCESS_MAP, next);
      return next;
    });
  };

  // Save multi-range availability calendar for a referee & notify Admin if changed
  const handleSaveAvailabilityRanges = (refName: string, ranges: AvailabilityRange[]) => {
    const matched = findRefereeAccessEntry(refereeAccessMap, refName);
    const targetKey = matched?.key || normalizeRefereeKey(refName);
    const prevRanges = matched?.record?.availability || [];
    const diff = diffAvailabilityRanges(prevRanges, ranges);

    setRefereeAccessMap(prev => {
      const prevMatched = findRefereeAccessEntry(prev, refName);
      const k = prevMatched?.key || targetKey;
      const existing = prevMatched?.record;
      const next = {
        ...prev,
        [k]: {
          hakem: k,
          canLogin: existing?.canLogin ?? true,
          password: existing?.password || generateRefereePassword(),
          availability: ranges,
          updatedAt: new Date().toISOString()
        }
      };
      safeWriteStorage(STORAGE_KEYS.ACCESS_MAP, next);
      return next;
    });

    if (session.role === 'REFEREE' && diff.hasChanged) {
      const conflicts = getRefereeTournamentConflictsForRanges(targetKey, ranges, assignments, {
        onlyPublished: false,
        ignorePastMonths: true,
        includeWhenRangesEmpty: prevRanges.length > 0
      });
      const notification: AvailabilityChangeNotification = {
        id: `av_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        refereeName: targetKey,
        changedAt: new Date().toISOString(),
        previousRanges: prevRanges,
        newRanges: ranges,
        addedRanges: diff.addedRanges,
        removedRanges: diff.removedRanges,
        conflictingTournaments: conflicts,
        isRead: false
      };
      setAvailabilityNotifications(prev => {
        const next = [notification, ...prev].slice(0, 50);
        safeWriteStorage(STORAGE_KEYS.NOTIFICATIONS, next);
        return next;
      });
    }

    triggerToast(`${targetKey} için ${ranges.length} adet müsaitlik aralığı onaylanarak kaydedildi.`);
  };

  const handleMarkNotificationsRead = () => {
    setAvailabilityNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }));
      safeWriteStorage(STORAGE_KEYS.NOTIFICATIONS, next);
      return next;
    });
    triggerToast('Müsaitlik değişikliği bildirimleri okundu olarak işaretlendi.');
  };

  const handleSaveTournament = (newRecords: Atama[]) => {
    setAssignments(prev => [...newRecords, ...prev]);
    triggerToast(
      `Yeni turnuva (${newRecords[0].tesis} - ${newRecords[0].kategori}) taslak olarak kaydedildi.`
    );
    setActiveTab('matrix');
  };

  const handlePublishTournamentRecords = (assignmentIds: number[]) => {
    const idSet = new Set(assignmentIds);
    setAssignments(prev =>
      prev.map(a => (idSet.has(a.id) ? { ...a, yayinlandi: true } : a))
    );
    triggerToast('Turnuva başarıyla yayınlandı! Atanan hakemler artık kendi sayfalarında görebilir.');
  };

  const handleTogglePublishTournament = (tournament: TournamentBlockData, publish: boolean) => {
    const targetKey = `${tournament.tarih}_${tournament.tesis}_${tournament.kategori}`;
    setAssignments(prev =>
      prev.map(a =>
        `${a.tarih}_${a.tesis}_${a.kategori}` === targetKey
          ? { ...a, yayinlandi: publish }
          : a
      )
    );
    triggerToast(
      publish
        ? `${tournament.tesis} (${tournament.kategori}) turnuvası yayınlandı! Hakemler artık görev listelerinde görebilir.`
        : `${tournament.tesis} (${tournament.kategori}) turnuvası yayından kaldırıldı (taslak durumuna alındı).`
    );
  };

  // Handler for navigation from overview to table with filters
  const handleFilterByCity = (city: string) => {
    setTableFilter({ sehir: city });
    setActiveTab('assignments');
  };

  const handleFilterByMonth = (month: string) => {
    setTableFilter({ ay: month });
    setActiveTab('assignments');
  };

  const handleFilterByBadge = (badge: string) => {
    setTableFilter({ kokart: badge });
    setActiveTab('assignments');
  };

  const handleViewAssignmentsOfReferee = (refName: string) => {
    setTableFilter({ arama: refName });
    setActiveTab('assignments');
  };

  const handleApplyCleanedData = (records: Atama[], newMeta: MetadataInfo) => {
    setAssignments(records);
    setMetadata(newMeta);
  };

  const handleResetDefaultData = () => {
    setAssignments(generateInitialAssignments());
    setCustomReferees([]);
    setMetadata(METADATA_DEFAULT);
    triggerToast('Turnuva atamaları PDF (Ocak–Aralık 2026) verilerine sıfırlandı (hakem yetkileri korundu).');
  };

  // Action: Delete Assignment (Turnuvadan Kaldır)
  const handleDeleteAssignment = (assignmentId: number) => {
    const target = assignments.find(a => a.id === assignmentId);
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    triggerToast(
      target
        ? `${target.hakem} adlı hakemin ${target.tesis} turnuvasındaki ataması kaldırıldı.`
        : 'Hakem ataması başarıyla kaldırıldı.'
    );
  };

  // Action: Swap Referee (Hakemi Değiştir)
  const handleSwapReferee = (
    assignmentId: number,
    newRef: { name: string; badgeRef?: string; badgeChair?: string; city?: string }
  ) => {
    const existing = assignments.find(a => a.id === assignmentId);
    const tourKey = existing ? `${existing.tarih}_${existing.tesis}_${existing.kategori}` : undefined;
    const dateConf = existing
      ? checkSameDateTournamentConflict(newRef.name, getTournamentDateSpan(existing), assignments, tourKey, assignmentId)
      : { hasConflict: false, conflicts: [], warningMessage: '' };

    setAssignments(prev =>
      prev.map(a => {
        if (a.id === assignmentId) {
          return {
            ...a,
            hakem: newRef.name,
            kokart_ref: newRef.badgeRef || a.kokart_ref,
            kokart_chair: newRef.badgeChair || a.kokart_chair,
            hakem_sehir: newRef.city || a.hakem_sehir,
            durum: (newRef.name === 'TBA' || newRef.name === 'EXCHANGE') ? 'BEKLEMEDE' : 'ONAYLANDI'
          };
        }
        return a;
      })
    );
    triggerToast(
      dateConf.hasConflict
        ? `Görevlendirme ${newRef.name} ile değiştirildi. UYARI: ${dateConf.warningMessage}`
        : `Görevlendirme başarıyla ${newRef.name} ile değiştirildi!`
    );
  };

  // Action: Change Role (Görevi Değiştir)
  const handleChangeRole = (assignmentId: number, newRole: string) => {
    setAssignments(prev =>
      prev.map(a => {
        if (a.id === assignmentId) {
          return {
            ...a,
            gorev: newRole
          };
        }
        return a;
      })
    );
    triggerToast(`Hakemin görev unvanı "${newRole}" olarak güncellendi.`);
  };

  // Action: Move to another tournament (Başka Turnuvaya Taşı)
  const handleMoveAssignment = (
    assignmentId: number,
    targetTournament: {
      tarih: string;
      baslangicTarih?: string;
      bitisTarih?: string;
      ay: string;
      sehir: string;
      kategori: string;
      tesis: string;
    }
  ) => {
    const targetRef = assignments.find(a => a.id === assignmentId);
    const destKey = `${targetTournament.tarih}_${targetTournament.tesis}_${targetTournament.kategori}`;
    const dateConf = targetRef
      ? checkSameDateTournamentConflict(
          targetRef.hakem,
          getTournamentDateSpan(targetTournament),
          assignments,
          destKey,
          assignmentId
        )
      : { hasConflict: false, conflicts: [], warningMessage: '' };

    setAssignments(prev =>
      prev.map(a => {
        if (a.id === assignmentId) {
          return {
            ...a,
            tarih: targetTournament.tarih,
            baslangic_tarih: targetTournament.baslangicTarih,
            bitis_tarih: targetTournament.bitisTarih,
            ay: targetTournament.ay,
            sehir: targetTournament.sehir,
            kategori: targetTournament.kategori,
            tesis: targetTournament.tesis
          };
        }
        return a;
      })
    );
    triggerToast(
      targetRef
        ? dateConf.hasConflict
          ? `${targetRef.hakem}, ${targetTournament.tesis} turnuvasına taşındı. UYARI: ${dateConf.warningMessage}`
          : `${targetRef.hakem} başarıyla ${targetTournament.tesis} (${targetTournament.kategori}) turnuvasına taşındı!`
        : 'Hakem başarıyla yeni turnuvaya taşındı!'
    );
  };

  // Action: Save Full Tournament Card Edits (from Gear/Settings Modal)
  const handleSaveTournamentChanges = (
    originalTournamentKey: string,
    updatedAssignments: Atama[],
    newCustomReferees: RefereeInfo[] = []
  ) => {
    if (newCustomReferees.length > 0) {
      setCustomReferees(prev => {
        const existingSet = new Set(prev.map(r => r.hakem.toUpperCase()));
        const unique = newCustomReferees.filter(r => !existingSet.has(r.hakem.toUpperCase()));
        return [...unique, ...prev];
      });
    }

    setAssignments(prev => {
      const remaining = prev.filter(a => `${a.tarih}_${a.tesis}_${a.kategori}` !== originalTournamentKey);
      return [...remaining, ...updatedAssignments];
    });

    const first = updatedAssignments[0];
    triggerToast(
      first
        ? `${first.tesis} (${first.kategori}) turnuva kartı ve ${updatedAssignments.length} hakem kaydı güncellendi.`
        : 'Turnuva kartı güncellendi.'
    );
  };

  // Action: Delete Whole Tournament Card from Calendar (from Gear/Settings Modal)
  const handleDeleteTournament = (tournament: TournamentBlockData) => {
    const key = `${tournament.tarih}_${tournament.tesis}_${tournament.kategori}`;
    setAssignments(prev => prev.filter(a => `${a.tarih}_${a.tesis}_${a.kategori}` !== key));
    triggerToast(
      `${tournament.tesis} (${tournament.kategori} - ${tournament.tarihLabel}) turnuvası takvimden silindi.`
    );
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    safeWriteStorage(STORAGE_KEYS.SESSION, newSession);
    setInspectedAvailabilityRef(null);

    if (newSession.role === 'REFEREE') {
      setActiveTab('myDuties');
      setIsAdminStartupAlertOpen(false);
      triggerToast(`Hoş geldiniz ${newSession.refereeName}. Takvim üzerinden müsaitlik aralıklarınızı seçip kaydedebilirsiniz.`);
    } else if (newSession.role === 'ADMIN') {
      setActiveTab('overview');
      const hasAlerts =
        availabilityNotifications.some(n => !n.isRead) || liveAvailabilityConflicts.length > 0;
      setIsAdminStartupAlertOpen(hasAlerts);
      triggerToast('TTF Uluslararası Atamalar yönetici oturumuna giriş yapıldı.');
    }
  };

  const handleLogout = () => {
    const unauth: UserSession = { role: 'UNAUTHENTICATED' };
    setSession(unauth);
    safeWriteStorage(STORAGE_KEYS.SESSION, unauth);
    setInspectedAvailabilityRef(null);
    setIsAdminStartupAlertOpen(false);
    setIsCleanerOpen(false);
    setIsCreateOpen(false);
    setSelectedDocAssignment(null);
    setSuccessToast(null);
  };

  // GATEKEEPER: Unauthenticated users cannot see any system/referee/tournament data
  if (session.role === 'UNAUTHENTICATED') {
    return (
      <LandingAuthPage
        refereeAccessMap={refereeAccessMap}
        onLoginSuccess={handleLoginSuccess}
        isDark={isDark}
        toggleDark={toggleDark}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setInspectedAvailabilityRef(null);
          setActiveTab(tab);
        }}
        session={session}
        onLogout={handleLogout}
        totalAssignments={liveMetadata.toplam_aktif_atama}
        enabledRefereeCount={enabledRefereeCount}
        alertCount={totalAdminAlertsCount}
        onOpenAlerts={() => setIsAdminStartupAlertOpen(true)}
        onOpenCleaner={() => setIsCleanerOpen(true)}
        onOpenCreateTournament={() => setIsCreateOpen(true)}
        isDark={isDark}
        toggleDark={toggleDark}
      />

      {/* Success Toast */}
      {successToast && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 no-print">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* REFEREE LOGGED-IN VIEW */}
        {session.role === 'REFEREE' && session.refereeName ? (
          <RefereeAvailabilityCalendar
            refereeName={session.refereeName}
            refereeProfile={refereeProfiles.find(
              r => normalizeRefereeKey(r.hakem) === normalizeRefereeKey(session.refereeName || '')
            )}
            savedRanges={
              getRefereeAccessRecord(refereeAccessMap, session.refereeName)?.availability || []
            }
            assignments={assignments}
            onSaveRanges={handleSaveAvailabilityRanges}
            onOpenDoc={(a) => setSelectedDocAssignment(a)}
          />
        ) : inspectedAvailabilityRef ? (
          /* ADMIN INSPECTING / EDITING A REFEREE'S AVAILABILITY CALENDAR */
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setInspectedAvailabilityRef(null)}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Hakem Listesine Geri Dön</span>
            </button>

            <RefereeAvailabilityCalendar
              refereeName={inspectedAvailabilityRef}
              refereeProfile={refereeProfiles.find(
                r => normalizeRefereeKey(r.hakem) === normalizeRefereeKey(inspectedAvailabilityRef)
              )}
              savedRanges={
                getRefereeAccessRecord(refereeAccessMap, inspectedAvailabilityRef)?.availability || []
              }
              assignments={assignments}
              onSaveRanges={handleSaveAvailabilityRanges}
              onOpenDoc={(a) => setSelectedDocAssignment(a)}
              isAdminPreview={true}
            />
          </div>
        ) : (
          /* ADMIN MAIN VIEWS */
          <>
            {activeTab === 'overview' && (
              <DashboardOverview
                assignments={assignments}
                metadata={liveMetadata}
                refereeProfiles={refereeProfiles}
                refereeAccessMap={refereeAccessMap}
                onSelectTab={setActiveTab}
                onFilterByCity={handleFilterByCity}
                onFilterByMonth={handleFilterByMonth}
                onFilterByBadge={handleFilterByBadge}
              />
            )}

            {activeTab === 'matrix' && (
              <WeeklyMatrixView
                assignments={assignments}
                allReferees={refereeProfiles}
                refereeAccessMap={refereeAccessMap}
                currentReferee=""
                onOpenDoc={(a) => setSelectedDocAssignment(a)}
                onDeleteAssignment={handleDeleteAssignment}
                onSwapReferee={handleSwapReferee}
                onChangeRole={handleChangeRole}
                onMoveAssignment={handleMoveAssignment}
                onSaveTournamentChanges={handleSaveTournamentChanges}
                onDeleteTournament={handleDeleteTournament}
                onTogglePublishTournament={handleTogglePublishTournament}
                onViewRefereeProfile={(refName) => {
                  setInspectedAvailabilityRef(refName);
                }}
              />
            )}

            {activeTab === 'assignments' && (
              <AssignmentsTable
                assignments={assignments}
                currentReferee=""
                onViewReferee={(refName) => {
                  setInspectedAvailabilityRef(refName);
                }}
                onOpenAssignmentDoc={(a) => setSelectedDocAssignment(a)}
                onOpenCreateTournament={() => setIsCreateOpen(true)}
                initialFilter={tableFilter}
              />
            )}

            {activeTab === 'calendar' && (
              <TournamentCalendar
                assignments={assignments}
                onSelectAssignment={(a) => {
                  setTableFilter({ arama: a.tesis });
                  setActiveTab('assignments');
                }}
                onFilterByCity={handleFilterByCity}
                onOpenCreateTournament={() => setIsCreateOpen(true)}
              />
            )}

            {activeTab === 'referees' && (
              <RefereesDirectory
                refereeProfiles={refereeProfiles}
                refereeAccessMap={refereeAccessMap}
                currentReferee=""
                onSelectReferee={(refName) => {
                  setInspectedAvailabilityRef(refName);
                }}
                onViewAssignmentsOfReferee={handleViewAssignmentsOfReferee}
                onAddNewReferee={handleRegisterNewReferee}
                onBulkAddReferees={handleBulkAddReferees}
                onToggleLoginAccess={handleToggleLoginAccess}
                onUpdateRefereePassword={handleUpdateRefereePassword}
                onBulkSetAccessForFiltered={handleBulkSetAccessForFiltered}
                onInspectAvailability={(refName) => {
                  setInspectedAvailabilityRef(refName);
                }}
                onUpdateRefereeProfile={handleUpdateRefereeProfile}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsReports
                assignments={assignments}
                metadata={liveMetadata}
                refereeProfiles={refereeProfiles}
              />
            )}
          </>
        )}
      </main>

      {/* Clean & Minimalist Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">
              TTF Uluslararası Atamalar
            </span>
            <span>·</span>
            <span>Türkiye Tenis Federasyonu (MHK)</span>
            <span>·</span>
            <span>2026 Hakem Yönetim Portalı</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>{liveMetadata.toplam_aktif_atama} Atama</span>
            <span>·</span>
            <span>{liveMetadata.tekil_hakem_sayisi} Hakem</span>
            <span>·</span>
            <span>{liveMetadata.toplam_turnuva_sayisi} Turnuva</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateTournamentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        assignments={assignments}
        refereeProfiles={refereeProfiles}
        refereeAccessMap={refereeAccessMap}
        onSaveTournament={handleSaveTournament}
        onPublishTournamentRecords={handlePublishTournamentRecords}
        onRegisterNewReferee={(newRef) => handleRegisterNewReferee(newRef)}
        nextId={assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1}
      />

      <DataCleanerModal
        isOpen={isCleanerOpen}
        onClose={() => setIsCleanerOpen(false)}
        onApplyCleanedData={handleApplyCleanedData}
        onResetDefaultData={handleResetDefaultData}
        currentCount={assignments.length}
      />

      <OfficialDocumentModal
        assignment={selectedDocAssignment}
        onClose={() => setSelectedDocAssignment(null)}
      />

      {session.role === 'ADMIN' && (
        <AdminStartupAlertModal
          isOpen={isAdminStartupAlertOpen}
          onClose={() => setIsAdminStartupAlertOpen(false)}
          notifications={availabilityNotifications}
          liveConflicts={liveAvailabilityConflicts}
          onMarkAllRead={handleMarkNotificationsRead}
          onInspectRefereeCalendar={(refName) => {
            setInspectedAvailabilityRef(refName);
          }}
          onGoToMatrix={() => {
            setInspectedAvailabilityRef(null);
            setActiveTab('matrix');
          }}
        />
      )}
    </div>
  );
}
