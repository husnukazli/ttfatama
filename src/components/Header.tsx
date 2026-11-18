import React from 'react';
import {
  Trophy,
  FileSpreadsheet,
  Moon,
  Sun,
  LogOut,
  UserCheck,
  Bell
} from 'lucide-react';
import { UserSession } from '../types';

export type ActiveTabType =
  | 'overview'
  | 'matrix'
  | 'assignments'
  | 'myDuties'
  | 'calendar'
  | 'referees'
  | 'analytics';

interface HeaderProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  session: UserSession;
  onLogout: () => void;
  totalAssignments: number;
  enabledRefereeCount: number;
  alertCount: number;
  onOpenAlerts: () => void;
  onOpenCleaner: () => void;
  onOpenCreateTournament: () => void;
  isDark: boolean;
  toggleDark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  session,
  onLogout,
  totalAssignments,
  enabledRefereeCount,
  alertCount,
  onOpenAlerts,
  onOpenCleaner,
  onOpenCreateTournament,
  isDark,
  toggleDark
}) => {
  const isAdmin = session.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 gap-2 sm:gap-3">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 min-w-0 shrink">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <a
              href="#overview"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(isAdmin ? 'overview' : 'myDuties');
              }}
              className="flex flex-col min-w-0 hover:opacity-90 transition-opacity"
            >
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate leading-tight">
                TTF Uluslararası Atamalar
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase leading-none truncate">
                {isAdmin ? 'Sistem Yöneticisi · 2026' : `Hakem: ${session.refereeName}`}
              </span>
            </a>
          </div>

          {/* Zone 2: Navigation Links (Scroll-contained so Zone 3 never overflows off-screen) */}
          {isAdmin ? (
            <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-xs xl:text-sm font-medium text-slate-600 dark:text-slate-300 min-w-0 flex-1 justify-center overflow-x-auto no-scrollbar px-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : ''
                }`}
              >
                Genel Bakış
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'matrix'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : ''
                }`}
              >
                <span>Haftalık Matris</span>
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                  activeTab === 'assignments'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : ''
                }`}
              >
                Atamalar ({totalAssignments})
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : ''
                }`}
              >
                Takvim
              </button>
              <button
                onClick={() => setActiveTab('referees')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'referees'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : ''
                }`}
              >
                <span>Hakemler & Yetkiler</span>
                <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold tabular-nums">
                  {enabledRefereeCount}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : ''
                }`}
              >
                Analiz
              </button>
            </nav>
          ) : (
            <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300 min-w-0 flex-1 justify-center">
              <button
                onClick={() => setActiveTab('myDuties')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400 pb-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                Müsaitlik Takvimim & Görevlerim
              </button>
            </nav>
          )}

          {/* Zone 3: Session & Actions (Always pinned and visible inside viewport) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Admin Availability & Conflict Alerts Trigger */}
            {isAdmin && alertCount > 0 && (
              <button
                type="button"
                onClick={onOpenAlerts}
                className="px-2.5 py-1.5 text-xs font-bold text-rose-800 dark:text-rose-200 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                title="Müsaitlik değişikliği bildirimlerini ve turnuva çakışmalarını görüntüle"
              >
                <Bell className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">Uyarılar</span>
                <span className="font-mono">({alertCount})</span>
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              aria-label="Karanlık/Aydınlık Tema Değiştir"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAdmin ? (
              <>
                <button
                  onClick={onOpenCreateTournament}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer border border-slate-700/50"
                  title="Yeni Turnuva & Hakem Atama Oluştur"
                >
                  <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden 2xl:inline">+ Yeni Turnuva & Atama</span>
                  <span className="hidden sm:inline 2xl:hidden">+ Yeni Turnuva</span>
                  <span className="sm:hidden">+ Turnuva</span>
                </button>

                <button
                  onClick={onOpenCleaner}
                  className="hidden xl:flex px-2.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/60 rounded-lg transition-colors whitespace-nowrap shrink-0 items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  title="Excel Dosyası Yükle"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Excel</span>
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 whitespace-nowrap shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="max-w-[140px] truncate">{session.refereeName}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-rose-700 dark:text-rose-200 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/70 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
              title="Oturumu kapat ve giriş sayfasına dön"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Çıkış Yap</span>
            </button>
          </div>

        </div>

        {/* Mobile / Tablet Navigation Bar */}
        {isAdmin && (
          <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-100 dark:border-slate-800 text-xs no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Genel Bakış
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Haftalık Matris
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tüm Atamalar ({totalAssignments})
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Takvim
            </button>
            <button
              onClick={() => setActiveTab('referees')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium cursor-pointer ${
                activeTab === 'referees'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Hakem Listesi & Yetkiler ({enabledRefereeCount})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Analiz
            </button>
            <button
              onClick={onOpenCleaner}
              className="px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 cursor-pointer"
            >
              Excel Yükle
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
