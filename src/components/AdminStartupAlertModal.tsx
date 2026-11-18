import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Bell,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCheck
} from 'lucide-react';
import { AvailabilityChangeNotification } from '../types';
import {
  formatDateTimeTr,
  formatRangeLabel,
  formatTrDate,
  isPastMonthDate,
  LiveAvailabilityTournamentConflict
} from '../utils/availability';
import { ConfirmDialogModal } from './ConfirmDialogModal';

interface AdminStartupAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AvailabilityChangeNotification[];
  liveConflicts: LiveAvailabilityTournamentConflict[];
  onMarkAllRead: () => void;
  onInspectRefereeCalendar: (refName: string) => void;
  onGoToMatrix: () => void;
}

export const AdminStartupAlertModal: React.FC<AdminStartupAlertModalProps> = ({
  isOpen,
  onClose,
  notifications,
  liveConflicts,
  onMarkAllRead,
  onInspectRefereeCalendar,
  onGoToMatrix
}) => {
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const displayNotifications = unreadNotifications.length > 0 ? unreadNotifications : notifications.slice(0, 10);
  const totalConflictTournaments = liveConflicts.reduce((sum, c) => sum + c.tournaments.length, 0);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-[95vw] max-w-5xl max-h-[88vh] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prominent Header with X Close Button */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                totalConflictTournaments > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {totalConflictTournaments > 0 ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Yönetici Açılış Bildirimleri & Müsaitlik Çakışma Uyarıları
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {totalConflictTournaments > 0
                  ? `${liveConflicts.length} hakemin toplam ${totalConflictTournaments} aktif/gelecek turnuvası için müsaitlik çakışması tespit edildi.`
                  : 'Hakemlerin müsaitlik tarihlerinde yaptığı güncel değişiklikler aşağıda listelenmektedir.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="Bildirim penceresini kapat ve yönetici sayfasına devam et"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* SECTION 1: CRITICAL TOURNAMENT CONFLICTS DUE TO UNAVAILABILITY */}
          {liveConflicts.length > 0 && (
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-200 dark:border-rose-900/70">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-extrabold">
                    Atanmış Olduğu Turnuva İçin Artık Müsait Olmayan Hakemler ({totalConflictTournaments} Turnuva Çakışması)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToMatrix();
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <span>Haftalık Matriste Düzenle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {liveConflicts.map(conflict => (
                  <div
                    key={conflict.refereeName}
                    className="p-4 sm:p-5 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-300 dark:border-rose-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm sm:text-base font-extrabold text-rose-950 dark:text-rose-100">
                          {conflict.refereeName}
                        </div>
                        <div className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                          Güncel Müsaitlik Aralıkları:{' '}
                          <span className="font-mono font-semibold">
                            {conflict.ranges.map(formatRangeLabel).join(' · ')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onInspectRefereeCalendar(conflict.refereeName);
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold rounded-lg cursor-pointer self-start sm:self-center"
                      >
                        Hakem Takvimini Aç
                      </button>
                    </div>

                    <div className="divide-y divide-rose-200/80 dark:divide-rose-800/70 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-800/80">
                      {conflict.tournaments.map(t => (
                        <div
                          key={`${conflict.refereeName}_${t.assignmentId}`}
                          className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-rose-700 dark:text-rose-300">
                              Artık {conflict.refereeName}, atanmış olduğu {t.tesis} ({t.kategori}) turnuvası için müsait değildir.
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {formatTrDate(t.tarih)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{t.sehir}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold">Görev: {t.gorev}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: REFEREE AVAILABILITY CHANGE LOG */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-extrabold">
                  Hakem Müsaitlik Tarih Değişikliği Bildirimleri ({displayNotifications.length})
                </h3>
              </div>

              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bildirimleri Okundu İşaretle</span>
                </button>
              )}
            </div>

            {displayNotifications.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Henüz okunmamış müsaitlik tarih değişikliği bildirimi bulunmuyor.
              </div>
            ) : (
              <div className="space-y-3">
                {displayNotifications.map(notif => {
                  const activeConflictingTournaments = notif.conflictingTournaments.filter(
                    ct => !isPastMonthDate(ct.tarih)
                  );
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-xl border space-y-3 ${
                        activeConflictingTournaments.length > 0
                          ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {notif.refereeName}
                          </span>
                          {!notif.isRead && (
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              · Yeni Değişiklik
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDateTimeTr(notif.changedAt)}</span>
                        </div>
                      </div>

                      {/* Change Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <div className="font-bold text-slate-700 dark:text-slate-300">
                            Yapılan Tarih Değişiklikleri
                          </div>
                          {notif.addedRanges.length > 0 && (
                            <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              + Eklenen: {notif.addedRanges.map(formatRangeLabel).join(' · ')}
                            </div>
                          )}
                          {notif.removedRanges.length > 0 && (
                            <div className="text-rose-700 dark:text-rose-400 font-semibold">
                              − Kaldırılan: {notif.removedRanges.map(formatRangeLabel).join(' · ')}
                            </div>
                          )}
                          {notif.addedRanges.length === 0 && notif.removedRanges.length === 0 && (
                            <div className="text-slate-500">
                              Müsaitlik kayıtları güncellendi.
                            </div>
                          )}
                        </div>

                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <div className="font-bold text-slate-700 dark:text-slate-300">
                            Onaylı Güncel Müsaitlik Tarihleri ({notif.newRanges.length})
                          </div>
                          {notif.newRanges.length > 0 ? (
                            <div className="font-mono text-slate-800 dark:text-slate-200">
                              {notif.newRanges.map(formatRangeLabel).join(' · ')}
                            </div>
                          ) : (
                            <div className="text-rose-600 dark:text-rose-400 font-semibold">
                              Tüm müsaitlik aralıkları kaldırıldı (Müsaitlik bildirilmedi).
                            </div>
                          )}
                        </div>
                      </div>

                      {activeConflictingTournaments.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 font-semibold">
                          Etkilenen Turnuvalar:{' '}
                          {activeConflictingTournaments
                            .map(ct => `${ct.tesis} (${ct.kategori} · ${formatTrDate(ct.tarih)})`)
                            .join(' | ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sağ üstteki çarpı (✕) veya devam butonu ile normal yönetici paneline geçebilirsiniz.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm whitespace-nowrap shrink-0"
          >
            Kapat ve Yönetici Sayfasına Devam Et
          </button>
        </div>
      </div>

      <ConfirmDialogModal
        isOpen={confirmClearOpen}
        title="Bildirimleri Okundu Olarak İşaretle"
        message="Okunmamış hakem müsaitlik değişikliği bildirimlerini okundu olarak işaretlemek istediğinize emin misiniz?"
        details={[
          'Müsaitlik değişikliği logları okundu olarak işaretlenecektir.',
          'Devam eden turnuva çakışma uyarıları atamalar düzeltilene kadar yönetici panelinde görünmeye devam eder.'
        ]}
        confirmLabel="Evet, Okundu İşaretle"
        variant="warning"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          setConfirmClearOpen(false);
          onMarkAllRead();
        }}
      />
    </div>
  );
};
