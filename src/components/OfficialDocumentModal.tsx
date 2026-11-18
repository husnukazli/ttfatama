import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Atama } from '../types';

interface OfficialDocumentModalProps {
  assignment: Atama | null;
  onClose: () => void;
}

export const OfficialDocumentModal: React.FC<OfficialDocumentModalProps> = ({
  assignment,
  onClose
}) => {
  if (!assignment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col text-slate-900">
        
        {/* Modal Controls (Not printed) */}
        <div className="print:hidden p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>TTF Resmi Görevlendirme Belgesi Yazdırma Önizleme</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF Olarak Kaydet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Official Document (A4 Printable Layout) */}
        <div className="p-8 sm:p-12 overflow-y-auto space-y-6 text-sm bg-white font-serif leading-relaxed" id="printable-mission-order">
          
          {/* Header */}
          <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900">
            <div className="text-xs font-sans font-bold uppercase tracking-widest text-slate-700">
              T.C. GENÇLİK VE SPOR BAKANLIĞI
            </div>
            <div className="text-lg font-bold font-sans tracking-wide uppercase text-slate-900">
              TÜRKİYE TENİS FEDERASYONU BAŞKANLIĞI
            </div>
            <div className="text-xs font-sans font-semibold uppercase tracking-wider text-slate-700">
              MERKEZ HAKEM KURULU (MHK)
            </div>
          </div>

          {/* Reference numbers & Date */}
          <div className="flex items-start justify-between text-xs font-sans font-medium text-slate-700 pt-2">
            <div>
              <div><strong>Sayı:</strong> TTF-MHK-2026/AT-{String(assignment.id).padStart(4, '0')}</div>
              <div><strong>Konu:</strong> 2026 Sezonu Hakem Görevlendirmesi</div>
            </div>
            <div className="text-right">
              <div><strong>Tarih:</strong> {new Date().toLocaleDateString('tr-TR')}</div>
              <div><strong>Ankara</strong></div>
            </div>
          </div>

          {/* Recipient */}
          <div className="pt-4 font-sans">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Sayın:</div>
            <div className="text-base font-bold text-slate-900 uppercase">
              {assignment.hakem}
            </div>
            <div className="text-xs text-slate-600">
              TTF Lisanslı Tenis Hakemi (Ref: {assignment.kokart_ref || '-'} / Kule: {assignment.kokart_chair || '-'}) · {assignment.hakem_sehir || assignment.sehir}
            </div>
          </div>

          {/* Official Letter Body */}
          <div className="space-y-4 text-justify font-sans text-xs leading-relaxed text-slate-800">
            <p>
              Türkiye Tenis Federasyonu 2026 Yılı Faaliyet Programında yer alan ve aşağıda ayrıntıları belirtilen ulusal / uluslararası tenis müsabakalarında, Merkez Hakem Kurulumuzun kararı ile <strong>{assignment.gorev}</strong> olarak görevlendirilmiş bulunmaktasınız.
            </p>

            {/* Assignment Details Box */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-300 font-sans text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Turnuva / Kategori:</span>
                  <strong className="text-slate-900">{assignment.kategori}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Müsabaka Tarihi:</span>
                  <strong className="text-slate-900 font-mono">{assignment.tarih} ({assignment.ay} 2026)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Ev Sahibi Tesis:</span>
                  <strong className="text-slate-900">{assignment.tesis}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Şehir / İl:</span>
                  <strong className="text-slate-900">{assignment.sehir}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Atanan Görev Unvanı:</span>
                  <strong className="text-slate-900">{assignment.gorev}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Atama Durumu:</span>
                  <strong className="text-emerald-700">RESMİ ONAYLI (MHK)</strong>
                </div>
              </div>
            </div>

            <p>
              Görev mahalline müsabaka başlangıç tarihinden en geç 1 (bir) gün önce intikal etmeniz, ITF ve TTF Müsabaka Talimatları hükümlerine titizlikle riayet etmeniz ve turnuva bitiminde hazırlayacağınız Başhakemlik / Görev Raporunu 48 saat içerisinde Merkez Hakem Kurulumuza iletmeniz gerekmektedir.
            </p>

            <p>
              Görev yapacağınız müsabakada başarılar diler, gereğini rica ederiz.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 flex items-end justify-between font-sans">
            <div className="text-left space-y-1">
              <div className="w-16 h-16 border border-slate-300 rounded flex flex-col items-center justify-center bg-slate-50 text-[9px] text-slate-500 font-mono text-center p-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-0.5" />
                <span>e-İmzalıdır</span>
                <span>TTF-2026</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Doğrulama Kodu: {assignment.id}761-2026-TTF
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="text-xs text-slate-500 uppercase">Merkez Hakem Kurulu Adına</div>
              <div className="text-sm font-bold text-slate-900">Merkez Hakem Kurulu Başkanı</div>
              <div className="text-xs text-slate-600">Türkiye Tenis Federasyonu</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 font-sans">
            Türkiye Tenis Federasyonu · Çankaya / ANKARA · Tel: +90 (312) 309 77 70 · www.ttf.org.tr
          </div>

        </div>

      </div>
    </div>
  );
};
