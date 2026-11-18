import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Award, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Share2, 
  Building2, 
  Car, 
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Atama } from '../types';
import { downloadIcsCalendar, downloadCleanedExcel } from '../data/cleaner';

interface PersonalPortalProps {
  currentReferee: string;
  assignments: Atama[];
  onOpenDoc: (assignment: Atama) => void;
  onSelectReferee: (refName: string) => void;
  allReferees: string[];
}

export const PersonalPortal: React.FC<PersonalPortalProps> = ({
  currentReferee,
  assignments,
  onOpenDoc,
  onSelectReferee,
  allReferees
}) => {
  // Filter current referee's assignments
  const myAssignments = assignments.filter(
    a => a.hakem.toUpperCase() === currentReferee.toUpperCase()
  );

  const [confirmations, setConfirmations] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    myAssignments.forEach(a => {
      initial[a.id] = true; // All confirmed by default
    });
    return initial;
  });

  const toggleConfirm = (id: number) => {
    setConfirmations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Find referee profile details from assignments
  const firstMatch = myAssignments[0];
  const refKokart = firstMatch?.kokart_ref || 'N';
  const chairKokart = firstMatch?.kokart_chair || 'N';
  const homeCity = firstMatch?.hakem_sehir || 'TÜRKİYE';
  const uniqueCitiesCount = new Set(myAssignments.map(a => a.sehir).filter(Boolean)).size;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Official Referee Credential Banner */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Official Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm">
              {currentReferee.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>TTF & ITF AKREDİTE TENİS HAKEMİ</span>
                <span aria-hidden="true">·</span>
                <span>{homeCity} BÖLGESİ</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {currentReferee}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="font-mono bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                  Ref Kokart: <strong className="text-slate-900 dark:text-white">{refKokart}</strong>
                </div>
                <div className="font-mono bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                  Kule Kokart: <strong className="text-slate-900 dark:text-white">{chairKokart}</strong>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>İkamet: {homeCity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => downloadIcsCalendar(currentReferee, myAssignments)}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Google Calendar, Outlook veya Apple Calendar için .ics dosyası indir"
            >
              <Calendar className="w-4 h-4" />
              <span>Takvimime Aktar (.ics)</span>
            </button>

            <button
              onClick={() => downloadCleanedExcel(myAssignments, `${currentReferee}_2026_Atamalari.xlsx`)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Excel İndir</span>
            </button>
          </div>

        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/60">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">2026 Sezonu Atama Sayısı</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {myAssignments.length} Turnuva Haftası
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">MHK Görev Durumu</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resmi Onaylandı</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">Görev Yapılan Şehir Sayısı</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {uniqueCitiesCount} Farklı İl
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Timeline List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2026 Görevlendirme Programı
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tarih sırasına göre Merkez Hakem Kurulu tarafından tebliğ edilen turnuvalarınız
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {myAssignments.length} Turnuva
          </div>
        </div>

        {myAssignments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Seçili hakem için kayıtlı atama bulunmamaktadır.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myAssignments.map((assignment, index) => {
              const isConfirmed = confirmations[assignment.id] ?? true;
              const isSupervisor = assignment.gorev === 'SUPERVISOR' || assignment.gorev === 'REF';

              return (
                <div 
                  key={assignment.id}
                  className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Date & Venue */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-bold tracking-tight">
                        {assignment.ay.slice(0, 3)}
                      </span>
                      <span className="text-base font-extrabold font-mono leading-none tabular-nums">
                        {assignment.tarih.split('-')[2] || '01'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                          {assignment.tarih}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {assignment.kategori}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {assignment.tesis}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{assignment.sehir}</span>
                        </span>
                        <span>·</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          Atama No: #{assignment.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Duty Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-left md:text-right">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        Göreviniz
                      </div>
                      <div className={`text-sm font-bold ${
                        isSupervisor ? 'text-purple-700 dark:text-purple-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {assignment.gorev}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Ref: {assignment.kokart_ref || '-'} / Kule: {assignment.kokart_chair || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                    <button
                      onClick={() => toggleConfirm(assignment.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isConfirmed 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                      title="MHK Görev Teyidi"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isConfirmed ? 'Görev Teyit Edildi' : 'Teyit Bekliyor'}</span>
                    </button>

                    <button
                      onClick={() => onOpenDoc(assignment)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Resmi Atama Belgesi Çıkar / Yazdır"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Görev Belgesi</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
