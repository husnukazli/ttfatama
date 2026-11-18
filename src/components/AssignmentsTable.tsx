import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  CheckCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  MapPin, 
  Award, 
  Calendar, 
  Trophy, 
  User, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Atama, FilterState } from '../types';
import { downloadCleanedExcel, downloadCleanedJson } from '../data/cleaner';

interface AssignmentsTableProps {
  assignments: Atama[];
  currentReferee: string;
  onViewReferee: (refName: string) => void;
  onOpenAssignmentDoc: (assignment: Atama) => void;
  onOpenCreateTournament?: () => void;
  initialFilter?: Partial<FilterState>;
}

export const AssignmentsTable: React.FC<AssignmentsTableProps> = ({
  assignments,
  currentReferee,
  onViewReferee,
  onOpenAssignmentDoc,
  onOpenCreateTournament,
  initialFilter
}) => {
  // Filters
  const [search, setSearch] = useState(initialFilter?.arama || '');
  const [selectedCity, setSelectedCity] = useState(initialFilter?.sehir || '');
  const [selectedMonth, setSelectedMonth] = useState(initialFilter?.ay || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilter?.kategori || '');
  const [selectedRole, setSelectedRole] = useState(initialFilter?.gorev || '');
  const [selectedBadge, setSelectedBadge] = useState(initialFilter?.kokart || '');
  const [onlyMine, setOnlyMine] = useState(initialFilter?.sadeceSeciliHakem || false);

  // Sorting
  const [sortField, setSortField] = useState<keyof Atama>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Detail Modal
  const [selectedAssignment, setSelectedAssignment] = useState<Atama | null>(null);

  // Unique lists for dropdowns
  const cities = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach(a => { if (a.sehir) set.add(a.sehir); });
    return Array.from(set).sort();
  }, [assignments]);

  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  const categories = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach(a => { if (a.kategori) set.add(a.kategori); });
    return Array.from(set).sort();
  }, [assignments]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach(a => { if (a.gorev) set.add(a.gorev); });
    return Array.from(set).sort();
  }, [assignments]);

  // Filtering
  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      // Text search
      if (search.trim()) {
        const query = search.trim().toLocaleLowerCase('tr');
        const match = 
          item.hakem.toLocaleLowerCase('tr').includes(query) ||
          item.tesis.toLocaleLowerCase('tr').includes(query) ||
          item.sehir.toLocaleLowerCase('tr').includes(query) ||
          item.kategori.toLocaleLowerCase('tr').includes(query) ||
          item.gorev.toLocaleLowerCase('tr').includes(query) ||
          String(item.id).includes(query);
        if (!match) return false;
      }

      if (selectedCity && item.sehir !== selectedCity) return false;
      if (selectedMonth && item.ay !== selectedMonth) return false;
      if (selectedCategory && item.kategori !== selectedCategory) return false;
      if (selectedRole && item.gorev !== selectedRole) return false;
      if (selectedBadge) {
        const refMatch = (item.kokart_ref || '').toUpperCase().includes(selectedBadge.toUpperCase());
        const chairMatch = (item.kokart_chair || '').toUpperCase().includes(selectedBadge.toUpperCase());
        if (!refMatch && !chairMatch) return false;
      }
      if (onlyMine && item.hakem.toUpperCase() !== currentReferee.toUpperCase()) return false;

      return true;
    });
  }, [assignments, search, selectedCity, selectedMonth, selectedCategory, selectedRole, selectedBadge, onlyMine, currentReferee]);

  // Sorting
  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      const strA = String(valA || '');
      const strB = String(valB || '');
      return sortAsc ? strA.localeCompare(strB, 'tr') : strB.localeCompare(strA, 'tr');
    });
  }, [filteredAssignments, sortField, sortAsc]);

  // Paginated items
  const totalPages = Math.ceil(sortedAssignments.length / pageSize) || 1;
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAssignments.slice(start, start + pageSize);
  }, [sortedAssignments, currentPage, pageSize]);

  const handleSort = (field: keyof Atama) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCity('');
    setSelectedMonth('');
    setSelectedCategory('');
    setSelectedRole('');
    setSelectedBadge('');
    setOnlyMine(false);
    setCurrentPage(1);
  };

  // Find other crew members assigned to same tournament
  const tournamentCrew = useMemo(() => {
    if (!selectedAssignment) return [];
    return assignments.filter(a => 
      a.tarih === selectedAssignment.tarih && 
      a.tesis === selectedAssignment.tesis
    );
  }, [selectedAssignment, assignments]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Row 1: Search & Quick Actions */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Hakem adı, turnuva kategorisi, tesis, şehir veya görev ara..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCreateTournament && (
              <button
                onClick={onOpenCreateTournament}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Yeni turnuva oluştur ve hakem heyeti ata"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>+ Yeni Turnuva</span>
              </button>
            )}

            <button
              onClick={() => downloadCleanedExcel(filteredAssignments)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Filtrelenen kayıtları Excel (.xlsx) olarak indir"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Excel İndir</span>
            </button>

            <button
              onClick={() => downloadCleanedJson(filteredAssignments)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Filtrelenen kayıtları JSON olarak indir"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>JSON İndir</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Tabloyu yazdır"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Yazdır</span>
            </button>
          </div>
        </div>

        {/* Row 2: Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          
          {/* City */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Şehir
            </label>
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Tüm Şehirler ({cities.length})</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Ay
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Tüm Aylar</option>
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Görev Türü
            </label>
            <select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Tüm Görevler</option>
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Badge */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Kokart Derecesi
            </label>
            <select
              value={selectedBadge}
              onChange={(e) => { setSelectedBadge(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Tüm Kokartlar</option>
              <option value="WB">WB (White Badge)</option>
              <option value="SB">SB / SB-R (Silver)</option>
              <option value="BB">BB / BB-R (Bronze)</option>
              <option value="N">Ulusal (N)</option>
              <option value="IL">İl Hakemi (IL)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Row 3: Quick Filter Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Hızlı Filtreler:
          </span>

          {currentReferee && (
            <button
              onClick={() => { setOnlyMine(!onlyMine); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                onlyMine 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              ★ {currentReferee} Görevleri
            </button>
          )}

          <button
            onClick={() => { setSelectedCategory(selectedCategory === 'ATP CHALLENGER' ? '' : 'ATP CHALLENGER'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              selectedCategory === 'ATP CHALLENGER'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            ATP Challenger
          </button>

          <button
            onClick={() => { setSelectedRole(selectedRole === 'SUPERVISOR' ? '' : 'SUPERVISOR'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              selectedRole === 'SUPERVISOR'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Supervisor / Başhakemler
          </button>

          <button
            onClick={() => { setSelectedCity(selectedCity === 'ANTALYA' ? '' : 'ANTALYA'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              selectedCity === 'ANTALYA'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Antalya
          </button>

          <button
            onClick={() => { setSelectedCity(selectedCity === 'İZMİR' ? '' : 'İZMİR'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              selectedCity === 'İZMİR'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            İzmir
          </button>

          <button
            onClick={() => { setSelectedCity(selectedCity === 'ANKARA' ? '' : 'ANKARA'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              selectedCity === 'ANKARA'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Ankara (ATAK PRO)
          </button>

          {(search || selectedCity || selectedMonth || selectedCategory || selectedRole || selectedBadge || onlyMine) && (
            <button
              onClick={handleResetFilters}
              className="text-red-600 dark:text-red-400 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>

      </div>

      {/* Results Count & Density Selector */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div>
          Toplam <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{filteredAssignments.length}</strong> atama listeleniyor (Toplam: {assignments.length})
        </div>

        <div className="flex items-center gap-2">
          <span>Sayfa Başına:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={1000}>Tümü</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th 
                  onClick={() => handleSort('id')} 
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-16"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('tarih')} 
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tarih / Ay</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('kategori')} 
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Kategori</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('tesis')} 
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tesis & Şehir</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('hakem')} 
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Görevli Hakem</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('gorev')} 
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Görevi</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">
                  Kokart (Ref/Kule)
                </th>
                <th className="px-4 py-3.5 text-right">
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-800/40">
              {paginatedAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm font-medium">Arama kriterlerine uygun atama kaydı bulunamadı.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Filtreleri Sıfırla
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map((row) => {
                  const isCurrent = row.hakem.toUpperCase() === currentReferee.toUpperCase();
                  const isSupervisor = row.gorev === 'SUPERVISOR' || row.gorev === 'REF';

                  return (
                    <tr 
                      key={row.id}
                      onClick={() => setSelectedAssignment(row)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono font-semibold text-slate-400 tabular-nums">
                        #{row.id}
                      </td>

                      {/* Tarih & Ay */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                          {row.tarih}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {row.tarih_etiket ? `${row.tarih_etiket} (${row.ay})` : `${row.ay} 2026`}
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[180px] block" title={row.kategori}>
                            {row.kategori}
                          </span>
                          {row.durum === 'İPTAL' && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold shrink-0">
                              İPTAL
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tesis & Şehir */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]" title={row.tesis}>
                          {row.tesis}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{row.sehir}</span>
                        </div>
                      </td>

                      {/* Hakem */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewReferee(row.hakem);
                            }}
                            className={`font-semibold hover:underline cursor-pointer ${
                              isCurrent 
                                ? 'text-emerald-700 dark:text-emerald-400 font-bold' 
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {row.hakem}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-1 py-0.2 rounded font-medium">
                              Siz
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {row.hakem_sehir || row.sehir}
                        </div>
                      </td>

                      {/* Görevi */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-semibold ${
                          row.durum === 'İPTAL'
                            ? 'text-rose-600 dark:text-rose-400'
                            : isSupervisor 
                            ? 'text-purple-700 dark:text-purple-400' 
                            : row.gorev.includes('ŞEF') 
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {row.gorev}
                        </span>
                      </td>

                      {/* Kokart */}
                      <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <span>Ref: <strong>{row.kokart_ref || '-'}</strong></span>
                        <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
                        <span>Kule: <strong>{row.kokart_chair || '-'}</strong></span>
                      </td>

                      {/* İşlem */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAssignmentDoc(row);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 text-xs"
                          title="Resmi Atama Belgesini Görüntüle / Yazdır"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Belge</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div>
            Sayfa <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> / {totalPages}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Quick page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pNum = currentPage - 2 + i;
                if (pNum > totalPages) pNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-7 h-7 rounded text-xs font-semibold cursor-pointer ${
                    currentPage === pNum
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Row Detail Drawer Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ATAMA DETAYI #{selectedAssignment.id}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAssignment.kategori}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              
              {/* Key Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-100 dark:border-slate-700/60">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tarih</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {selectedAssignment.tarih} ({selectedAssignment.ay})
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Şehir</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedAssignment.sehir}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tesis</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedAssignment.tesis}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Görevli Hakem</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedAssignment.hakem}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Görevi</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {selectedAssignment.gorev}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Kokart Durumu</div>
                  <div className="font-mono text-slate-900 dark:text-white">
                    Ref: {selectedAssignment.kokart_ref || '-'} / Kule: {selectedAssignment.kokart_chair || '-'}
                  </div>
                </div>
              </div>

              {/* Tournament Crew Members */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
                  <span>Bu Turnuvada Görevlendirilen Hakem Heyeti ({tournamentCrew.length} Hakem)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedAssignment.tarih}</span>
                </h4>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  {tournamentCrew.map(m => (
                    <div 
                      key={m.id}
                      className={`p-3 flex items-center justify-between text-xs ${
                        m.hakem === selectedAssignment.hakem ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {m.hakem}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {m.hakem_sehir || m.sehir}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-[11px] ${
                          m.gorev === 'SUPERVISOR' || m.gorev === 'REF' ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {m.gorev}
                        </span>
                        <span className="font-mono text-slate-400">
                          [{m.kokart_ref || m.kokart_chair || '-'}]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <button
                onClick={() => onViewReferee(selectedAssignment.hakem)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{selectedAssignment.hakem} Profilini İncele</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAssignmentDoc(selectedAssignment)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resmi Görev Belgesi Çıkar</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
