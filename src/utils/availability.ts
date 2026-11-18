import * as XLSX from 'xlsx';
import {
  Atama,
  AvailabilityRange,
  RefereeAccessMap,
  RefereeAccessRecord,
  RefereeInfo,
  TournamentConflictSnapshot
} from '../types';

export function normalizeRefereeKey(name: string): string {
  return (name || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
}

function foldTurkishAscii(str: string): string {
  return (str || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c')
    .toUpperCase();
}

export function getRefereeAccessRecord(
  accessMap: RefereeAccessMap,
  refereeName: string
): RefereeAccessRecord | undefined {
  if (!refereeName || !accessMap) return undefined;
  const raw = refereeName.trim().replace(/\s+/g, ' ');
  const upperDefault = raw.toUpperCase();
  const upperTr = raw.toLocaleUpperCase('tr-TR');

  if (accessMap[upperDefault]) return accessMap[upperDefault];
  if (accessMap[upperTr]) return accessMap[upperTr];

  const folded = foldTurkishAscii(raw);
  for (const [k, rec] of Object.entries(accessMap)) {
    if (foldTurkishAscii(k) === folded) {
      return rec;
    }
  }
  return undefined;
}

export function findRefereeAccessEntry(
  accessMap: RefereeAccessMap,
  inputName: string
): { key: string; record: RefereeAccessRecord } | undefined {
  if (!inputName || !accessMap) return undefined;
  const raw = inputName.trim().replace(/\s+/g, ' ');
  const upperDefault = raw.toUpperCase();
  const upperTr = raw.toLocaleUpperCase('tr-TR');

  if (accessMap[upperDefault]) return { key: upperDefault, record: accessMap[upperDefault] };
  if (accessMap[upperTr]) return { key: upperTr, record: accessMap[upperTr] };

  const folded = foldTurkishAscii(raw);
  for (const [k, rec] of Object.entries(accessMap)) {
    if (foldTurkishAscii(k) === folded) {
      return { key: k, record: rec };
    }
  }
  return undefined;
}

export function diffAvailabilityRanges(
  prevRanges: AvailabilityRange[],
  nextRanges: AvailabilityRange[]
): {
  hasChanged: boolean;
  addedRanges: AvailabilityRange[];
  removedRanges: AvailabilityRange[];
} {
  const sig = (r: AvailabilityRange) => `${r.startDate}__${r.endDate}`;
  const prevSigs = new Set(prevRanges.map(sig));
  const nextSigs = new Set(nextRanges.map(sig));

  const addedRanges = nextRanges.filter(r => !prevSigs.has(sig(r)));
  const removedRanges = prevRanges.filter(r => !nextSigs.has(sig(r)));

  const hasChanged = addedRanges.length > 0 || removedRanges.length > 0;
  return { hasChanged, addedRanges, removedRanges };
}

export function isAssignmentPublished(a: Pick<Atama, 'yayinlandi'>): boolean {
  return a.yayinlandi !== false;
}

export function getCurrentMonthStartIso(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  const m = String(referenceDate.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function isPastMonthDate(isoDate: string, referenceDate: Date = new Date()): boolean {
  if (!isoDate || isoDate.length < 7) return false;
  return isoDate < getCurrentMonthStartIso(referenceDate);
}

export interface ConflictCheckOptions {
  onlyPublished?: boolean;
  ignorePastMonths?: boolean;
  includeWhenRangesEmpty?: boolean;
}

export function getTournamentDateSpan(item: {
  tarih: string;
  baslangic_tarih?: string;
  bitis_tarih?: string;
  baslangicTarih?: string;
  bitisTarih?: string;
}): { startDate: string; endDate: string } {
  const s = item.baslangic_tarih || item.baslangicTarih || item.tarih;
  const e = item.bitis_tarih || item.bitisTarih || s;
  if (!s) return { startDate: '', endDate: '' };
  return s <= e ? { startDate: s, endDate: e } : { startDate: e, endDate: s };
}

export function isDateSpanCoveredByRanges(
  startDate: string,
  endDate: string,
  ranges: AvailabilityRange[]
): boolean {
  if (!startDate || ranges.length === 0) return false;
  const s = startDate <= (endDate || startDate) ? startDate : endDate;
  const e = startDate <= (endDate || startDate) ? (endDate || startDate) : startDate;

  if (s === e) {
    return ranges.some(r => s >= r.startDate && s <= r.endDate);
  }

  const sp = s.split('-').map(Number);
  const ep = e.split('-').map(Number);
  if (sp.length !== 3 || ep.length !== 3 || sp.some(isNaN) || ep.some(isNaN)) {
    return ranges.some(r => s >= r.startDate && e <= r.endDate);
  }

  const cur = new Date(Date.UTC(sp[0], sp[1] - 1, sp[2]));
  const endMs = Date.UTC(ep[0], ep[1] - 1, ep[2]);
  let guard = 0;

  while (cur.getTime() <= endMs && guard < 90) {
    const iso = cur.toISOString().slice(0, 10);
    if (!ranges.some(r => iso >= r.startDate && iso <= r.endDate)) {
      return false;
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
    guard++;
  }

  return true;
}

export function getRefereeTournamentConflictsForRanges(
  refereeName: string,
  ranges: AvailabilityRange[],
  assignments: Atama[],
  options: ConflictCheckOptions = {}
): TournamentConflictSnapshot[] {
  const {
    onlyPublished = false,
    ignorePastMonths = true,
    includeWhenRangesEmpty = false
  } = options;

  const targetFolded = foldTurkishAscii(refereeName);
  if (!targetFolded) return [];
  if (ranges.length === 0 && !includeWhenRangesEmpty) return [];

  const seenTourKeys = new Set<string>();
  const conflicts: TournamentConflictSnapshot[] = [];

  for (const a of assignments) {
    if (a.durum === 'İPTAL') continue;
    if (onlyPublished && !isAssignmentPublished(a)) continue;
    const span = getTournamentDateSpan(a);
    if (ignorePastMonths && isPastMonthDate(span.endDate || a.tarih)) continue;
    if (foldTurkishAscii(a.hakem) !== targetFolded) continue;

    const covered =
      ranges.length > 0 && isDateSpanCoveredByRanges(span.startDate, span.endDate, ranges);
    if (!covered) {
      const tourKey = `${a.tarih}_${a.tesis}_${a.kategori}`;
      if (!seenTourKeys.has(tourKey)) {
        seenTourKeys.add(tourKey);
        conflicts.push({
          assignmentId: a.id,
          tarih: a.tarih,
          baslangic_tarih: a.baslangic_tarih,
          bitis_tarih: a.bitis_tarih,
          ay: a.ay,
          tesis: a.tesis,
          kategori: a.kategori,
          sehir: a.sehir,
          gorev: a.gorev
        });
      }
    }
  }

  return conflicts.sort((a, b) => a.tarih.localeCompare(b.tarih));
}

export interface LiveAvailabilityTournamentConflict {
  refereeName: string;
  ranges: AvailabilityRange[];
  tournaments: TournamentConflictSnapshot[];
}

export function getAllLiveTournamentAvailabilityConflicts(
  assignments: Atama[],
  accessMap: RefereeAccessMap
): LiveAvailabilityTournamentConflict[] {
  const results: LiveAvailabilityTournamentConflict[] = [];

  for (const [key, record] of Object.entries(accessMap)) {
    const ranges = record?.availability || [];
    if (ranges.length === 0) continue;

    const tournaments = getRefereeTournamentConflictsForRanges(key, ranges, assignments, {
      onlyPublished: false,
      ignorePastMonths: true
    });
    if (tournaments.length > 0) {
      results.push({
        refereeName: record.hakem || key,
        ranges,
        tournaments
      });
    }
  }

  return results.sort((a, b) => a.refereeName.localeCompare(b.refereeName, 'tr'));
}

export function formatDateTimeTr(isoStr: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoStr;
  }
}

export type AvailabilityCheckStatus =
  | 'AVAILABLE'         // Saved ranges exist and cover the tournament date
  | 'UNAVAILABLE'       // Saved ranges exist (or referee has access with declared unavailability) and DO NOT cover the date
  | 'NO_RANGES_YET'     // Has login access, but hasn't saved any availability ranges yet
  | 'NO_LOGIN_RECORD';  // Not in access system / no ranges entered

export interface AvailabilityCheckResult {
  status: AvailabilityCheckStatus;
  isAvailable: boolean;
  isConflict: boolean;
  ranges: AvailabilityRange[];
  warningMessage: string;
}

export const UNAVAILABLE_WEEK_WARNING = 'Hakemlerin bu hafta için müsaitliği yoktur.';
export const SAME_DATE_CONFLICT_WARNING = 'Bu hakem aynı tarihte başka bir turnuvaya da atanmıştır!';

const PLACEHOLDER_REFEREES = new Set(['TBA', 'EXCHANGE', '-', '']);

export interface SameDateConflictResult {
  hasConflict: boolean;
  conflicts: Atama[];
  warningMessage: string;
}

/**
 * Checks whether a referee is already assigned to another active tournament on overlapping dates (YYYY-MM-DD).
 * Excludes placeholders (TBA/EXCHANGE), cancelled assignments (İPTAL), and the current tournament if provided.
 */
export function checkSameDateTournamentConflict(
  refereeName: string,
  tournamentDateOrSpan: string | { startDate: string; endDate?: string },
  allAssignments: Atama[],
  excludeTournamentKey?: string,
  excludeAssignmentId?: number
): SameDateConflictResult {
  const key = (refereeName || '').trim().toUpperCase();
  const targetStart =
    typeof tournamentDateOrSpan === 'string'
      ? tournamentDateOrSpan
      : tournamentDateOrSpan.startDate;
  const targetEnd =
    typeof tournamentDateOrSpan === 'string'
      ? tournamentDateOrSpan
      : tournamentDateOrSpan.endDate || tournamentDateOrSpan.startDate;

  if (!key || PLACEHOLDER_REFEREES.has(key) || !targetStart) {
    return { hasConflict: false, conflicts: [], warningMessage: '' };
  }

  const normStart = targetStart <= targetEnd ? targetStart : targetEnd;
  const normEnd = targetStart <= targetEnd ? targetEnd : targetStart;

  const seenTourKeys = new Set<string>();
  const conflicts: Atama[] = [];

  for (const a of allAssignments) {
    if (a.durum === 'İPTAL') continue;
    if (excludeAssignmentId !== undefined && a.id === excludeAssignmentId) continue;
    if (foldTurkishAscii(a.hakem) !== foldTurkishAscii(key)) continue;

    const existingSpan = getTournamentDateSpan(a);
    const overlaps = normStart <= existingSpan.endDate && normEnd >= existingSpan.startDate;
    if (!overlaps) continue;

    const tourKey = `${a.tarih}_${a.tesis}_${a.kategori}`;
    if (excludeTournamentKey && tourKey === excludeTournamentKey) continue;

    if (!seenTourKeys.has(tourKey)) {
      seenTourKeys.add(tourKey);
      conflicts.push(a);
    }
  }

  if (conflicts.length === 0) {
    return { hasConflict: false, conflicts: [], warningMessage: '' };
  }

  const desc = conflicts.map(c => `${c.tesis} (${c.kategori})`).join(', ');
  const dateDisplay =
    normStart === normEnd
      ? `${formatTrDate(normStart)} tarihinde`
      : `${formatTrDate(normStart)} - ${formatTrDate(normEnd)} tarihleri arasında`;
  return {
    hasConflict: true,
    conflicts,
    warningMessage: `${key}, ${dateDisplay} zaten başka bir turnuvada görevli: ${desc}`
  };
}

export function getMonthNameFromIsoDate(dateStr: string): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  if (!dateStr) return 'Ocak';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const m = parseInt(parts[1], 10);
    return months[m - 1] || 'Ocak';
  }
  return 'Ocak';
}

export function getShortDayMonthLabel(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    const day = parseInt(parts[2], 10);
    return `${day} ${getMonthNameFromIsoDate(dateStr)}`;
  }
  return dateStr;
}

/**
 * Checks whether a referee is available for a given tournament date or [startDate, endDate] span.
 * Every day in the span must fall within the referee's saved availability ranges.
 * Past months (strictly before current system month) never trigger availability warnings.
 */
export function checkRefereeAvailability(
  refereeName: string,
  tournamentDateOrSpan: string | { startDate: string; endDate?: string },
  accessMap: RefereeAccessMap,
  options: { ignorePastMonths?: boolean } = {}
): AvailabilityCheckResult {
  const { ignorePastMonths = true } = options;
  const key = (refereeName || '').trim().toUpperCase();
  const rawStart =
    typeof tournamentDateOrSpan === 'string'
      ? tournamentDateOrSpan
      : tournamentDateOrSpan.startDate;
  const rawEnd =
    typeof tournamentDateOrSpan === 'string'
      ? tournamentDateOrSpan
      : tournamentDateOrSpan.endDate || tournamentDateOrSpan.startDate;

  if (!key || !rawStart) {
    return {
      status: 'NO_LOGIN_RECORD',
      isAvailable: true,
      isConflict: false,
      ranges: [],
      warningMessage: ''
    };
  }

  const spanStart = rawStart <= rawEnd ? rawStart : rawEnd;
  const spanEnd = rawStart <= rawEnd ? rawEnd : rawStart;

  const record = getRefereeAccessRecord(accessMap, refereeName);
  if (!record) {
    return {
      status: 'NO_LOGIN_RECORD',
      isAvailable: true,
      isConflict: false,
      ranges: [],
      warningMessage: ''
    };
  }

  const ranges = record.availability || [];

  // Past months' tournaments have already been played; do not raise availability conflict alerts for them
  if (ignorePastMonths && isPastMonthDate(spanEnd)) {
    return {
      status: 'NO_LOGIN_RECORD',
      isAvailable: true,
      isConflict: false,
      ranges,
      warningMessage: ''
    };
  }

  // If the referee has entered availability ranges, verify the entire tournament start..end span is covered
  if (ranges.length > 0) {
    const matching = isDateSpanCoveredByRanges(spanStart, spanEnd, ranges);

    if (matching) {
      return {
        status: 'AVAILABLE',
        isAvailable: true,
        isConflict: false,
        ranges,
        warningMessage: ''
      };
    } else {
      return {
        status: 'UNAVAILABLE',
        isAvailable: false,
        isConflict: true,
        ranges,
        warningMessage: UNAVAILABLE_WEEK_WARNING
      };
    }
  }

  // If the referee has login access ticked but hasn't entered any availability ranges yet
  if (record.canLogin) {
    return {
      status: 'NO_RANGES_YET',
      isAvailable: false,
      isConflict: true,
      ranges: [],
      warningMessage: UNAVAILABLE_WEEK_WARNING
    };
  }

  return {
    status: 'NO_LOGIN_RECORD',
    isAvailable: true,
    isConflict: false,
    ranges: [],
    warningMessage: ''
  };
}

/**
 * Generates a clean 6-character password for referee login.
 */
export function generateRefereePassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `TTF${digits}`;
}

