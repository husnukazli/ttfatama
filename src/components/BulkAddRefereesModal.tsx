import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  CheckSquare
} from 'lucide-react';
import { RefereeInfo } from '../types';
import {
  generateRefereePassword,
  parseBulkRefereesExcel,
  parseBulkRefereesText
} from '../utils/availability';

interface BulkAddRefereesModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRefereeNames: string[];
  onBulkAddReferees: (
    referees: RefereeInfo[],
    options: { grantLogin: boolean; passwordMode: 'AUTO' | 'FIXED'; fixedPassword?: string }
  ) => void;
}

export const BulkAddRefereesModal: React.FC<BulkAddRefereesModalProps> = ({
  isOpen,
  onClose,
  existingRefereeNames,
  onBulkAddReferees
}) => {
  const [mode, setMode] = useState<'text' | 'excel'>('text');
  const [rawText, setRawText] = useState<string>(
    ''
  );
  const [excelParsed, setExcelParsed] = useState<RefereeInfo[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Access options
  const [grantLogin, setGrantLogin] = useState<boolean>(true);
  const [passwordMode, setPasswordMode] = useState<'AUTO' | 'FIXED'>('AUTO');
  const [fixedPassword, setFixedPassword] = useState<string>('TTF2026');

  const existingSet = useMemo(
    () => new Set(existingRefereeNames.map(n => n.trim().toUpperCase())),
    [existingRefereeNames]
  );

  const parsedReferees = useMemo(() => {
    if (mode === 'text') {
      return parseBulkRefereesText(rawText);
    }
    return excelParsed;
  }, [mode, rawText, excelParsed]);

  const newOnlyReferees = useMemo(
    () => parsedReferees.filter(r => !existingSet.has(r.hakem.toUpperCase())),
    [parsedReferees, existingSet]
  );

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setExcelFileName(file.name);

    try {
      const parsed = await parseBulkRefereesExcel(file);
      if (parsed.length === 0) {
        setErrorMsg('Dosyada geçerli hakem satırı bulunamadı. İlk sütunun hakem adı soyadı olduğundan emin olun.');
      }
      setExcelParsed(parsed);
    } catch (err) {
      setErrorMsg('Dosya okunurken hata oluştu. Lütfen geçerli bir .xlsx veya .csv dosyası seçin.');
      setExcelParsed([]);
    }
  };

  const handleConfirmImport = () => {
    if (newOnlyReferees.length === 0) {
      setErrorMsg('Eklenecek yeni hakem bulunamadı (listede olmayan en az 1 hakem olmalı).');
      return;
    }

    onBulkAddReferees(newOnlyReferees, {
      grantLogin,
      passwordMode,
      fixedPassword: fixedPassword.trim() || generateRefereePassword()
    });

    setRawText('');
    setExcelParsed([]);
    setExcelFileName('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Toplu Hakem Ekleme & İçe Aktarma
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Excel / CSV dosyası yükleyin veya hakem listesini toplu olarak yapıştırın
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Input Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                mode === 'text'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Liste Yapıştır (Toplu Metin)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('excel')}
              className={`flex-1 py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                mode === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel / CSV Dosyasından Yükle</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'text' ? (
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Her satıra 1 hakem gelecek şekilde yapıştırın:
              </label>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                Format 1: MEHMET CAN<br />
                Format 2: MEHMET CAN, İZMİR, WB, N &nbsp;(Virgül, noktalı virgül veya Excel sekmesi ile)
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={'AHMET DEMİR, İSTANBUL, WB, N\nAYŞE YILMAZ, ANKARA, N, BB\nCANER KAYA, ANTALYA, SB-R, WB'}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {excelFileName ? `Seçilen Dosya: ${excelFileName}` : 'Excel (.xlsx) veya CSV Dosyası Seçin'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Sütunlar: HAKEM (veya Ad Soyad), Şehir, Referee, Chair
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Access & Password Options for Imported Batch */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
            <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={grantLogin}
                onChange={(e) => setGrantLogin(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-pointer"
              />
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Eklenen tüm hakemlere sistem giriş yetkisi (Tik) ver</span>
            </label>

            {grantLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pl-6">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Şifre Atama Yöntemi
                  </label>
                  <select
                    value={passwordMode}
                    onChange={(e) => setPasswordMode(e.target.value as 'AUTO' | 'FIXED')}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="AUTO">Her hakeme özel otomatik şifre üret (TTFxxxx)</option>
                    <option value="FIXED">Hepsine ortak başlangıç şifresi ver</option>
                  </select>
                </div>

                {passwordMode === 'FIXED' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Ortak Başlangıç Şifresi
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fixedPassword}
                        onChange={(e) => setFixedPassword(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Table */}
          {parsedReferees.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Önizleme ({parsedReferees.length} Satır Algılandı)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {newOnlyReferees.length} Yeni Hakem Eklenecek
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Hakem Adı</th>
                      <th className="py-2 px-3">Şehir</th>
                      <th className="py-2 px-3">Ref</th>
                      <th className="py-2 px-3">Kule</th>
                      <th className="py-2 px-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedReferees.map((r, idx) => {
                      const isDup = existingSet.has(r.hakem.toUpperCase());
                      return (
                        <tr key={idx} className={isDup ? 'opacity-50 bg-slate-50 dark:bg-slate-800/30' : ''}>
                          <td className="py-1.5 px-3 font-semibold">{r.hakem}</td>
                          <td className="py-1.5 px-3">{r.hakem_sehir}</td>
                          <td className="py-1.5 px-3 font-mono">{r.referee_badge}</td>
                          <td className="py-1.5 px-3 font-mono">{r.chair_badge}</td>
                          <td className="py-1.5 px-3">
                            {isDup ? (
                              <span className="text-[10px] font-semibold text-amber-600">Zaten Kayıtlı</span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600">Yeni Eklenecek</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={newOnlyReferees.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{newOnlyReferees.length} Hakemi Sisteme Ekle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
