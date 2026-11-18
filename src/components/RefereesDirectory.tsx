import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  MapPin,
  ChevronRight,
  UserPlus,
  X,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Download,
  CheckSquare,
  Square,
  Upload,
  Pencil,
  Mail,
  Phone,
  Send,
  MessageCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AvailabilityRange,
  RefereeAccessMap,
  RefereeInfo
} from '../types';
import {
  formatRangeLabel,
  generateRefereePassword,
  getRefereeAccessRecord
} from '../utils/availability';
import { BulkAddRefereesModal } from './BulkAddRefereesModal';
import { ConfirmDialogModal } from './ConfirmDialogModal';

interface RefereesDirectoryProps {
  refereeProfiles: RefereeInfo[];
  refereeAccessMap: RefereeAccessMap;
  currentReferee: string;
  onSelectReferee: (refName: string) => void;
  onViewAssignmentsOfReferee: (refName: string) => void;
  onAddNewReferee?: (
    newRef: RefereeInfo,
    accessConfig?: { canLogin: boolean; password: string }
  ) => void;
  onBulkAddReferees?: (
    referees: RefereeInfo[],
    options: { grantLogin: boolean; passwordMode: 'AUTO' | 'FIXED'; fixedPassword?: string }
  ) => void;
  onToggleLoginAccess: (refName: string, canLogin: boolean) => void;
  onUpdateRefereePassword: (refName: string, newPassword: string) => void;
  onBulkSetAccessForFiltered: (refNames: string[], canLogin: boolean, password?: string) => void;
  onInspectAvailability: (refName: string) => void;
  onUpdateRefereeProfile?: (
    originalName: string,
    updated: {
      hakem: string;
      hakem_sehir: string;
      referee_badge: string;
      chair_badge: string;
      email?: string;
      telefon?: string;
    }
  ) => void;
}

function formatWhatsAppPhone(phone?: string): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits.length >= 10 ? digits : null;
  }

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = `90${digits.slice(1)}`;
  } else if (digits.length === 10 && digits.startsWith('5')) {
    digits = `90${digits}`;
  }

  return digits.length >= 10 ? digits : null;
}

function buildCredentialShareText(refName: string, password: string): string {
  const portalUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return [
    `Sayın ${refName},`,
    '',
    'TTF Uluslararası Atamalar Portalı giriş bilgileriniz tanımlanmıştır:',
    `• Hakem Adı (Listeden seçilecek): ${refName}`,
    `• Giriş Şifreniz: ${password}`,
    ...(portalUrl ? [`• Giriş Adresi: ${portalUrl}`] : []),
    '',
    'Hakem Girişi alanından adınızı listeden seçip şifrenizle giriş yaptıktan sonra müsaitlik aralıklarınızı belirleyebilirsiniz.',
    'TTF Uluslararası Atamalar Kurulu'
  ].join('\n');
}