/**
 * Formats YYYY-MM-DD into readable Turkish date (e.g. "9 Kasım 2026").
 */
export function formatTrDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const y = parts[0];
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return `${d} ${months[m - 1] || parts[1]} ${y}`;
}

export function formatRangeLabel(range: AvailabilityRange): string {
  if (range.startDate === range.endDate) {
    return formatTrDate(range.startDate);
  }
  return `${formatTrDate(range.startDate)} - ${formatTrDate(range.endDate)}`;
}

/**
 * Parses multi-line pasted referee list text.
 * Supports:
 * - "AHMET YILMAZ"
 * - "AHMET YILMAZ, İZMİR, WB, N"
 * - Tab / Semicolon / Comma separated
 */
export function parseBulkRefereesText(text: string): RefereeInfo[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const results: RefereeInfo[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    // Skip potential header line
    const upperLine = line.toUpperCase();
    if (
      upperLine.startsWith('HAKEM') ||
      upperLine.startsWith('AD SOYAD') ||
      upperLine.startsWith('İSİM') ||
      upperLine.startsWith('NAME')
    ) {
      continue;
    }

    const parts = line.split(/[\t;,]+/).map(p => p.trim());
    const name = (parts[0] || '').toUpperCase();
    if (!name || name.length < 2 || seen.has(name)) continue;
    seen.add(name);

    const city = (parts[1] || 'TÜRKİYE').toUpperCase();
    const refBadge = (parts[2] || 'N').toUpperCase();
    const chairBadge = (parts[3] || 'N').toUpperCase();

    results.push({
      hakem: name,
      hakem_sehir: city,
      referee_badge: refBadge,
      chair_badge: chairBadge,
      toplam_atama: 0,
      gorev_dagilimi: {},
      sehir_dagilimi: {},
      atamalar: []
    });
  }

  return results;
}

