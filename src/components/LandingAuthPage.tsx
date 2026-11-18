import React, { useState, useMemo } from 'react';
import {
  Trophy,
  ShieldCheck,
  UserCheck,
  KeyRound,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Moon,
  Sun,
  ArrowRight,
  User
} from 'lucide-react';
import { RefereeAccessMap, UserSession } from '../types';
import { findRefereeAccessEntry } from '../utils/availability';

interface LandingAuthPageProps {
  refereeAccessMap: RefereeAccessMap;
  onLoginSuccess: (session: UserSession) => void;
  isDark: boolean;
  toggleDark: () => void;
}

const ADMIN_PASSCODE = '1907';

export const LandingAuthPage: React.FC<LandingAuthPageProps> = ({
  refereeAccessMap,
  onLoginSuccess,
  isDark,
  toggleDark
}) => {
  const [selectedPortal, setSelectedPortal] = useState<'ADMIN' | 'REFEREE' | null>(null);

  // Admin form state
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPass, setShowAdminPass] = useState<boolean>(false);

  // Referee form state
  const [refereeNameInput, setRefereeNameInput] = useState<string>('');
  const [refereePassword, setRefereePassword] = useState<string>('');
  const [showRefPass, setShowRefPass] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const authorizedReferees = useMemo(() => {
    return Object.values(refereeAccessMap)
      .filter(r => r.canLogin && r.hakem && r.hakem.trim().length > 0)
      .sort((a, b) => a.hakem.localeCompare(b.hakem, 'tr-TR'));
  }, [refereeAccessMap]);

  const handleSelectPortal = (portal: 'ADMIN' | 'REFEREE') => {
    setSelectedPortal(portal);
    setErrorMsg(null);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (adminPassword.trim() !== ADMIN_PASSCODE) {
      setErrorMsg('Yönetici şifresi hatalıdır. Lütfen şifrenizi kontrol edip tekrar deneyiniz.');
      return;
    }

    setAdminPassword('');
    onLoginSuccess({ role: 'ADMIN' });
  };

  const handleRefereeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = refereeNameInput.trim();
    if (!trimmedName) {
      setErrorMsg('Lütfen listeden adınızı seçiniz.');
      return;
    }

    const found = findRefereeAccessEntry(refereeAccessMap, trimmedName);
    if (!found || !found.record.canLogin) {
      setErrorMsg(
        'Bu isim için aktif hakem giriş yetkisi bulunmamaktadır. Lütfen TTF Uluslararası Atamalar yöneticisi ile iletişime geçiniz.'
      );
      return;
    }

    if (!found.record.password || refereePassword !== found.record.password) {
      setErrorMsg('Girilen hakem şifresi hatalıdır. Lütfen yöneticinizden aldığınız şifreyi kontrol ediniz.');
      return;
    }

    setRefereePassword('');
    onLoginSuccess({ role: 'REFEREE', refereeName: found.key });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Minimal Gatekeeper Top Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                TTF Uluslararası Atamalar
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Türkiye Tenis Federasyonu · Merkez Hakem Kurulu
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleDark}
            aria-label="Karanlık/Aydınlık Tema Değiştir"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Centered Gatekeeper Selection & Login Area */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Heading Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="text-xs font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
            Yetkili Portal Girişi · 2026 Sezonu
          </div>
          <h1
            className="font-extrabold tracking-tight text-slate-900 dark:text-white text-balance"
            style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.75rem)', lineHeight: 1.15 }}
          >
            TTF Uluslararası Hakem Atama ve Müsaitlik Sistemi
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Turnuva programları, haftalık atama matrisi ve hakem müsaitlik takvimine erişmek için lütfen aşağıdaki giriş seçeneklerinden size uygun olanı seçiniz.
          </p>
        </div>

        {/* Two Large Prominent Role Selection Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Yönetici Girişi Button */}
          <button
            type="button"
            onClick={() => handleSelectPortal('ADMIN')}
            className={`group text-left p-8 sm:p-10 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[230px] shadow-sm ${
              selectedPortal === 'ADMIN'
                ? 'bg-slate-900 text-white border-slate-900 dark:border-emerald-500 ring-4 ring-slate-900/15 dark:ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  selectedPortal === 'ADMIN'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-900 dark:bg-slate-800 text-white group-hover:bg-emerald-600'
                }`}
              >
                <ShieldCheck className="w-7 h-7" />
              </div>

              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  selectedPortal === 'ADMIN'
                    ? 'text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                Yönetim Paneli
              </span>
            </div>

            <div className="mt-8 space-y-2">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center justify-between">
                <span>Yönetici Girişi</span>
                <ArrowRight
                  className={`w-6 h-6 transition-transform group-hover:translate-x-1 ${
                    selectedPortal === 'ADMIN' ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
              </div>
              <p
                className={`text-sm leading-relaxed ${
                  selectedPortal === 'ADMIN'
                    ? 'text-slate-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                TTF Uluslararası Atamalar kurulu için turnuva yönetimi, haftalık matris, hakem yetkileri ve çakışma takibi.
              </p>
            </div>
          </button>

          {/* Hakem Girişi Button */}
          <button
            type="button"
            onClick={() => handleSelectPortal('REFEREE')}
            className={`group text-left p-8 sm:p-10 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[230px] shadow-sm ${
              selectedPortal === 'REFEREE'
                ? 'bg-emerald-700 text-white border-emerald-700 ring-4 ring-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  selectedPortal === 'REFEREE'
                    ? 'bg-white text-emerald-700'
                    : 'bg-emerald-600 text-white group-hover:bg-emerald-700'
                }`}
              >
                <UserCheck className="w-7 h-7" />
              </div>

              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  selectedPortal === 'REFEREE'
                    ? 'text-emerald-100'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                Bireysel Hakem Alanı
              </span>
            </div>

            <div className="mt-8 space-y-2">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center justify-between">
                <span>Hakem Girişi</span>
                <ArrowRight
                  className={`w-6 h-6 transition-transform group-hover:translate-x-1 ${
                    selectedPortal === 'REFEREE' ? 'text-white' : 'text-slate-400'
                  }`}
                />
              </div>
              <p
                className={`text-sm leading-relaxed ${
                  selectedPortal === 'REFEREE'
                    ? 'text-emerald-50'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Giriş yetkisi verilen hakemler için müsaitlik tarih aralıklarını bildirme ve kişisel 2026 görevlendirme takvimi.
              </p>
            </div>
          </button>
        </div>

        {/* Credential Form Panel (Shown only after user picks Yönetici Girişi or Hakem Girişi) */}
        {selectedPortal && (
          <div className="mt-8 max-w-xl w-full mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 sm:p-8">
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {selectedPortal === 'ADMIN' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Yönetici Girişi Doğrulaması
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      TTF Uluslararası Atamalar yönetici paneline erişmek için yönetici şifresini giriniz.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Yönetici Şifresi
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Yönetici şifresini giriniz..."
                      autoFocus
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1"
                      aria-label="Şifreyi Göster/Gizle"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Yönetici Sayfasına Giriş Yap</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRefereeSubmit} className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Hakem Girişi
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Alfabetik listeden adınızı seçiniz ve sistem yöneticisi tarafından size tanımlanan şifreyi giriniz.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hakem Adı Soyadı
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={refereeNameInput}
                      onChange={(e) => {
                        setRefereeNameInput(e.target.value);
                        setErrorMsg(null);
                      }}
                      disabled={authorizedReferees.length === 0}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60 cursor-pointer"
                      required
                    >
                      <option value="">
                        {authorizedReferees.length > 0
                          ? '-- Listeden Adınızı Seçiniz --'
                          : 'Henüz giriş yetkili hakem tanımlanmamış'}
                      </option>
                      {authorizedReferees.map(ref => (
                        <option key={ref.hakem} value={ref.hakem}>
                          {ref.hakem}
                        </option>
                      ))}
                    </select>
                  </div>
                  {authorizedReferees.length === 0 && (
                    <p className="mt-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Yönetici panelindeki "Hakemler & Yetkiler" bölümünden hakemlere giriş yetkisi (tik) tanımlandığında isimler burada alfabetik olarak listelenecektir.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Yönetici Tarafından Verilen Şifre
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRefPass ? 'text' : 'password'}
                      value={refereePassword}
                      onChange={(e) => setRefereePassword(e.target.value)}
                      placeholder="Hakem şifrenizi giriniz..."
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRefPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1"
                      aria-label="Şifreyi Göster/Gizle"
                    >
                      {showRefPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Hakem Sayfasına Giriş Yap</span>
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Clean Minimal Footer without revealing any counts or tournament data */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-5 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            TTF Uluslararası Atamalar · Türkiye Tenis Federasyonu (MHK)
          </span>
          <span>Yetkili Giriş Kapısı</span>
        </div>
      </footer>
    </div>
  );
};
