import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  FileCode, 
  Terminal 
} from 'lucide-react';
import { cleanTtfFile, downloadCleanedExcel, downloadCleanedJson } from '../data/cleaner';
import { Atama, MetadataInfo } from '../types';
import { ConfirmDialogModal } from './ConfirmDialogModal';

interface DataCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCleanedData: (records: Atama[], metadata: MetadataInfo) => void;
  onResetDefaultData: () => void;
  currentCount: number;
}

export const DataCleanerModal: React.FC<DataCleanerModalProps> = ({
  isOpen,
  onClose,
  onApplyCleanedData,
  onResetDefaultData,
  currentCount
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [cleanedRecords, setCleanedRecords] = useState<Atama[] | null>(null);
  const [cleanedMeta, setCleanedMeta] = useState<MetadataInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [confirmApplyOpen, setConfirmApplyOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setLogs([]);

    try {
      setLogs(prev => [...prev, `Dosya seçildi: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`]);
      const result = await cleanTtfFile(file);
      setCleanedRecords(result.records);
      setCleanedMeta(result.metadata);
      setLogs(result.log);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Excel dosyası işlenirken bir hata oluştu.');
      setLogs(prev => [...prev, `HATA: ${err.message || 'Bilinmeyen hata'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (cleanedRecords && cleanedMeta) {
      onApplyCleanedData(cleanedRecords, cleanedMeta);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                TTF Excel Veri Temizleme & Dönüştürme Motoru
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Python <code className="font-mono text-emerald-600 dark:text-emerald-400">clean_ttf_assignments()</code> temizleme algoritması
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* File Dropzone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-800/40">
            <input
              type="file"
              id="excel-upload"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="excel-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                YENİ OCAK-KASIM 2026 ULUSLARARASI HAKEM ATAMALARI_SON.xlsx
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                veya herhangi bir TTF Atama Excel dosyasını seçmek için buraya tıklayın
              </p>
            </label>
          </div>

          {/* Applied Rules Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Otomatik Uygulanan Temizleme ve Eşleştirme Kuralları:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
              <li><strong>TÜM HAKEMLER</strong> sayfasından Şehir, Referee Kokartı ve Chair Kokartı eşleştirilir</li>
              <li>Tarih kaymaları ("28 Şubat - 09 Mart ", "23 -26 TEMMUZ", "7 -14 Mart") standart ISO'ya çevrilir</li>
              <li><strong>13.07.2026 ENKA WTA 125</strong>: Soner Sivri görevi 'HAKEM ŞEFİ' olarak düzeltilir</li>
              <li><strong>13.07.2026 İzmir Kültürpark</strong>: Kategori 'ITF J30' olarak standardize edilir</li>
              <li><strong>02.11.2026 MT200 Hale Bozkurt</strong>: Tesis=0 kayması 'ROBINSON ÇAMYUVA' olarak atanır</li>
              <li><strong>05.10.2026 Samsun MT400</strong>: Tesis=0 kayması 'SAMSUN TENİS KULÜBÜ' olarak düzeltilir</li>
              <li><strong>23.11.2026 Ankara ATAK PRO ATP Challenger</strong>: 7 kişilik resmi heyet eksiksiz eklenir</li>
            </ul>
          </div>

          {/* Terminal Logs */}
          {logs.length > 0 && (
            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
              <div className="text-emerald-400 font-bold mb-2">// İŞLEM GÜNLÜĞÜ:</div>
              {logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cleaned Results Action */}
          {cleanedRecords && cleanedMeta && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Temizleme Başarılı: {cleanedRecords.length} Kayıt Üretildi</span>
                </div>
                <div className="font-mono text-emerald-700 dark:text-emerald-400">
                  {cleanedMeta.tekil_hakem_sayisi} Hakem · {cleanedMeta.toplam_turnuva_sayisi} Turnuva
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => downloadCleanedExcel(cleanedRecords)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>TTF_2026_Hakem_Atamalari_TEMIZ.xlsx İndir</span>
                </button>

                <button
                  onClick={() => downloadCleanedJson(cleanedRecords)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-md flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>ttf_2026_atamalar_temiz.json İndir</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>PDF (Ocak–Aralık 2026) Verilerine Sıfırla</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Kapat
            </button>

            {cleanedRecords && (
              <button
                type="button"
                onClick={() => setConfirmApplyOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Portala Aktar ({cleanedRecords.length} Atama)</span>
              </button>
            )}
          </div>
        </div>

      </div>

      <ConfirmDialogModal
        isOpen={confirmResetOpen}
        title="Tüm Verileri Başlangıç PDF Verilerine Sıfırla"
        message={`Mevcut ${currentCount} atama kaydı, sonradan eklenen turnuvalar ve özel düzenlemeler silinerek Ocak–Aralık 2026 PDF verilerine sıfırlanacaktır. Emin misiniz?`}
        details={[
          'Sonradan oluşturulan turnuva düzenlemeleri kaybolacaktır.',
          'Giriş yetkisi verilen hakemlerin yetkileri ve müsaitlikleri korunacaktır.'
        ]}
        confirmLabel="Evet, PDF Verilerine Sıfırla"
        variant="danger"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          setConfirmResetOpen(false);
          onResetDefaultData();
          onClose();
        }}
      />

      <ConfirmDialogModal
        isOpen={confirmApplyOpen}
        title="Excel Verilerini Portala Aktar"
        message={`Mevcut ${currentCount} atama kaydı yerine Excel'den okunan ${cleanedRecords?.length || 0} yeni atama yüklenecektir. Devam etmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Portala Aktar"
        variant="warning"
        onCancel={() => setConfirmApplyOpen(false)}
        onConfirm={() => {
          setConfirmApplyOpen(false);
          handleApply();
        }}
      />
    </div>
  );
};