/**
 * Parses an Excel or CSV file containing a referee list.
 */
export async function parseBulkRefereesExcel(file: File): Promise<RefereeInfo[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];

  const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
  const results: RefereeInfo[] = [];
  const seen = new Set<string>();

  rows.forEach((row) => {
    const keys = Object.keys(row);
    const nameKey =
      keys.find(k => /hakem|ad\s*soyad|isim|name/i.test(k)) || keys[0];
    const cityKey =
      keys.find(k => /şehir|sehir|il|city/i.test(k));
    const refKey =
      keys.find(k => /ref|başhakem/i.test(k));
    const chairKey =
      keys.find(k => /chair|kule/i.test(k));

    const name = String(row[nameKey] || '').trim().toUpperCase();
    if (!name || name === '0' || name === 'NAN' || seen.has(name)) return;
    seen.add(name);

    results.push({
      hakem: name,
      hakem_sehir: cityKey ? String(row[cityKey] || 'TÜRKİYE').trim().toUpperCase() || 'TÜRKİYE' : 'TÜRKİYE',
      referee_badge: refKey ? String(row[refKey] || 'N').trim().toUpperCase() || 'N' : 'N',
      chair_badge: chairKey ? String(row[chairKey] || 'N').trim().toUpperCase() || 'N' : 'N',
      toplam_atama: 0,
      gorev_dagilimi: {},
      sehir_dagilimi: {},
      atamalar: []
    });
  });

  return results;
}
