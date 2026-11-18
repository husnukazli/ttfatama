export type TournamentColorTheme = 'blue' | 'emerald' | 'amber' | 'teal' | 'purple' | 'slate' | 'rose';

export interface Atama {
  id: number;
  tarih: string; // YYYY-MM-DD (Ana Tablo Başlangıç Günü - Matris ve PDF'te gösterilir)
  baslangic_tarih?: string; // YYYY-MM-DD (Turnuva Başlangıç Tarihi - müsaitlik kontrolü)
  bitis_tarih?: string; // YYYY-MM-DD (Turnuva Bitiş Tarihi - müsaitlik kontrolü)
  ay: string; // "Ocak", "Şubat", etc.
  kategori: string;
  tesis: string;
  sehir: string;
  hakem: string;
  gorev: string;
  hakem_sehir?: string;
  kokart_ref: string;
  kokart_chair: string;
  durum?: 'ONAYLANDI' | 'BEKLEMEDE' | 'TAMAMLANDI' | 'İPTAL';
  notlar?: string;
  tarih_etiket?: string;
  kart_renk?: TournamentColorTheme;
  yayinlandi?: boolean;
  orta_not?: string;
}

export interface AvailabilityRange {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  note?: string;
}

export interface TournamentConflictSnapshot {
  assignmentId: number;
  tarih: string;
  baslangic_tarih?: string;
  bitis_tarih?: string;
  ay: string;
  tesis: string;
  kategori: string;
  sehir: string;
  gorev: string;
}

export interface AvailabilityChangeNotification {
  id: string;
  refereeName: string;
  changedAt: string; // ISO timestamp
  previousRanges: AvailabilityRange[];
  newRanges: AvailabilityRange[];
  addedRanges: AvailabilityRange[];
  removedRanges: AvailabilityRange[];
  conflictingTournaments: TournamentConflictSnapshot[];
  isRead: boolean;
}

export interface RefereeAccessRecord {
  hakem: string; // Uppercase key
  canLogin: boolean; // Admin checkbox (Tik) granting login access
  password: string;  // Admin-assigned password
  availability: AvailabilityRange[];
  updatedAt?: string;
}

export type RefereeAccessMap = Record<string, RefereeAccessRecord>;

export interface UserSession {
  role: 'UNAUTHENTICATED' | 'ADMIN' | 'REFEREE';
  refereeName?: string;
}

export interface RefereeInfo {
  hakem: string;
  hakem_sehir: string;
  referee_badge: string;
  chair_badge: string;
  email?: string;
  telefon?: string;
  toplam_atama: number;
  gorev_dagilimi: Record<string, number>;
  sehir_dagilimi: Record<string, number>;
  atamalar: Atama[];
}

export interface MetadataInfo {
  yil: number;
  toplam_aktif_atama: number;
  tekil_hakem_sayisi: number;
  toplam_turnuva_sayisi: number;
  kaynak_dosya?: string;
  son_guncelleme?: string;
}

export interface FilterState {
  arama: string;
  sehir: string;
  ay: string;
  kategori: string;
  gorev: string;
  kokart: string;
  sadeceSeciliHakem: boolean;
  durum: string;
}

export interface CrewSlot {
  assignment: Atama;
  hakem: string;
  role: string;
}

export interface TournamentBlockData {
  id: string;
  tarih: string; // YYYY-MM-DD (Ana Tablo Başlangıç Günü)
  baslangicTarih?: string; // YYYY-MM-DD (Turnuva Başlangıç Tarihi)
  bitisTarih?: string; // YYYY-MM-DD (Turnuva Bitiş Tarihi)
  tarihLabel: string; // e.g. "9 Kasım", "23 -26 TEMMUZ"
  ay: string;
  sehir: string;
  kategori: string;
  tesis: string;
  tourType: 'ITF_WTT' | 'ITF_JUNIORS' | 'ITF_MASTERS' | 'TENNIS_EUROPE' | 'ATP_CHALLENGER' | 'WTA' | 'TTF_NATIONAL';
  colorTheme?: TournamentColorTheme;
  supervisor: string;
  hakemSefi?: string;
  assRef?: string;
  supervisorSlot?: CrewSlot;
  hakemSefiSlot?: CrewSlot;
  assRefSlot?: CrewSlot;
  crewCol1: CrewSlot[];
  crewCol2: CrewSlot[];
  crewCol3: CrewSlot[];
  designatedSlots?: CrewSlot[];
  rawAssignments: Atama[];
  isCancelled?: boolean;
  isPublished?: boolean;
  atpLevel?: string;
  ortaNot?: string;
}