export const RefereesDirectory: React.FC<RefereesDirectoryProps> = ({
  refereeProfiles,
  refereeAccessMap,
  currentReferee,
  onSelectReferee,
  onViewAssignmentsOfReferee,
  onAddNewReferee,
  onBulkAddReferees,
  onToggleLoginAccess,
  onUpdateRefereePassword,
  onBulkSetAccessForFiltered,
  onInspectAvailability,
  onUpdateRefereeProfile
}) => {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('');
  const [accessFilter, setAccessFilter] = useState<'ALL' | 'ENABLED' | 'WITH_AVAILABILITY'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showPasswords, setShowPasswords] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Single Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newRefBadge, setNewRefBadge] = useState('N');
  const [newChairBadge, setNewChairBadge] = useState('N');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCanLogin, setNewCanLogin] = useState(true);
  const [newPassword, setNewPassword] = useState(() => generateRefereePassword());

  // Edit Referee Modal State
  const [editingReferee, setEditingReferee] = useState<RefereeInfo | null>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRefBadge, setEditRefBadge] = useState('N');
  const [editChairBadge, setEditChairBadge] = useState('N');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Send Credentials (WhatsApp / Email) Modal State
  const [sendCredsTarget, setSendCredsTarget] = useState<RefereeInfo | null>(null);
  const [sendPhoneInput, setSendPhoneInput] = useState('');
  const [sendEmailInput, setSendEmailInput] = useState('');
  const [sendMessageText, setSendMessageText] = useState('');

  // Bulk Add Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Bulk password modal/bar state
  const [bulkFixedPassword, setBulkFixedPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation dialog state for destructive/important actions
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    details?: string[];
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Extract cities
  const cities = useMemo(() => {
    const set = new Set<string>();
    refereeProfiles.forEach(r => {
      if (r.hakem_sehir) set.add(r.hakem_sehir);
    });
    return Array.from(set).sort();
  }, [refereeProfiles]);

  // Summary counters
  const enabledCount = useMemo(() => {
    return refereeProfiles.filter(r => getRefereeAccessRecord(refereeAccessMap, r.hakem)?.canLogin).length;
  }, [refereeProfiles, refereeAccessMap]);

  const withAvailabilityCount = useMemo(() => {
    return refereeProfiles.filter(
      r => (getRefereeAccessRecord(refereeAccessMap, r.hakem)?.availability?.length || 0) > 0
    ).length;
  }, [refereeProfiles, refereeAccessMap]);

  // Filtered referees
  const filteredReferees = useMemo(() => {
    return refereeProfiles.filter(r => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !r.hakem.toLowerCase().includes(q) &&
          !r.hakem_sehir.toLowerCase().includes(q) &&
          !(r.email || '').toLowerCase().includes(q) &&
          !(r.telefon || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      if (selectedCity && r.hakem_sehir !== selectedCity) return false;

      if (selectedBadge) {
        const refMatch = (r.referee_badge || '').toUpperCase().includes(selectedBadge.toUpperCase());
        const chairMatch = (r.chair_badge || '').toUpperCase().includes(selectedBadge.toUpperCase());
        if (!refMatch && !chairMatch) return false;
      }

      const acc = getRefereeAccessRecord(refereeAccessMap, r.hakem);
      if (accessFilter === 'ENABLED' && !acc?.canLogin) return false;
      if (accessFilter === 'WITH_AVAILABILITY' && !(acc?.availability && acc.availability.length > 0)) {
        return false;
      }

      return true;
    });
  }, [refereeProfiles, search, selectedCity, selectedBadge, accessFilter, refereeAccessMap]);

  const handleCreateRefereeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim().toUpperCase();
    const cleanCity = newCity.trim().toUpperCase() || 'TÜRKİYE';
    const cleanEmail = newEmail.trim() || undefined;
    const cleanPhone = newPhone.trim() || undefined;

    if (!cleanName) return;

    if (onAddNewReferee) {
      onAddNewReferee(
        {
          hakem: cleanName,
          hakem_sehir: cleanCity,
          referee_badge: newRefBadge,
          chair_badge: newChairBadge,
          email: cleanEmail,
          telefon: cleanPhone,
          toplam_atama: 0,
          gorev_dagilimi: {},
          sehir_dagilimi: {},
          atamalar: []
        },
        {
          canLogin: newCanLogin,
          password: newPassword.trim() || generateRefereePassword()
        }
      );
    }

    showToast(`Hakem ${cleanName} (${cleanCity}) sisteme eklendi.`);
    setNewName('');
    setNewCity('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword(generateRefereePassword());
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (referee: RefereeInfo) => {
    setEditingReferee(referee);
    setEditName(referee.hakem);
    setEditCity(referee.hakem_sehir || 'TÜRKİYE');
    setEditRefBadge(referee.referee_badge || '-');
    setEditChairBadge(referee.chair_badge || '-');
    setEditEmail(referee.email || '');
    setEditPhone(referee.telefon || '');
    setEditError(null);
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReferee) return;
    const cleanName = editName.trim().toLocaleUpperCase('tr-TR');
    if (!cleanName) {
      setEditError('Hakem adı soyadı boş bırakılamaz.');
      return;
    }

    const origUpper = editingReferee.hakem.trim().toLocaleUpperCase('tr-TR');
    if (
      cleanName !== origUpper &&
      refereeProfiles.some(r => r.hakem.trim().toLocaleUpperCase('tr-TR') === cleanName)
    ) {
      setEditError(`"${cleanName}" adında başka bir hakem zaten sistemde kayıtlı.`);
      return;
    }

    onUpdateRefereeProfile?.(editingReferee.hakem, {
      hakem: cleanName,
      hakem_sehir: editCity.trim().toLocaleUpperCase('tr-TR') || 'TÜRKİYE',
      referee_badge: editRefBadge || '-',
      chair_badge: editChairBadge || '-',
      email: editEmail.trim() || undefined,
      telefon: editPhone.trim() || undefined
    });

    showToast(`${cleanName} hakem bilgileri güncellendi.`);
    setEditingReferee(null);
    setEditError(null);
  };

  const handleOpenSendModal = (referee: RefereeInfo) => {
    const acc = getRefereeAccessRecord(refereeAccessMap, referee.hakem);
    const pass = acc?.password || '';
    setSendCredsTarget(referee);
    setSendPhoneInput(referee.telefon || '');
    setSendEmailInput(referee.email || '');
    setSendMessageText(buildCredentialShareText(referee.hakem, pass));
  };

  const handleSaveInlineContactBeforeSend = () => {
    if (!sendCredsTarget || !onUpdateRefereeProfile) return;
    const cleanPhone = sendPhoneInput.trim() || undefined;
    const cleanEmail = sendEmailInput.trim() || undefined;
    if (
      cleanPhone !== (sendCredsTarget.telefon || undefined) ||
      cleanEmail !== (sendCredsTarget.email || undefined)
    ) {
      onUpdateRefereeProfile(sendCredsTarget.hakem, {
        hakem: sendCredsTarget.hakem,
        hakem_sehir: sendCredsTarget.hakem_sehir || 'TÜRKİYE',
        referee_badge: sendCredsTarget.referee_badge || '-',
        chair_badge: sendCredsTarget.chair_badge || '-',
        telefon: cleanPhone,
        email: cleanEmail
      });
      setSendCredsTarget(prev =>
        prev ? { ...prev, telefon: cleanPhone, email: cleanEmail } : null
      );
    }
  };

  const handleCopyCredentials = (refName: string, password: string) => {
    const text = `TTF Uluslararası Atamalar Giriş Bilgileriniz\nHakem: ${refName}\nŞifre: ${password}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(refName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportCredentialsExcel = () => {
    const rows = refereeProfiles
      .filter(r => getRefereeAccessRecord(refereeAccessMap, r.hakem)?.canLogin)
      .map(r => {
        const acc = getRefereeAccessRecord(refereeAccessMap, r.hakem);
        return {
          'HAKEM ADI': r.hakem,
          'ŞEHİR': r.hakem_sehir,
          'TELEFON': r.telefon || '',
          'E-POSTA': r.email || '',
          'REF KOKART': r.referee_badge,
          'KULE KOKART': r.chair_badge,
          'GİRİŞ YETKİSİ': acc?.canLogin ? 'AKTİF' : 'PASİF',
          'ŞİFRE': acc?.password || '',
          'MÜSAİTLİK ARALIKLARI': (acc?.availability || [])
            .map(av => formatRangeLabel(av))
            .join(' | ')
        };
      });

    if (rows.length === 0) {
      showToast('Dışa aktarılacak giriş yetkili hakem bulunamadı.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yetkili Hakemler');
    XLSX.writeFile(wb, 'TTF_Yetkili_Hakem_Sifreleri_ve_Musaitlikler.xlsx');
    showToast(`${rows.length} yetkili hakemin şifre ve müsaitlik listesi Excel olarak indirildi.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold ml-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header and Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Hakem Listesi, Giriş Yetkileri ve Şifre Yönetimi ({refereeProfiles.length} Hakem)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Yanına tik koyduğunuz hakemler kendilerine verilen şifreyle giriş yapıp takvimden birden fazla müsaitlik aralığı seçebilir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Yönetim Listesi</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartlar</span>
              </button>
            </div>

            {/* Bulk Add Referee Button */}
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Toplu Hakem Ekle</span>
            </button>

            {/* Single Add Referee Button */}
            <button
              type="button"
              onClick={() => {
                setNewPassword(generateRefereePassword());
                setIsAddModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Yeni Hakem Ekle</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setAccessFilter('ALL')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              accessFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="text-[11px] opacity-80">Toplam Kayıtlı Hakem</div>
            <div className="text-lg font-extrabold font-mono">{refereeProfiles.length} Hakem</div>
          </button>

          <button
            type="button"
            onClick={() => setAccessFilter(accessFilter === 'ENABLED' ? 'ALL' : 'ENABLED')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              accessFilter === 'ENABLED'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="text-[11px] opacity-85">Giriş Yetkisi Verilen (Tikli)</div>
            <div className="text-lg font-extrabold font-mono">{enabledCount} Hakem</div>
          </button>

          <button
            type="button"
            onClick={() => setAccessFilter(accessFilter === 'WITH_AVAILABILITY' ? 'ALL' : 'WITH_AVAILABILITY')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              accessFilter === 'WITH_AVAILABILITY'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
            }`}
          >
            <div className="text-[11px] opacity-85">Müsaitlik Bildiren Hakemler</div>
            <div className="text-lg font-extrabold font-mono">{withAvailabilityCount} Hakem</div>
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Hakem veya Şehir Ara
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Hakem adı veya şehir yazın..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              İkamet Şehri
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            >
              <option value="">Tüm Şehirler ({cities.length})</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Kokart Derecesi
            </label>
            <select
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            >
              <option value="">Tüm Kokartlar</option>
              <option value="WB">WB (White Badge)</option>
              <option value="SB">SB / SB-R (Silver Badge)</option>
              <option value="BB">BB / BB-R (Bronze Badge)</option>
              <option value="N">Ulusal (N)</option>
              <option value="IL">İl Hakemi (IL)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Yetki Filtresi
            </label>
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            >
              <option value="ALL">Tümü ({refereeProfiles.length})</option>
              <option value="ENABLED">Sadece Giriş Yetkililer ({enabledCount})</option>
              <option value="WITH_AVAILABILITY">Müsaitlik Girenler ({withAvailabilityCount})</option>
            </select>
          </div>
        </div>

        {/* Bulk Access Actions Toolbar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              Filtrelenen {filteredReferees.length} Hakem İçin Toplu İşlem:
            </span>
            <input
              type="text"
              placeholder="Ortak şifre (boş=otomatik)"
              value={bulkFixedPassword}
              onChange={(e) => setBulkFixedPassword(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[11px] w-44"
            />
            <button
              type="button"
              onClick={() => {
                if (filteredReferees.length === 0) return;
                setConfirmAction({
                  title: 'Toplu Giriş Yetkisi Tanımla',
                  message: `Filtrelenen ${filteredReferees.length} hakeme sisteme giriş yetkisi vermek istediğinize emin misiniz?`,
                  details: [
                    bulkFixedPassword.trim()
                      ? `Ortak şifre uygulanacak: ${bulkFixedPassword.trim()}`
                      : 'Mevcut şifreler korunacak, şifresi olmayanlara otomatik şifre üretilecek.'
                  ],
                  confirmLabel: 'Evet, Yetki Ver',
                  variant: 'primary',
                  onConfirm: () => {
                    onBulkSetAccessForFiltered(
                      filteredReferees.map(r => r.hakem),
                      true,
                      bulkFixedPassword.trim() || undefined
                    );
                    showToast(`${filteredReferees.length} hakeme giriş yetkisi verildi ve şifreleri tanımlandı.`);
                  }
                });
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tümüne Tik Koy & Yetki Ver</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (filteredReferees.length === 0) return;
                setConfirmAction({
                  title: 'Toplu Giriş Yetkilerini Kaldır',
                  message: `Filtrelenen ${filteredReferees.length} hakemin sisteme giriş yetkisini kaldırmak istediğinize emin misiniz?`,
                  details: [
                    'Yetkisi kaldırılan hakemler giriş ekranından kendi portallarına erişemez.'
                  ],
                  confirmLabel: 'Evet, Yetkileri Kaldır',
                  variant: 'danger',
                  onConfirm: () => {
                    onBulkSetAccessForFiltered(filteredReferees.map(r => r.hakem), false);
                    showToast(`${filteredReferees.length} hakemin giriş yetkisi kaldırıldı.`);
                  }
                });
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Yetkileri Kaldır</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswords(s => !s)}
              className="px-2.5 py-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md font-semibold flex items-center gap-1 cursor-pointer"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Şifreleri Gizle' : 'Şifreleri Göster'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCredentialsExcel}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Yetkili Şifre Listesi (Excel)</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIST / TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-24">Giriş Yetkisi</th>
                  <th className="py-3 px-4">Hakem & Şehir</th>
                  <th className="py-3 px-4">Kokart (Ref / Kule)</th>
                  <th className="py-3 px-4 w-64">Yönetici Şifresi</th>
                  <th className="py-3 px-4">Müsaitlik Aralıkları</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReferees.map(r => {
                  const access = getRefereeAccessRecord(refereeAccessMap, r.hakem);
                  const canLogin = Boolean(access?.canLogin);
                  const password = access?.password || '';
                  const ranges: AvailabilityRange[] = access?.availability || [];

                  return (
                    <tr
                      key={r.hakem}
                      className={`transition-colors ${
                        canLogin
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox (Tik) */}
                      <td className="py-3 px-4 text-center">
                        <label className="inline-flex items-center justify-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={canLogin}
                            onChange={(e) => {
                              const nextChecked = e.target.checked;
                              if (nextChecked) {
                                onToggleLoginAccess(r.hakem, true);
                              } else {
                                setConfirmAction({
                                  title: 'Hakem Giriş Yetkisini Kaldır',
                                  message: `${r.hakem} adlı hakemin sisteme giriş yetkisini kaldırmak istediğinize emin misiniz?`,
                                  details: [
                                    'Yetki kaldırıldığında hakem kendi müsaitlik ekranına giriş yapamaz.',
                                    'Daha önce kaydedilmiş müsaitlik aralıkları silinmez.'
                                  ],
                                  confirmLabel: 'Evet, Yetkiyi Kaldır',
                                  variant: 'danger',
                                  onConfirm: () => onToggleLoginAccess(r.hakem, false)
                                });
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-pointer accent-emerald-600"
                            title="Bu hakemin sisteme giriş yapmasına izin ver"
                          />
                          <span className={`text-[10px] font-bold ${canLogin ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {canLogin ? 'Yetkili' : 'Kapalı'}
                          </span>
                        </label>
                      </td>

                      {/* Referee Name, City & Contact */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{r.hakem}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{r.hakem_sehir || 'TÜRKİYE'}</span>
                          <span>·</span>
                          <span className="font-mono">{r.toplam_atama} Görev</span>
                        </div>
                        {(r.telefon || r.email) && (
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            {r.telefon && (
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {r.telefon}
                              </span>
                            )}
                            {r.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {r.email}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Badges */}
                      <td className="py-3 px-4 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                          {r.referee_badge || '-'} / {r.chair_badge || '-'}
                        </span>
                      </td>

                      {/* Admin Password Control */}
                      <td className="py-3 px-4">
                        {canLogin ? (
                          <div className="flex items-center gap-1">
                            <div className="relative flex-1">
                              <KeyRound className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                              <input
                                type={showPasswords ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => onUpdateRefereePassword(r.hakem, e.target.value)}
                                placeholder="Şifre belirle..."
                                className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-xs font-bold text-slate-900 dark:text-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  title: 'Hakem Şifresini Yenile',
                                  message: `${r.hakem} adlı hakemin mevcut giriş şifresini yeni bir rastgele şifre ile değiştirmek istediğinize emin misiniz?`,
                                  details: ['Eski şifre geçersiz kalacak ve hakeme yeni şifrenin iletilmesi gerekecektir.'],
                                  confirmLabel: 'Evet, Şifreyi Yenile',
                                  variant: 'warning',
                                  onConfirm: () => {
                                    const nextPass = generateRefereePassword();
                                    onUpdateRefereePassword(r.hakem, nextPass);
                                    showToast(`${r.hakem} için yeni şifre üretildi: ${nextPass}`);
                                  }
                                })
                              }
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Yeni Rastgele Şifre Üret"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(r.hakem, password)}
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Giriş Bilgilerini Kopyala"
                            >
                              {copiedKey === r.hakem ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {(() => {
                              const waPhone = formatWhatsAppPhone(r.telefon);
                              const msg = buildCredentialShareText(r.hakem, password);
                              return waPhone ? (
                                <a
                                  href={`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                                  title={`WhatsApp ile Şifre Gönder (${r.telefon})`}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSendModal(r)}
                                  className="p-1.5 rounded bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-700 cursor-pointer"
                                  title="WhatsApp numarası ekleyerek şifre gönder"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              );
                            })()}
                            {r.email && r.email.includes('@') ? (
                              <a
                                href={`mailto:${encodeURIComponent(r.email.trim())}?subject=${encodeURIComponent('TTF Uluslararası Atamalar - Portal Giriş Şifreniz')}&body=${encodeURIComponent(buildCredentialShareText(r.hakem, password))}`}
                                className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 cursor-pointer"
                                title={`E-posta ile Şifre Gönder (${r.email})`}
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenSendModal(r)}
                                className="p-1.5 rounded bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 text-slate-400 hover:text-blue-700 cursor-pointer"
                                title="E-posta ekleyerek şifre gönder"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenSendModal(r)}
                              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white cursor-pointer"
                              title="Mesajı Önizle ve Şifre Gönder"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Şifre için soldaki tiki işaretleyin
                          </span>
                        )}
                      </td>

                      {/* Availability Ranges */}
                      <td className="py-3 px-4">
                        {ranges.length > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              <Calendar className="w-3 h-3" />
                              {ranges.length} Müsait Aralık:
                            </span>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {ranges.slice(0, 3).map(av => (
                                <span
                                  key={av.id}
                                  className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-mono"
                                >
                                  {av.startDate.slice(5)}..{av.endDate.slice(5)}
                                </span>
                              ))}
                              {ranges.length > 3 && (
                                <span className="text-[10px] text-slate-500">+{ranges.length - 3}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {canLogin ? 'Henüz aralık girilmedi' : '-'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(r)}
                            className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            title="Hakem kokart, şehir ve iletişim bilgilerini düzenle"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Bilgilerini Düzenle</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectAvailability(r.hakem)}
                            className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold text-[11px] cursor-pointer"
                          >
                            Müsaitlik Takvimi
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewAssignmentsOfReferee(r.hakem)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer"
                          >
                            Görevler
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReferees.map(r => {
            const access = getRefereeAccessRecord(refereeAccessMap, r.hakem);
            const canLogin = Boolean(access?.canLogin);
            const password = access?.password || '';
            const ranges = access?.availability || [];
            const supervisorDutyCount =
              (r.gorev_dagilimi['SUPERVISOR'] || 0) + (r.gorev_dagilimi['REF'] || 0);

            return (
              <div
                key={r.hakem}
                className={`bg-white dark:bg-slate-900 rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  canLogin
                    ? 'border-emerald-400 ring-1 ring-emerald-400/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm shrink-0">
                        {r.hakem.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          {r.hakem}
                        </h3>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{r.hakem_sehir || 'TÜRKİYE'}</span>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                      <input
                        type="checkbox"
                        checked={canLogin}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onToggleLoginAccess(r.hakem, true);
                          } else {
                            setConfirmAction({
                              title: 'Hakem Giriş Yetkisini Kaldır',
                              message: `${r.hakem} adlı hakemin sisteme giriş yetkisini kaldırmak istediğinize emin misiniz?`,
                              confirmLabel: 'Evet, Yetkiyi Kaldır',
                              variant: 'danger',
                              onConfirm: () => onToggleLoginAccess(r.hakem, false)
                            });
                          }
                        }}
                        className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                      />
                      <span>Giriş</span>
                    </label>
                  </div>

                  {/* Admin Password Box if enabled */}
                  {canLogin && (
                    <div className="mb-3 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        <span>Giriş Şifresi</span>
                        <span>{ranges.length} Müsait Aralık</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => onUpdateRefereePassword(r.hakem, e.target.value)}
                          className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded font-mono text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              title: 'Hakem Şifresini Yenile',
                              message: `${r.hakem} adlı hakemin mevcut şifresini değiştirmek istediğinize emin misiniz?`,
                              confirmLabel: 'Evet, Şifreyi Yenile',
                              variant: 'warning',
                              onConfirm: () => onUpdateRefereePassword(r.hakem, generateRefereePassword())
                            })
                          }
                          className="p-1 bg-white dark:bg-slate-800 border border-slate-200 rounded cursor-pointer"
                          title="Şifre Yenile"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        {(() => {
                          const waPhone = formatWhatsAppPhone(r.telefon);
                          const msg = buildCredentialShareText(r.hakem, password);
                          return waPhone ? (
                            <a
                              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenSendModal(r)}
                              className="flex-1 py-1 px-2 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          );
                        })()}
                        {r.email && r.email.includes('@') ? (
                          <a
                            href={`mailto:${encodeURIComponent(r.email.trim())}?subject=${encodeURIComponent('TTF Uluslararası Atamalar - Portal Giriş Şifreniz')}&body=${encodeURIComponent(buildCredentialShareText(r.hakem, password))}`}
                            className="flex-1 py-1 px-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Mail className="w-3 h-3" />
                            <span>E-posta</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSendModal(r)}
                            className="flex-1 py-1 px-2 rounded bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Mail className="w-3 h-3" />
                            <span>E-posta</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenSendModal(r)}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                          title="Mesajı Önizle / Düzenle"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Badge credentials */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 mb-3 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Ref Kokart:</span>
                      <strong className="text-slate-900 dark:text-white">{r.referee_badge || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kule Kokart:</span>
                      <strong className="text-slate-900 dark:text-white">{r.chair_badge || '-'}</strong>
                    </div>
                  </div>

                  {/* Contact Details (if provided) */}
                  {(r.telefon || r.email) && (
                    <div className="mb-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/40 px-2.5 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      {r.telefon && (
                        <div className="flex items-center gap-1.5 font-mono truncate">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{r.telefon}</span>
                        </div>
                      )}
                      {r.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{r.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Duty Summary */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>2026 Toplam Atama:</span>
                      <strong className="font-mono text-slate-900 dark:text-white tabular-nums">
                        {r.toplam_atama} Görev
                      </strong>
                    </div>
                    {supervisorDutyCount > 0 && (
                      <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 font-semibold">
                        <span>Başhakemlik / Ref:</span>
                        <strong className="font-mono tabular-nums">{supervisorDutyCount} Turnuva</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onViewAssignmentsOfReferee(r.hakem)}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Atamalarını Gör</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(r)}
                      className="text-amber-700 dark:text-amber-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Bilgilerini Düzenle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onInspectAvailability(r.hakem)}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Müsaitlik Takvimi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Single Referee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-xs text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Yeni Hakem Kaydı Oluştur
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRefereeSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hakem Adı Soyadı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: MEHMET CAN"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İkamet Şehri <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: İZMİR veya ÇANAKKALE"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Referee Kokartı
                  </label>
                  <select
                    value={newRefBadge}
                    onChange={(e) => setNewRefBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="WB">WB (White Badge)</option>
                    <option value="SB-R">SB-R (Silver Badge Ref)</option>
                    <option value="BB-R">BB-R (Bronze Badge Ref)</option>
                    <option value="GB">GB (Gold Badge)</option>
                    <option value="N">Ulusal (N)</option>
                    <option value="IL">İl Hakemi (IL)</option>
                    <option value="ADAY">Aday Hakem</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chair Kokartı
                  </label>
                  <select
                    value={newChairBadge}
                    onChange={(e) => setNewChairBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="WB">WB (White Badge)</option>
                    <option value="BB">BB (Bronze Badge)</option>
                    <option value="SB">SB (Silver Badge)</option>
                    <option value="GB">GB (Gold Badge)</option>
                    <option value="N">Ulusal (N)</option>
                    <option value="IL">İl Hakemi (IL)</option>
                    <option value="ADAY">Aday Hakem</option>
                    <option value="-">Rozeti Yok (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon Numarası <span className="text-[10px] font-normal text-slate-400">(İsteğe bağlı)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="05XX XXX XX XX (boş bırakılabilir)"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-posta Adresi <span className="text-[10px] font-normal text-slate-400">(İsteğe bağlı)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="ornek@eposta.com (boş bırakılabilir)"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Login Permission & Password */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCanLogin}
                    onChange={(e) => setNewCanLogin(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                  <span>Sisteme giriş yetkisi ver (Müsaitlik girebilsin)</span>
                </label>

                {newCanLogin && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Hakeme Verilecek Şifre
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hakemi Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Referee Profile Modal */}
      {editingReferee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-xs text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Hakem Bilgilerini Düzenle
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Terfi, rozet değişikliği veya iletişim (telefon / e-posta) bilgilerini güncelleyebilirsiniz.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingReferee(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hakem Adı Soyadı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İkamet Şehri <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Referee Kokartı
                  </label>
                  <select
                    value={editRefBadge}
                    onChange={(e) => setEditRefBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {!['WB', 'SB-R', 'BB-R', 'GB', 'N', 'IL', 'ADAY', '-'].includes(editRefBadge) && editRefBadge && (
                      <option value={editRefBadge}>{editRefBadge}</option>
                    )}
                    <option value="WB">WB (White Badge)</option>
                    <option value="SB-R">SB-R (Silver Badge Ref)</option>
                    <option value="BB-R">BB-R (Bronze Badge Ref)</option>
                    <option value="GB">GB (Gold Badge)</option>
                    <option value="N">Ulusal (N)</option>
                    <option value="IL">İl Hakemi (IL)</option>
                    <option value="ADAY">Aday Hakem</option>
                    <option value="-">Rozeti Yok (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chair / Kule Kokartı
                  </label>
                  <select
                    value={editChairBadge}
                    onChange={(e) => setEditChairBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {!['WB', 'BB', 'SB', 'GB', 'N', 'IL', 'ADAY', '-'].includes(editChairBadge) && editChairBadge && (
                      <option value={editChairBadge}>{editChairBadge}</option>
                    )}
                    <option value="WB">WB (White Badge)</option>
                    <option value="BB">BB (Bronze Badge)</option>
                    <option value="SB">SB (Silver Badge)</option>
                    <option value="GB">GB (Gold Badge)</option>
                    <option value="N">Ulusal (N)</option>
                    <option value="IL">İl Hakemi (IL)</option>
                    <option value="ADAY">Aday Hakem</option>
                    <option value="-">Rozeti Yok (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon Numarası <span className="text-[10px] font-normal text-slate-400">(İsteğe bağlı)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="05XX XXX XX XX (boş bırakılabilir)"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-posta Adresi <span className="text-[10px] font-normal text-slate-400">(İsteğe bağlı)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="ornek@eposta.com (boş bırakılabilir)"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReferee(null)}
                  className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Credentials via WhatsApp / Email Modal */}
      {sendCredsTarget && (() => {
        const waTargetPhone = formatWhatsAppPhone(sendPhoneInput);
        const cleanEmailTarget = sendEmailInput.trim();
        const isEmailValid = cleanEmailTarget.includes('@') && cleanEmailTarget.includes('.');
        const waHref = waTargetPhone
          ? `https://wa.me/${waTargetPhone}?text=${encodeURIComponent(sendMessageText)}`
          : undefined;
        const mailHref = isEmailValid
          ? `mailto:${encodeURIComponent(cleanEmailTarget)}?subject=${encodeURIComponent('TTF Uluslararası Atamalar - Portal Giriş Şifreniz')}&body=${encodeURIComponent(sendMessageText)}`
          : undefined;
        const hasContactEdits =
          sendPhoneInput.trim() !== (sendCredsTarget.telefon || '') ||
          sendEmailInput.trim() !== (sendCredsTarget.email || '');

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-xs text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Şifre ve Giriş Bilgisi Gönder
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {sendCredsTarget.hakem} için WhatsApp veya E-posta gönderimi
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSendCredsTarget(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contact fields (editable inline & savable to card) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Telefon Numarası
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={sendPhoneInput}
                      onChange={(e) => setSendPhoneInput(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={sendEmailInput}
                      onChange={(e) => setSendEmailInput(e.target.value)}
                      placeholder="ornek@eposta.com"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {hasContactEdits && (
                <div className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                    Girilen iletişim bilgisini hakem kartına da kaydetmek ister misiniz?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveInlineContactBeforeSend();
                      showToast(`${sendCredsTarget.hakem} iletişim bilgileri hakem kartına kaydedildi.`);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] cursor-pointer shrink-0 ml-2"
                  >
                    Karta Kaydet
                  </button>
                </div>
              )}

              {/* Message Preview & Editor */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gönderilecek Mesaj İçeriği
                </label>
                <textarea
                  rows={8}
                  value={sendMessageText}
                  onChange={(e) => setSendMessageText(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-sans text-xs leading-relaxed text-slate-900 dark:text-white"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                Butonlara tıkladığınızda cihazınızdaki <strong>WhatsApp Web / Uygulaması</strong> veya varsayılan <strong>E-posta programınız</strong> hakemin bilgisi ve yukarıdaki mesaj metni hazır şekilde açılır.
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(sendMessageText);
                      showToast(`${sendCredsTarget.hakem} için giriş mesajı panoya kopyalandı.`);
                    }
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Mesajı Kopyala</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleSaveInlineContactBeforeSend()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp ile Gönder</span>
                    </a>
                  ) : (
                    <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg font-semibold inline-flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp için telefon girin</span>
                    </span>
                  )}

                  {mailHref ? (
                    <a
                      href={mailHref}
                      onClick={() => handleSaveInlineContactBeforeSend()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Mail className="w-4 h-4" />
                      <span>E-posta ile Gönder</span>
                    </a>
                  ) : (
                    <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg font-semibold inline-flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span>E-posta adresi girin</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Add Referees Modal */}
      {onBulkAddReferees && (
        <BulkAddRefereesModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          existingRefereeNames={refereeProfiles.map(r => r.hakem)}
          onBulkAddReferees={(refs, opts) => {
            onBulkAddReferees(refs, opts);
            showToast(`${refs.length} yeni hakem başarıyla listeye ilave edildi!`);
          }}
        />
      )}

      {/* Confirmation Dialog for Access/Password Changes */}
      <ConfirmDialogModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        details={confirmAction?.details}
        confirmLabel={confirmAction?.confirmLabel || 'Onayla'}
        variant={confirmAction?.variant || 'warning'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          const fn = confirmAction?.onConfirm;
          setConfirmAction(null);
          if (fn) fn();
        }}
      />
    </div>
  );
};
