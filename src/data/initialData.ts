import { Atama, MetadataInfo, RefereeInfo } from '../types';

export interface RefSeed {
  hakem: string;
  sehir: string;
  ref_kokart: string;
  chair_kokart: string;
}

// Bilinen kokart ve şehir referans havuzu (PDF'te yer almayan yeni hakemler varsayılan 'N' derecesiyle eklenir)
export const REFEREES_CATALOG: RefSeed[] = [
  { hakem: 'ALAADDİN BOYAR', sehir: 'ANTALYA', ref_kokart: 'WB', chair_kokart: 'WB' },
  { hakem: 'İLKER ÖRT', sehir: 'ANKARA', ref_kokart: 'SB-R', chair_kokart: 'BB' },
  { hakem: 'ERKAN TARHAN', sehir: 'ANKARA', ref_kokart: 'WB', chair_kokart: 'BB' },
  { hakem: 'HÜSNÜ KAZLI', sehir: 'İZMİR', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'SONER SİVRİ', sehir: 'İSTANBUL', ref_kokart: 'WB', chair_kokart: 'BB' },
  { hakem: 'SERDAR SUMER', sehir: 'ANTALYA', ref_kokart: 'WB', chair_kokart: 'BB' },
  { hakem: 'HALE BOZKURT', sehir: 'ANTALYA', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'FIRAT KÖKVER', sehir: 'ANKARA', ref_kokart: 'N', chair_kokart: 'BB' },
  { hakem: 'MUSTAFA GÖKKAYA', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'WB' },
  { hakem: 'YÜKSEL SÜVARİ', sehir: 'ANKARA', ref_kokart: 'N', chair_kokart: 'BB' },
  { hakem: 'CEM ÇAĞLAR', sehir: 'İZMİR', ref_kokart: 'WB', chair_kokart: 'WB' },
  { hakem: 'MURAT AYKAÇ', sehir: 'ANTALYA', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'DİLEK AKDİLEK', sehir: 'İSTANBUL', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'YUNUS TOLUNAY EREN', sehir: 'İSTANBUL', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'İSMAİL KURTGÖZ', sehir: 'ADANA', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'MEHMET ALİ AKYÜZ', sehir: 'ANTALYA', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'TUFAN TERCAN', sehir: 'ANTALYA', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'ÇETİN KESİCİ', sehir: 'ANTALYA', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'AHMET SERT', sehir: 'BURSA', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'FERHAT KILIÇ', sehir: 'İSTANBUL', ref_kokart: 'WB', chair_kokart: 'N' },
  { hakem: 'ATAKAN DÜRÜST', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'BB' },
  { hakem: 'VESSELINA DONEVA', sehir: 'ULUSLARARASI', ref_kokart: 'WB', chair_kokart: 'WB' },
  { hakem: 'DANIELE MOROSSI', sehir: 'ULUSLARARASI', ref_kokart: 'WB', chair_kokart: 'WB' },
  { hakem: 'WERNER HOTZIGER', sehir: 'ULUSLARARASI', ref_kokart: 'WB', chair_kokart: 'WB' },
  { hakem: 'CHIARA CASULA', sehir: 'ULUSLARARASI', ref_kokart: 'WB', chair_kokart: 'BB' },
  { hakem: 'PATRICK MCSTEIN', sehir: 'ULUSLARARASI', ref_kokart: 'SB-R', chair_kokart: 'BB' },
  { hakem: 'MANUEL WEIS', sehir: 'ULUSLARARASI', ref_kokart: 'WB', chair_kokart: 'BB' },
  { hakem: 'ESİN KIRATLI', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'WB' },
  { hakem: 'BAHAR AÇAR', sehir: 'ANTALYA', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'EYLÜL BENLİ', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'BB' },
  { hakem: 'KADRİYE TÜKENMEZ', sehir: 'ANTALYA', ref_kokart: 'N', chair_kokart: 'WB' },
  { hakem: 'GÖKHAN PAMUK', sehir: 'ADANA', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'VOLKAN AKBAŞ', sehir: 'ADANA', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'YUSUF ÇOPUR', sehir: 'ADANA', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'MURAT ASLANTAŞ', sehir: 'ADANA', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'GÖKÇE SUMER', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'ELÇİN YENİOĞLU', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'İSMAİL ATAKER', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'ÖNDER UĞUR HATİPOĞLU', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'YUSUF ÇEVİK', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'BURAK ULAŞ', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'M. FURKAN ERCİŞLİ', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'YUSUF BARAN KARTAL', sehir: 'İSTANBUL', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'NESLİHAN VURUŞKAN', sehir: 'İZMİR', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'YİĞİT DERE', sehir: 'İZMİR', ref_kokart: 'N', chair_kokart: 'N' },
  { hakem: 'MUSTAFA HAKAN ÇETİN', sehir: 'İZMİR', ref_kokart: 'N', chair_kokart: 'N' }
];

const PLACEHOLDER_NAMES = new Set(['TBA', 'EXCHANGE', '-', '']);

interface PdfTournamentDef {
  tarih: string;
  tarihEtiket?: string;
  ay: string;
  sehir: string;
  kategori: string;
  tesis: string;
  supervisor?: string;
  hakemSefi?: string;
  assRef?: string;
  refRole?: string;
  col1?: string[];
  col2?: string[];
  col3?: string[];
  col1Note?: string;
  col3Note?: string;
  cancelled?: boolean;
}

// 2026 Ocak-Aralık Uluslararası Hakem Atamaları PDF (Sayfa 1-10)
const PDF_TOURNAMENTS: PdfTournamentDef[] = [
  // ==================== SAYFA 1: OCAK ====================
  {
    tarih: '2026-01-05',
    ay: 'Ocak',
    sehir: 'ANTALYA',
    kategori: '25K MEN / 35K WOMEN',
    tesis: 'MEGASARAY',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['SONER SİVRİ', 'YİĞİTCAN PAMUK', 'YÜKSEL SÜVARİ', 'OĞUZ AZKARA', 'ALİ KEKEÇ'],
    col1Note: 'SALI-CUMA',
    col3: ['İLKER ÖRT', 'ALİ FURKAN CANLI', 'BAHAR AÇAR', 'SAKİNE DOĞAN', 'DOĞA ECE ENGİN', 'ALONA GÜRSEL'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-01-05',
    ay: 'Ocak',
    sehir: 'İSTANBUL',
    kategori: 'ITF J100',
    tesis: 'GLOBAL SK',
    supervisor: 'YUNUS TOLUNAY EREN',
    col1: ['İSMAİL ATAKER', 'FERHAT KILIÇ', 'GÖKÇE SUMER', 'ELÇİN YENİOĞLU']
  },
  {
    tarih: '2026-01-12',
    ay: 'Ocak',
    sehir: 'ANTALYA',
    kategori: '25K MEN / 35K WOMEN',
    tesis: 'MEGASARAY',
    supervisor: 'İLKER ÖRT',
    col1: ['SONER SİVRİ', 'BAHAR AÇAR', 'AHMET YAZICI', 'ALİ FURKAN CANLI', 'GÜVEN ÇELİK'],
    col1Note: 'SALI-CUMA',
    col3: ['FIRAT KÖKVER', 'DİLEK AKDİLEK', 'OZAN TURHAN', 'YİĞİTCAN PAMUK', 'YÜKSEL SÜVARİ', 'KORAY POLAT'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-01-19',
    ay: 'Ocak',
    sehir: 'ANTALYA',
    kategori: '25K MEN / 15K WOMEN',
    tesis: 'MEGASARAY',
    supervisor: 'İLKER ÖRT',
    col1: ['SERDAR SUMER', 'MURAT AYKAÇ', 'ÇETİN KESİCİ', 'BAHAR AÇAR', 'KAMİL AYNA'],
    col1Note: 'SALI-CUMA',
    col3: ['OZAN TURHAN', 'MEHMET ALİ AKYÜZ', 'CEM ÇAĞLAR', 'DİLEK AKDİLEK', 'GÜVEN ÇELİK', 'AHMET YAZICI'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-01-19',
    ay: 'Ocak',
    sehir: 'ADANA',
    kategori: 'ITF J30',
    tesis: 'ADANA ATLI SPOR',
    supervisor: 'İSMAİL KURTGÖZ',
    col1: ['GÖKHAN PAMUK', 'VOLKAN AKBAŞ', 'ALİ KEKEÇ', 'TÜLAY TAPÇI']
  },
  {
    tarih: '2026-01-26',
    ay: 'Ocak',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['CEM ÇAĞLAR', 'YUSUF GÜZEL', 'MURAT AYKAÇ', 'OZAN TURHAN', 'DOĞA ECE ENGİN'],
    col1Note: 'SALI-CUMA',
    col3: ['SERKAN ALPER BAŞER', 'MUSTAFA GÖKKAYA', 'MEHMET ALİ AKYÜZ', 'OSMAN YAMAN', 'ALİ KEKEÇ', 'SAKİNE DOĞAN'],
    col3Note: 'SALI-PERŞEMBE'
  },

  // ==================== SAYFA 2: ŞUBAT ====================
  {
    tarih: '2026-02-02',
    ay: 'Şubat',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['İSMAİL KURTGÖZ', 'YİĞİTCAN PAMUK', 'YUSUF GÜZEL', 'GÖKHAN PAMUK', 'SAKİNE DOĞAN'],
    col1Note: 'SALI-CUMA',
    col3: ['DİLEK AKDİLEK', 'ORKAN ÇİNTUĞLU', 'OĞUZ AZKARA', 'KORAY POLAT', 'KEREM ATA', 'ALİ KEKEÇ'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-02-02',
    ay: 'Şubat',
    sehir: 'ANTALYA',
    kategori: 'ITF J60',
    tesis: 'MEGASARAY',
    supervisor: 'FIRAT KÖKVER',
    col1: ['ALONA GÜRSEL', 'EVREN SOYTOK', 'ALİ FURKAN CANLI', 'GONCA YAĞIŞAN']
  },
  {
    tarih: '2026-02-04',
    ay: 'Şubat',
    sehir: 'İSTANBUL',
    kategori: '16&U BOYS WINTER CUP',
    tesis: 'GLOBAL SK',
    supervisor: 'ERKAN TARHAN',
    col1: ['FERHAT KILIÇ', 'GÖKÇE SUMER', 'ARİF DOĞRU', 'İSMAİL ATAKER', 'ELÇİN YENİOĞLU']
  },
  {
    tarih: '2026-02-04',
    ay: 'Şubat',
    sehir: 'İSTANBUL',
    kategori: '14&U BOYS WINTER CUP',
    tesis: 'TAÇ SPOR KULÜBÜ',
    supervisor: 'YUNUS TOLUNAY EREN',
    col1: ['ARİF DOĞRU', 'MEHTAP SABUNCU', 'BURAK ULAŞ', 'ALAATTİN ATABAY']
  },
  {
    tarih: '2026-02-09',
    ay: 'Şubat',
    sehir: 'ANTALYA',
    kategori: '25K MEN / 35K WOMEN',
    tesis: 'MEGASARAY',
    supervisor: 'İLKER ÖRT',
    col1: ['SONER SİVRİ', 'YUSUF GÜZEL', 'AHMET YAZICI', 'SAKİNE DOĞAN', 'FERHAT KILIÇ', 'ALİ KEKEÇ'],
    col1Note: 'SALI-CUMA',
    col3: ['FIRAT KÖKVER', 'ALİ FURKAN CANLI', 'ALONA GÜRSEL', 'DİLEK AKDİLEK', 'ORKAN ÇİNTUĞLU'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-02-09',
    ay: 'Şubat',
    sehir: 'BELİRTİLMEMİŞ',
    kategori: 'ITF J30',
    tesis: 'ATİK',
    supervisor: 'MURAT AYKAÇ',
    col1: ['GÜVEN ÇELİK', 'NERMİN AÇAR', 'GÖKHAN PAMUK', 'OĞUZ AZKARA']
  },
  {
    tarih: '2026-02-16',
    ay: 'Şubat',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'İLKER ÖRT',
    col1: ['ALİ FURKAN CANLI', 'OZAN TURHAN', 'SAKİNE DOĞAN', 'KAMİL AYNA', 'GÜVEN ÇELİK'],
    col1Note: 'SALI-CUMA',
    col3: ['KADRİYE TÜKENMEZ', 'MEHMET ALİ AKYÜZ', 'AHMET YAZICI', 'ÖZGÜR KÖROĞLU', 'MURAT AYKAÇ', 'OĞUZ AZKARA'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-02-16',
    ay: 'Şubat',
    sehir: 'İSTANBUL',
    kategori: 'TE -U14&U',
    tesis: 'GLOBAL SK',
    supervisor: 'DİLEK AKDİLEK',
    col1: ['YÜKSEL SÜVARİ', 'ELÇİN YENİOĞLU', 'FERHAT KILIÇ', 'İSMAİL ATAKER']
  },
  {
    tarih: '2026-02-23',
    ay: 'Şubat',
    sehir: 'ANTALYA',
    kategori: '15K MEN / 35K WOMEN',
    tesis: 'MEGASARAY',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['FIRAT KÖKVER', 'MUSTAFA GÖKKAYA', 'ORKAN ÇİNTUĞLU', 'OZAN TURHAN', 'İSMAİL KURTGÖZ'],
    col1Note: 'SALI-CUMA',
    col3: ['CEM ÇAĞLAR', 'ÇETİN KESİCİ', 'MEHMET ALİ AKYÜZ', 'KORAY POLAT', 'GÜVEN ÇELİK', 'OSMAN YAMAN'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-02-23',
    ay: 'Şubat',
    sehir: 'ANTALYA',
    kategori: 'WTA Megasaray Hotels Open (WTA 125)',
    tesis: 'MTA',
    assRef: 'İLKER ÖRT',
    refRole: 'REF',
    hakemSefi: 'SONER SİVRİ',
    col1: ['LAUGERO', 'KADRİYE TÜKENMEZ', 'YÜKSEL SÜVARİ'],
    col1Note: 'WTA',
    col3: ['KAUKAEVA', 'İSMAİL KURTGÖZ', 'EYLÜL BENLİ', 'ESİN KIRATLI'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-02-23',
    ay: 'Şubat',
    sehir: 'ANTALYA',
    kategori: 'TE -U14&U',
    tesis: 'MTA',
    supervisor: 'MURAT AYKAÇ',
    col1: ['ALONA GÜRSEL', 'YUSUF GÜZEL', 'ALİ FURKAN CANLI', 'OĞUZ AZKARA']
  },

  // ==================== SAYFA 3: MART (Aktif + İptal) ====================
  {
    tarih: '2026-03-02',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['ALİ FURKAN CANLI', 'EVGENY NOVITSKIY', 'SERDAR SUMER', 'HELEN GİZİR', 'ÖZGÜR KÖROĞLU'],
    col1Note: 'SALI-CUMA',
    col3: ['KIRILL BORSHCHEV', 'AHMET YAZICI', 'YUSUF GÜZEL', 'SAKİNE DOĞAN', 'OĞUZ AZKARA', 'DOĞA ECE ENGİN'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-03-02',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'WTA Megasaray Hotels Open (WTA 125)',
    tesis: 'MTA',
    assRef: 'İLKER ÖRT',
    refRole: 'REF',
    hakemSefi: 'MUSTAFA GÖKKAYA',
    col1: ['IGNATCHENKO', 'ESİN KIRATLI'],
    col1Note: 'WTA',
    col3: ['SRECEC', 'ANETA POVLASKİ', 'BAHAR AÇAR', 'AYSEL ENGİN'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-03-02',
    ay: 'Mart',
    sehir: 'İSTANBUL',
    kategori: 'TE -U16&U',
    tesis: 'OPTİMUM',
    supervisor: 'YUNUS TOLUNAY EREN',
    col1: ['M. FURKAN ERCİŞLİ', 'ATAKAN DÜRÜST', 'BURAK ULAŞ', 'YÜKSEL SÜVARİ']
  },
  {
    tarih: '2026-02-28',
    tarihEtiket: '28 Şubat - 09 Mart',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'TE -U14&U DEVELOPMENT',
    tesis: 'MTA',
    supervisor: 'ERKAN TARHAN',
    hakemSefi: 'MURAT AYKAÇ',
    col1: ['GÜVEN ÇELİK', 'ERKAN ALAÇAM'],
    col2: ['FERHAT KILIÇ'],
    col3: ['CEM ZEYBEK']
  },
  // 9 Mart
  {
    tarih: '2026-03-09',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-09',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'WTA Megasaray Hotels Open (WTA 125)',
    tesis: 'MTA',
    assRef: 'SERDAR SUMER',
    refRole: 'REF',
    hakemSefi: 'ERKAN TARHAN',
    col1: ['IGNATCHENKO', 'ESİN KIRATLI', 'DİLEK AKDİLEK'],
    col1Note: 'WTA',
    col3: ['SRECEC', 'FIRAT KÖKVER', 'SERKAN ALPER BAŞER'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-03-07',
    tarihEtiket: '7 -14 Mart',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'WORLD TEAM CHAMPIONSHIPS',
    tesis: 'CLUB ALİBEY',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-09',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'ITF J100',
    tesis: 'MEGASARAY',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-09',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'MT400',
    tesis: 'ATİK',
    supervisor: 'ÇETİN KESİCİ',
    col1: ['NERMİN AÇAR', 'İHSAN AÇAR', 'ÇİĞDEM ÖZSOY', 'HALE BOZKURT'],
    cancelled: true
  },
  // 16 Mart
  {
    tarih: '2026-03-16',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-16',
    ay: 'Mart',
    sehir: 'İSTANBUL',
    kategori: 'TE -U12&U',
    tesis: 'GLOBAL SK',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-14',
    tarihEtiket: '14-21 Mart',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'WORLD INDIVIDUAL CHAM.',
    tesis: 'CLUB ALİBEY',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-16',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'ITF J60',
    tesis: 'MEGASARAY',
    supervisor: 'TBA',
    cancelled: true
  },
  // 23 Mart
  {
    tarih: '2026-03-23',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-23',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'MT1000',
    tesis: 'CLUB ALİBEY',
    supervisor: 'TBA',
    cancelled: true
  },
  // 30 Mart
  {
    tarih: '2026-03-30',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-30',
    ay: 'Mart',
    sehir: 'ANTALYA',
    kategori: 'MT400',
    tesis: 'CLUB ALİBEY SORGUN',
    supervisor: 'TBA',
    cancelled: true
  },
  {
    tarih: '2026-03-30',
    ay: 'Mart',
    sehir: 'BELİRTİLMEMİŞ',
    kategori: 'ITF J100',
    tesis: 'GLOBAL SK',
    supervisor: 'TBA',
    cancelled: true
  },

  // ==================== SAYFA 4: NİSAN ====================
  {
    tarih: '2026-04-13',
    ay: 'Nisan',
    sehir: 'ANTALYA',
    kategori: 'TE -U12&U',
    tesis: 'ATİK',
    supervisor: 'MURAT AYKAÇ',
    col1: ['ALONA GÜRSEL', 'HELEN GİZİR', 'GÜVEN ÇELİK', 'NERMİN AÇAR']
  },
  {
    tarih: '2026-04-18',
    ay: 'Nisan',
    sehir: 'ANTALYA',
    kategori: 'MT200',
    tesis: 'ROBINSON ÇAMYUVA',
    supervisor: 'TUFAN TERCAN'
  },
  {
    tarih: '2026-04-20',
    ay: 'Nisan',
    sehir: 'İSTANBUL',
    kategori: 'ITF J100',
    tesis: 'TED',
    supervisor: 'ERKAN TARHAN',
    col1: ['AHMET YAZICI', 'DOĞA ECE ENGİN', 'OSMAN YAMAN', 'FERHAT KILIÇ']
  },
  {
    tarih: '2026-04-20',
    ay: 'Nisan',
    sehir: 'ADANA',
    kategori: 'TE -U14&U',
    tesis: 'ATDSK',
    supervisor: 'FIRAT KÖKVER',
    col1: ['DİLA NAZ PAMUK', 'MURAT CEM TOK', 'TÜLAY TAPÇI', 'GAMZE KARAŞOĞLI']
  },
  {
    tarih: '2026-04-24',
    ay: 'Nisan',
    sehir: 'ANTALYA',
    kategori: 'MT200',
    tesis: 'ROBINSON ÇAMYUVA',
    supervisor: 'TUFAN TERCAN'
  },
  {
    tarih: '2026-04-27',
    ay: 'Nisan',
    sehir: 'İSTANBUL',
    kategori: 'ITF J60',
    tesis: 'ENKA',
    supervisor: 'DİLEK AKDİLEK',
    col1: ['YÜKSEL SÜVARİ', 'ATAKAN DÜRÜST', 'İSMAİL ATAKER', 'BURAK ULAŞ']
  },
  {
    tarih: '2026-04-27',
    ay: 'Nisan',
    sehir: 'İSTANBUL',
    kategori: 'TE -U12&U',
    tesis: 'GLOBAL SK',
    supervisor: 'MEHMET ALİ AKYÜZ',
    col1: ['YUSUF ÇEVİK', 'HÜLYA GÜNER', 'YELİZ YÜKSEL', 'ELÇİN YENİOĞLU']
  },
  {
    tarih: '2026-04-27',
    ay: 'Nisan',
    sehir: 'İSTANBUL',
    kategori: 'MT400',
    tesis: 'OPTİMUM',
    supervisor: 'MURAT AYKAÇ',
    col1: ['İRİNA ŞİŞMAN', 'RABİA ATEŞ', 'DENİZ UÇAR', 'YUSUF BARAN KARTAL']
  },

  // ==================== SAYFA 5: MAYIS ====================
  {
    tarih: '2026-05-04',
    ay: 'Mayıs',
    sehir: 'İSTANBUL',
    kategori: 'WTA 125',
    tesis: 'TTF İSTİNYE',
    assRef: 'ALAADDİN BOYAR',
    refRole: 'REF',
    hakemSefi: 'SONER SİVRİ',
    col1: ['ESİN KIRATLI', 'BAHAR AÇAR'],
    col1Note: 'WTA',
    col3: ['İLKER ÖRT', 'ANA STİH'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-05-04',
    ay: 'Mayıs',
    sehir: 'İSTANBUL',
    kategori: 'ITF J60',
    tesis: 'TED',
    supervisor: 'ERKAN TARHAN',
    col1: ['GÖKÇE SUMER', 'FERHAT KILIÇ', 'İSMAİL ATAKER', 'ATAKAN DÜRÜST']
  },
  {
    tarih: '2026-05-11',
    ay: 'Mayıs',
    sehir: 'İZMİR',
    kategori: 'ITF J30',
    tesis: 'EPHESUS CUP ALTIN RAKET TENİS KULÜBÜ',
    supervisor: 'MURAT AYKAÇ',
    col1: ['NESLİHAN VURUŞKAN', 'CEM ZEYBEK', 'YİĞİT DERE', 'AYLİN GÜLER']
  },
  {
    tarih: '2026-05-11',
    ay: 'Mayıs',
    sehir: 'ADANA',
    kategori: 'TE -U14&U',
    tesis: 'ATDSK',
    supervisor: 'İSMAİL KURTGÖZ',
    col1: ['DİLA NAZ PAMUK', 'ALİ KEKEÇ', 'MURAT ASLANTAŞ', 'VOLKAN AKBAŞ']
  },
  {
    tarih: '2026-05-18',
    ay: 'Mayıs',
    sehir: 'KAYSERİ',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY KAYSERİ',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['OZAN TURHAN', 'ALİ FURKAN CANLI', 'HALİL İBRAHİM ŞAHİN', 'GÜVEN ÇELİK', 'ALİ ŞENER'],
    col1Note: 'SALI-CUMA',
    col3: ['SERKAN ALPER BAŞER', 'DİLEK AKDİLEK', 'SAKİNE DOĞAN', 'DOĞA ECE ENGİN', 'OSMAN YAMAN', 'KORAY POLAT'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-05-18',
    ay: 'Mayıs',
    sehir: 'İSTANBUL',
    kategori: 'ATP CHALLENGER',
    tesis: 'TTF İSTİNYE',
    hakemSefi: 'MEHMET ALİ AKYÜZ',
    assRef: 'İLKER ÖRT',
    refRole: 'REF',
    col1: ['SONER SİVRİ', 'VLAD ZDRENTU', 'YÜKSEL SÜVARİ'],
    col1Note: 'ATP',
    col3: ['FEDERICA SIMONGINI', 'ELHAD HASSANA', 'AHMET YAZICI'],
    col3Note: 'ATP 75'
  },
  {
    tarih: '2026-05-25',
    ay: 'Mayıs',
    sehir: 'KAYSERİ',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY KAYSERİ',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['AHMET YAZICI', 'İSMAİL KURTGÖZ', 'ALİ FURKAN CANLI', 'ABDERAHİM KEFİ', 'OSMAN YAMAN'],
    col1Note: 'SALI-CUMA',
    col3: ['MUSTAFA GÖKKAYA', 'ARMAN ALIJAGIC', 'DİLEK AKDİLEK', 'SAKİNE DOĞAN', 'ÖZGÜR KÖROĞLU', 'OZAN TURHAN'],
    col3Note: 'SALI-PERŞEMBE'
  },

  // ==================== SAYFA 6 (ÜST): HAZİRAN ====================
  {
    tarih: '2026-06-01',
    ay: 'Haziran',
    sehir: 'KAYSERİ',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY KAYSERİ',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['YUSUF GÜZEL', 'ARMAN ALIJAGIC', 'ALİ KEKEÇ', 'SAKİNE DOĞAN', 'DOĞA ECE ENGİN'],
    col1Note: 'SALI-CUMA',
    col3: ['TOMA KEVKHIVILİ', 'SERKAN ALPER BAŞER', 'AHMET YAZICI', 'OZAN TURHAN', 'ALONA GÜRSEL', 'HALİL İBRAHİM ŞAHİN'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-06-08',
    ay: 'Haziran',
    sehir: 'KAYSERİ',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY KAYSERİ',
    supervisor: 'İLKER ÖRT',
    col1: ['TOMA KEVKHIVILİ', 'İSMAİL KURTGÖZ', 'EDUARDO ORDIERES', 'SAKİNE DOĞAN', 'HALİL İBRAHİM ŞAHİN'],
    col1Note: 'SALI-CUMA',
    col3: ['AHMET YAZICI', 'MUSTAFA GÖKKAYA', 'MURAT AYKAÇ', 'KORAY POLAT', 'KAMİL AYNA', 'ALONA GÜRSEL'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-06-08',
    ay: 'Haziran',
    sehir: 'İZMİR',
    kategori: 'MT200',
    tesis: 'KÜLTÜRPARK TENİS KULÜBÜ',
    supervisor: 'ÇETİN KESİCİ',
    col1: ['ESİN TÜRKER', 'ESRA AK', 'EGE ALTAY DÜZYOL', 'YEŞİM İZGÜBURLAS']
  },
  {
    tarih: '2026-06-15',
    ay: 'Haziran',
    sehir: 'KAYSERİ',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY KAYSERİ',
    supervisor: 'İLKER ÖRT',
    col1: ['ALİ FURKAN CANLI', 'OZAN TURHAN', 'ATAKAN DÜRÜST', 'KORAY POLAT', 'ALİ KEKEÇ'],
    col1Note: 'SALI-CUMA',
    col3: ['MURAT AYKAÇ', 'FIRAT KÖKVER', 'SAKİNE DOĞAN', 'GÜVEN ÇELİK', 'HALİL İBRAHİM ŞAHİN', 'EDUARDO ORDIERES'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-06-20',
    ay: 'Haziran',
    sehir: 'İSTANBUL',
    kategori: 'MT400',
    tesis: 'TTF İSTİNYE',
    supervisor: 'ERKAN TARHAN',
    col1: ['ÖNDER UĞUR HATİPOĞLU', 'EMİNE YILMAZ', 'RABİA ATEŞ', 'İRİNA ŞİŞMAN']
  },
  {
    tarih: '2026-06-22',
    ay: 'Haziran',
    sehir: 'KAYSERİ',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY KAYSERİ',
    supervisor: 'İLKER ÖRT',
    col1: ['DİLEK AKDİLEK', 'AHMET YAZICI', 'DOĞA ECE ENGİN', 'ALONA GÜRSEL', 'OZAN TURHAN'],
    col1Note: 'SALI-CUMA',
    col3: ['MURAT AYKAÇ', 'MEHMET ALİ AKYÜZ', 'SAKİNE DOĞAN', 'KORAY POLAT', 'GÜVEN ÇELİK', 'ALİ KEKEÇ'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-06-22',
    ay: 'Haziran',
    sehir: 'ANKARA',
    kategori: 'TE -U14&U',
    tesis: 'ANKARA TENİS KULÜBÜ',
    supervisor: 'SONER SİVRİ',
    col1: ['HALİL İBRAHİM ŞAHİN', 'SAVAŞ AKKOYUN', 'SEDA SERAP YALVAÇ', 'KAMİL AYNA']
  },
  {
    tarih: '2026-06-29',
    ay: 'Haziran',
    sehir: 'KAYSERİ',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY KAYSERİ',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['YUSUF GÜZEL', 'OZAN TURHAN', 'OSMAN YAMAN', 'SAKİNE DOĞAN', 'KEREM ATA'],
    col1Note: 'SALI-CUMA',
    col3: ['CEM ÇAĞLAR', 'MURAT AYKAÇ', 'ALONA GÜRSEL', 'ABDERAHİM KEFİ', 'ALİ KEKEÇ'],
    col3Note: 'SALI-PERŞEMBE'
  },

  // ==================== SAYFA 6 (ALT): TEMMUZ ====================
  {
    tarih: '2026-07-06',
    ay: 'Temmuz',
    sehir: 'İSTANBUL',
    kategori: 'MT200',
    tesis: 'INVENTIST ACADEMY',
    supervisor: 'DİLEK AKDİLEK',
    col1: ['RABİA ATEŞ', 'İRİNA ŞİŞMAN', 'DENİZ UÇAR']
  },
  {
    tarih: '2026-07-13',
    ay: 'Temmuz',
    sehir: 'İSTANBUL',
    kategori: 'WTA 125',
    tesis: 'ENKA',
    assRef: 'ALAADDİN BOYAR',
    refRole: 'REF',
    hakemSefi: 'SONER SİVRİ',
    col1: ['ESİN KIRATLI', 'DİLEK AKDİLEK'],
    col1Note: 'WTA',
    col3: ['FIRAT KÖKVER', 'ANA STİH'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-07-13',
    ay: 'Temmuz',
    sehir: 'İZMİR',
    kategori: 'ITF J30',
    tesis: 'KÜLTÜRPARK TENİS KULÜBÜ',
    supervisor: 'HÜSNÜ KAZLI',
    col1: ['ÇETİN ALTINÇINAR', 'NESLİHAN VURUŞKAN', 'YİĞİT DERE', 'MUSTAFA HAKAN ÇETİN']
  },
  {
    tarih: '2026-07-20',
    ay: 'Temmuz',
    sehir: 'MUĞLA',
    kategori: 'TE -U16&U',
    tesis: 'OLIVE FARM CUP',
    supervisor: 'MEHMET ALİ AKYÜZ',
    col1: ['ADNAN ÖZERDİK', 'ESRA AK', 'OSMAN YAMAN', 'SEÇİL GÖÇEN']
  },
  {
    tarih: '2026-07-23',
    tarihEtiket: '23 -26 TEMMUZ',
    ay: 'Temmuz',
    sehir: 'İSTANBUL',
    kategori: '12&U BOYS - GIRLS SUMMER CUP',
    tesis: 'GLOBAL SK',
    supervisor: 'ERKAN TARHAN',
    col1: [
      'YUSUF BAĞCI',
      'FERHAT KILIÇ',
      'İRİNA ŞİŞMAN',
      'ELÇİN YENİOĞLU',
      'YUSUF ÇEVİK',
      'RABİA ATEŞ',
      'GÖKÇE SUMER',
      'MUHAMMED FURKAN BALOĞULLARI'
    ]
  },
  {
    tarih: '2026-07-23',
    tarihEtiket: '23 -26 TEMMUZ',
    ay: 'Temmuz',
    sehir: 'ANKARA',
    kategori: '18&U GIRLS SUMMER CUP',
    tesis: 'TTF ANKARA KAMP VE EĞİTİM TESİSLERİ',
    supervisor: 'SONER SİVRİ',
    col1: ['CEM ÇAĞLAR', 'CEM SALMAN', 'SEDA SERAP YALVAÇ', 'ALİ EREN ESKİOCAK']
  },
  {
    tarih: '2026-07-23',
    tarihEtiket: '23 -26 TEMMUZ',
    ay: 'Temmuz',
    sehir: 'ANKARA',
    kategori: '18&U BOYS SUMMER CUP',
    tesis: 'TTF ANKARA',
    supervisor: 'SONER SİVRİ',
    col1: ['HALİL İBRAHİM ŞAHİN', 'KORAY POLAT', 'SELİN NUR DÖLEK', 'SAVAŞ AKKOYUN']
  },
  {
    tarih: '2026-07-27',
    ay: 'Temmuz',
    sehir: 'SAMSUN',
    kategori: 'ATP CHALLENGER',
    tesis: 'GREEN TENNIS & GOLF CLUB',
    hakemSefi: 'ATAKAN DÜRÜST',
    assRef: 'İLKER ÖRT',
    refRole: 'REF',
    col1: ['SONER SİVRİ', 'JASIM AKAKAH'],
    col1Note: 'ATP',
    col3: ['FIRAT KÖKVER', 'MUSTAFA GÖKKAYA', 'CEM ÇAĞLAR'],
    col3Note: 'ATP 50'
  },

  // ==================== SAYFA 7 (ÜST): AĞUSTOS ====================
  {
    tarih: '2026-08-03',
    ay: 'Ağustos',
    sehir: 'İSTANBUL',
    kategori: 'ATP CHALLENGER',
    tesis: 'ENKA',
    hakemSefi: 'MEHMET ALİ AKYÜZ',
    assRef: 'ALAADDİN BOYAR',
    refRole: 'REF',
    col1: ['SONER SİVRİ', 'ROBIN LAMBOURS', 'FIRAT KÖKVER'],
    col1Note: 'ATP',
    col3: ['İLKER ÖRT', 'OZAN TURHAN'],
    col3Note: 'ATP 75'
  },
  {
    tarih: '2026-08-03',
    ay: 'Ağustos',
    sehir: 'İSTANBUL',
    kategori: 'ITF J100',
    tesis: 'GLOBAL SK',
    supervisor: 'TBA',
    col1: ['İSMAİL ATAKER', 'YUSUF ÇEVİK', 'YUSUF BAĞCI', 'NİHAT SEYREK']
  },
  {
    tarih: '2026-08-03',
    ay: 'Ağustos',
    sehir: 'İSTANBUL',
    kategori: 'TE -U16&U',
    tesis: 'TED LEYLA & İHAP SUBAŞI CUP',
    supervisor: 'TBA',
    col1: ['M. FURKAN ERCİŞLİ', 'OSMAN YAMAN', 'ATAKAN DÜRÜST', 'ÖNDER UĞUR HATİPOĞLU', 'YUSUF BARAN KARTAL']
  },
  {
    tarih: '2026-08-10',
    ay: 'Ağustos',
    sehir: 'İSTANBUL',
    kategori: 'ITF J100',
    tesis: 'GLOBAL SK',
    supervisor: 'TBA',
    col1: ['YÜKSEL SÜVARİ', 'DOĞA ECE ENGİN', 'İSMAİL ATAKER', 'DİLEK AKDİLEK']
  },
  {
    tarih: '2026-08-17',
    ay: 'Ağustos',
    sehir: 'ANKARA',
    kategori: 'TE -U14&U',
    tesis: 'TOPSPIN TENİS KULÜBÜ',
    supervisor: 'MURAT AYKAÇ',
    col1: ['SAVAŞ AKKOYUN', 'KAMİL AYNA', 'HALİL İBRAHİM ŞAHİN', 'CENGİZ AYDIN']
  },
  {
    tarih: '2026-08-17',
    ay: 'Ağustos',
    sehir: 'İSTANBUL',
    kategori: 'ITF J30',
    tesis: 'GLOBAL SK',
    supervisor: 'ERKAN TARHAN',
    col1: ['FERHAT KILIÇ', 'GÖKÇE SUMER', 'ALİ FARUK', 'ELÇİN YENİOĞLU']
  },
  {
    tarih: '2026-08-17',
    ay: 'Ağustos',
    sehir: 'İSTANBUL',
    kategori: 'TE -U16&U',
    tesis: 'SADİ GÜLÇELİK CUP / ENKA',
    supervisor: 'DİLEK AKDİLEK',
    col1: ['OSMAN YAMAN', 'BURAK ULAŞ', 'YUSUF BARAN KARTAL', 'ATAKAN DÜRÜST']
  },
  {
    tarih: '2026-08-22',
    ay: 'Ağustos',
    sehir: 'ANTALYA',
    kategori: 'MT200',
    tesis: 'ROBINSON ÇAMYUVA',
    supervisor: 'MEHMET ALİ AKYÜZ'
  },
  {
    tarih: '2026-08-24',
    ay: 'Ağustos',
    sehir: 'AYDIN',
    kategori: 'MT200',
    tesis: 'ENGIN ARSLAN TENIS KULUBU',
    supervisor: 'HÜSNÜ KAZLI',
    col1: ['MUSTAFA ARAL', 'ŞAHİN AKIN']
  },
  {
    tarih: '2026-08-27',
    ay: 'Ağustos',
    sehir: 'ANTALYA',
    kategori: 'MT200',
    tesis: 'ROBINSON ÇAMYUVA',
    supervisor: 'MEHMET ALİ AKYÜZ'
  },

  // ==================== SAYFA 7 (ALT): EYLÜL ====================
  {
    tarih: '2026-09-05',
    ay: 'Eylül',
    sehir: 'İSTANBUL',
    kategori: 'MT700',
    tesis: 'MATRIX OPTIMUM ISTANBUL',
    supervisor: 'DİLEK AKDİLEK',
    col1: ['EMİNE YILMAZ', 'İRİNA ŞİŞMAN', 'RABİA ATEŞ', 'DENİZ UÇAR']
  },
  {
    tarih: '2026-09-07',
    ay: 'Eylül',
    sehir: 'ANTALYA',
    kategori: 'WTA 125',
    tesis: 'ATİK',
    assRef: 'ALAADDİN BOYAR',
    refRole: 'REF',
    hakemSefi: 'SONER SİVRİ',
    col1: ['ANA STİH', 'MURAT AYKAÇ'],
    col1Note: 'WTA',
    col3: ['MILICA SAVIC', 'YUSUF GÜZEL'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-09-07',
    ay: 'Eylül',
    sehir: 'İSTANBUL',
    kategori: 'ATP CHALLENGER',
    tesis: 'TED',
    hakemSefi: 'ATAKAN DÜRÜST',
    assRef: 'ERKAN TARHAN',
    refRole: 'REF',
    col1: ['FIRAT KÖKVER', 'SAMAN HASANI', 'OZAN TURHAN'],
    col1Note: 'ATP',
    col3: ['AHMETD HASHEM', 'ALİ FURKAN CANLI'],
    col3Note: 'ATP 75'
  },
  {
    tarih: '2026-09-07',
    ay: 'Eylül',
    sehir: 'İZMİR',
    kategori: 'TE -U14&U',
    tesis: 'EPHESUS CUP ALTIN RAKET TENİS KULÜBÜ',
    supervisor: 'HÜSNÜ KAZLI',
    col1: ['TAMER AKPINAR', 'NESLİHAN VURUŞKAN', 'CEM ZEYBEK', 'MUSTAFA HAKAN ÇETİN']
  },
  {
    tarih: '2026-09-14',
    ay: 'Eylül',
    sehir: 'KAYSERİ',
    kategori: 'TE -U14&U',
    tesis: 'ERCIYES CUP',
    supervisor: 'İSMAİL KURTGÖZ',
    col1: ['ÇAĞATAY TUTAR', 'SELİN NUR DÖLEK', 'HALİL İBRAHİM ŞAHİN', 'ESRA AK']
  },
  {
    tarih: '2026-09-21',
    ay: 'Eylül',
    sehir: 'ANKARA',
    kategori: 'WTA 125',
    tesis: 'TOPSPIN TENİS KULÜBÜ',
    assRef: 'PATRICK MCSTEIN',
    refRole: 'REF',
    hakemSefi: 'MANUEL WEIS',
    col1: ['FIRAT KÖKVER', 'CEM ÇAĞLAR'],
    col1Note: 'WTA',
    col3: ['ADEL SULAMAN', 'MEHMET ALİ AKYÜZ'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-09-21',
    ay: 'Eylül',
    sehir: 'ANTALYA',
    kategori: 'MT200',
    tesis: 'TENNIS CLUB KASTALIA',
    supervisor: 'HÜSNÜ KAZLI',
    col1: ['NERMİN AÇAR', 'İHSAN AÇAR']
  },
  {
    tarih: '2026-09-21',
    ay: 'Eylül',
    sehir: 'ŞIRNAK',
    kategori: 'TE -U14&U',
    tesis: 'CUDİ CUP',
    supervisor: 'HÜSNÜ KAZLI',
    col1: ['ALİ KEKEÇ', 'SAKİNE DOĞAN', 'GİZEM SIRAL', 'ERKAN ALAÇAM']
  },
  {
    tarih: '2026-09-21',
    ay: 'Eylül',
    sehir: 'İZMİR',
    kategori: 'MT200',
    tesis: 'ALAÇATI TENİS KULÜBÜ',
    supervisor: 'DİLEK AKDİLEK',
    col1: ['CANDAN AKYOL', 'MUSTAFA HAKAN ÇETİN']
  },
  {
    tarih: '2026-09-28',
    ay: 'Eylül',
    sehir: 'ADANA',
    kategori: 'WTA 125',
    tesis: 'ATDSK',
    assRef: 'ALAADDİN BOYAR',
    refRole: 'REF',
    hakemSefi: 'SONER SİVRİ',
    col1: ['FIRAT KÖKVER', 'İSMAİL KURTGÖZ'],
    col1Note: 'WTA',
    col3: ['ESİN KIRATLI', 'MUSTAFA GÖKKAYA'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-09-28',
    ay: 'Eylül',
    sehir: 'ANTALYA',
    kategori: 'MT400',
    tesis: 'ATİK',
    supervisor: 'MURAT AYKAÇ',
    col1: ['ALİ GÜRSEL', 'ALONA GÜRSEL', 'NERMİN AÇAR']
  },
  {
    tarih: '2026-09-28',
    ay: 'Eylül',
    sehir: 'İSTANBUL',
    kategori: 'ITF J200',
    tesis: 'GLOBAL SK',
    supervisor: 'ERKAN TARHAN',
    col1: ['YUNUS TOLUNAY EREN', 'OSMAN YAMAN', 'FERHAT KILIÇ', 'YUSUF ÇEVİK']
  },
  {
    tarih: '2026-09-28',
    ay: 'Eylül',
    sehir: 'ERZİNCAN',
    kategori: 'TE -U14&U',
    tesis: 'ERGAN CUP - ERZİNCAN',
    supervisor: 'MEHMET ALİ AKYÜZ',
    col1: ['GÜVEN ÇELİK', 'KORAY POLAT', 'VOLKAN İCİK', 'ÖNDER UĞUR HATİPOĞLU']
  },

  // ==================== SAYFA 8: EKİM ====================
  {
    tarih: '2026-10-05',
    ay: 'Ekim',
    sehir: 'SAMSUN',
    kategori: 'WTA 125',
    tesis: 'GREEN TENNIS & GOLF CLUB',
    assRef: 'İLKER ÖRT',
    refRole: 'REF',
    hakemSefi: 'MUSTAFA GÖKKAYA',
    col1: ['ANA STİH', 'DİLEK AKDİLEK'],
    col1Note: 'WTA',
    col3: ['ESİN KIRATLI', 'BAHAR AÇAR'],
    col3Note: 'WTA 125'
  },
  {
    tarih: '2026-10-05',
    ay: 'Ekim',
    sehir: 'BURSA',
    kategori: 'ITF J30',
    tesis: 'YENİGÜN TENİS AKADEMİ',
    supervisor: 'AHMET SERT',
    col1: ['HAYRETTİN SEVER', 'AHMET İÇÖZ', 'SEDA BALSAÇ KOZ', 'KEREM ATA']
  },
  {
    tarih: '2026-10-05',
    ay: 'Ekim',
    sehir: 'İSTANBUL',
    kategori: 'TE -U14&U',
    tesis: 'INVENTIST ACADEMY',
    supervisor: 'YUNUS TOLUNAY EREN',
    col1: ['İRİNA ŞİŞMAN', 'RABİA ATEŞ', 'MEHMET KIVIR', 'ELÇİN YENİOĞLU']
  },
  {
    tarih: '2026-10-05',
    ay: 'Ekim',
    sehir: 'SAMSUN',
    kategori: 'MT400',
    tesis: 'SAMSUN TENİS KULÜBÜ',
    supervisor: 'HÜSNÜ KAZLI',
    col1: ['MURAT ÇOLAKOĞLU', 'ZİYA SÖYLER', 'CEM TURAN']
  },
  {
    tarih: '2026-10-12',
    ay: 'Ekim',
    sehir: 'İSTANBUL',
    kategori: 'ITF J30',
    tesis: 'TAÇ SPOR KULÜBÜ',
    supervisor: 'ERKAN TARHAN',
    col1: ['FERHAT KILIÇ', 'M. FURKAN ERCİŞLİ', 'OSMAN YAMAN', 'İSMAİL ATAKER']
  },
  {
    tarih: '2026-10-12',
    ay: 'Ekim',
    sehir: 'ANTALYA',
    kategori: 'MT700',
    tesis: 'CLUB ALİBEY',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['DİLEK AKDİLEK', 'DİLA NAZ PAMUK', 'EDA DALANÇIKAR', 'BİRCAN KUMRU'],
    col2: ['SELİN NUR DÖLEK', 'ALONA GÜRSEL', 'SAKİNE DOĞAN'],
    col3: ['ADNAN ÖZERDİK', 'AHMET YAZICI', 'GÜVEN ÇELİK']
  },
  {
    tarih: '2026-10-19',
    ay: 'Ekim',
    sehir: 'MUĞLA',
    kategori: 'MT200',
    tesis: 'OLIVE FARM CUP',
    supervisor: 'YUNUS TOLUNAY EREN',
    col1: ['ALİ ŞENER', 'ŞEBNEM CAN TEKİN']
  },
  {
    tarih: '2026-10-19',
    ay: 'Ekim',
    sehir: 'ADANA',
    kategori: 'TE -U14&U',
    tesis: 'IN OR OUT CUP',
    supervisor: 'İSMAİL KURTGÖZ',
    col1: ['EFE TAPÇI', 'GÖKHAN PAMUK', 'TÜLAY TAPÇI', 'MURAT CEM TOK']
  },
  {
    tarih: '2026-10-26',
    ay: 'Ekim',
    sehir: 'İSTANBUL',
    kategori: 'W35 CUMHURİYET KIZLARI',
    tesis: 'TED SPOR KULÜBÜ',
    supervisor: 'ALAADDİN BOYAR',
    hakemSefi: 'AHMET SERT',
    col1: ['EYLÜL BENLİ', 'YÜKSEL SÜVARİ', 'M. FURKAN ERCİŞLİ'],
    col3: ['FIRAT KÖKVER', 'DİLEK AKDİLEK', 'AHMET YAZICI']
  },
  {
    tarih: '2026-10-26',
    ay: 'Ekim',
    sehir: 'ANTALYA',
    kategori: 'European Club Championships (30-50)',
    tesis: 'MEGASARAY',
    supervisor: 'WERNER HOTZIGER',
    hakemSefi: 'SONER SİVRİ',
    assRef: 'MURAT AYKAÇ',
    col1: ['OSMAN YAMAN', 'AHMET İÇÖZ', 'ERKAN TARHAN'],
    col2: ['GÜVEN ÇELİK', 'HAYRETTİN SEVER', 'MERTOL AKSUNGUR'],
    col3: ['GÖKÇE SUMER', 'SEHER CANLI']
  },
  {
    tarih: '2026-10-26',
    ay: 'Ekim',
    sehir: 'ANTALYA',
    kategori: 'MT200',
    tesis: 'ROBINSON ÇAMYUVA',
    supervisor: 'TUFAN TERCAN',
    col1: ['ÇİĞDEM ÖZSOY', 'HALE BOZKURT']
  },

  // ==================== SAYFA 9: KASIM ====================
  {
    tarih: '2026-11-02',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'VESSELINA DONEVA',
    col1: ['ERKAN TARHAN', 'SERKAN ALPER BAŞER', 'DOĞA ECE ENGİN', 'ALONA GÜRSEL', 'GONCA YAĞIŞAN'],
    col1Note: 'SALI-CUMA',
    col3: ['KADRİYE TÜKENMEZ', 'YUSUF GÜZEL', 'GÜVEN ÇELİK', 'DİLA NAZ PAMUK', 'GÖKHAN PAMUK', 'OSMAN YAMAN'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-11-02',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'European Club Championships (55-70)',
    tesis: 'MEGASARAY',
    supervisor: 'WERNER HOTZIGER',
    assRef: 'MEHMET ALİ AKYÜZ',
    col1: ['AYLİN GÜLER', 'HÜSEYİN EGE MERİÇ', 'ATAKAN DÜRÜST'],
    col2: ['CEM ZEYBEK', 'ÖNDER UĞUR HATİPOĞLU', 'ELİF HERGÜNVARIM'],
    col3: ['YUSUF ÇEVİK', 'EGE ALTAY DÜZYOL']
  },
  {
    tarih: '2026-11-02',
    ay: 'Kasım',
    sehir: 'İSTANBUL',
    kategori: 'TE -U12&U',
    tesis: 'SPORTPLUS',
    supervisor: 'DİLEK AKDİLEK',
    col1: ['RABİA ATEŞ', 'İRİNA ŞİŞMAN', 'İSMAİL ATAKER', 'YUSUF BAĞCI']
  },
  {
    tarih: '2026-11-02',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'TE -U14&U',
    tesis: 'ATİK',
    supervisor: 'MURAT AYKAÇ',
    col1: ['GÜLDEN ŞAHİN', 'EMRE ANLI', 'GONCA YAĞIŞAN', 'MÜCAHİT BAYIRKÖYLÜ']
  },
  {
    tarih: '2026-11-02',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'MT200',
    tesis: 'ROBINSON ÇAMYUVA',
    supervisor: 'TUFAN TERCAN',
    col1: ['HALE BOZKURT']
  },
  {
    tarih: '2026-11-08',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'WORLD TEAM CHAMPIONSHIPS (60-65-70)',
    tesis: '-',
    supervisor: 'İLKER ÖRT',
    assRef: 'ALAADDİN BOYAR',
    col1: [
      'MEHMET ALİ AKYÜZ',
      'MERTOL AKSUNGUR',
      'KEREM ATA',
      'CEM ZEYBEK',
      'SEDA SERAP YALVAÇ',
      'SELİNAY ESRA YAĞCI',
      'GONCA YAĞIŞAN',
      'BİRCAN KUMRU'
    ],
    col2: [
      'HÜSNÜ KAZLI',
      'MURAT AYKAÇ',
      'GÖKÇE SUMER',
      'ERHAN UYGUN',
      'DENİZ ÖZBEN',
      'CENGİZ AYDIN',
      'ERKAN ALAÇAM',
      'MAHMUT YİĞİT'
    ],
    col3: [
      'ALKAN ÇELİK',
      'BİROL KASAPOĞLU',
      'HAYRETTİN SEVER',
      'SELİN EVİN',
      'YELİZ YÜKSEL',
      'ALİ EREN ESKİOCAK',
      'YİĞİT DERE',
      'SEMRA GÜLAY'
    ]
  },
  {
    tarih: '2026-11-09',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'VESSELINA DONEVA',
    col1: ['ÇETİN KESİCİ', 'FIRAT KÖKVER', 'DOĞA ECE ENGİN', 'ALONA GÜRSEL', 'ALİ KEKEÇ'],
    col1Note: 'SALI-CUMA',
    col3: ['YUSUF GÜZEL', 'MUSTAFA GÖKKAYA', 'SERKAN ALPER BAŞER', 'GÜVEN ÇELİK', 'OSMAN YAMAN', 'ERKAN TARHAN'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-11-09',
    ay: 'Kasım',
    sehir: 'İSTANBUL',
    kategori: 'ITF J30',
    tesis: 'OPTİMUM',
    supervisor: 'YUNUS TOLUNAY EREN',
    col1: ['ÖNDER UĞUR HATİPOĞLU', 'ELÇİN YENİOĞLU', 'ATAKAN DÜRÜST', 'AZİZ ANBALAY']
  },
  {
    tarih: '2026-11-14',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'WORLD INDIVIDUAL CHAM.(60-65-70)',
    tesis: 'CLUB ALİBEY',
    supervisor: 'ALAADDİN BOYAR',
    assRef: 'İLKER ÖRT',
    col1: ['ERKAN TARHAN', 'HÜLYA GÜLER', 'MUSTAFA YALKI', 'OSMAN YAMAN', 'CEM ZEYBEK', 'EDA DALANÇIKAR'],
    col2: ['TUFAN TERCAN', 'ŞANSAL ÖZ', 'ADNAN ÖZERDİK', 'SELİN EVİN', 'BEYZA BAYIR', 'ELİF HERGÜNVARIM'],
    col3: ['FERHAT KILIÇ', 'BİROL KASAPOĞLU', 'FERDAT ŞARA', 'AYLİN GÜLER', 'SEHER CANLI', 'PINAR KOÇ']
  },
  {
    tarih: '2026-11-16',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'DANIELE MOROSSI',
    col1: ['AHMET YAZICI', 'ALONA GÜRSEL', 'ALİ KEKEÇ', 'ALİ EREN ESKİOCAK', 'SELİN NUR DÖLEK'],
    col1Note: 'SALI-CUMA',
    col3: ['DİLEK AKDİLEK', 'OZAN TURHAN', 'DOĞA ECE ENGİN', 'DENİZ GÖK', 'GÜVEN ÇELİK', 'YUSUF GÜZEL'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-11-16',
    ay: 'Kasım',
    sehir: 'ADANA',
    kategori: 'TE -U14&U',
    tesis: 'ATDSK',
    supervisor: 'İSMAİL KURTGÖZ',
    col1: ['GÖKHAN PAMUK', 'VOLKAN AKBAŞ', 'YUSUF ÇOPUR', 'MURAT ASLANTAŞ']
  },
  {
    tarih: '2026-11-16',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'MT400',
    tesis: 'TURGAY SOYSAL AKADEMİ',
    supervisor: 'MEHMET ALİ AKYÜZ',
    col1: ['KAZIM KOCA']
  },
  {
    tarih: '2026-11-23',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'SONER SİVRİ',
    col1: ['MEHMET ALİ AKYÜZ', 'SARA BAŞER', 'OSMAN YAMAN', 'AHMET YAZICI', 'DİLEK AKDİLEK'],
    col1Note: 'SALI-CUMA',
    col3: ['SAKİNE DOĞAN', 'ALİ KEKEÇ', 'OZAN TURHAN', 'GÜVEN ÇELİK', 'DİLA NAZ PAMUK', 'ÖNDER UĞUR HATİPOĞLU'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-11-23',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'ITF J60',
    tesis: 'MEGASARAY',
    supervisor: 'MURAT AYKAÇ',
    col1: ['VOLKAN İCİK', 'HELEN GİZİR', 'CEM ZEYBEK', 'ADNAN ÖZERDİK']
  },
  {
    tarih: '2026-11-23',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'MT1000',
    tesis: 'CLUB ALİBEY',
    supervisor: 'ALAADDİN BOYAR',
    assRef: 'TUFAN TERCAN',
    col1: ['ATAKAN DÜRÜST', 'BİRCAN KUMRU', 'RABİA ATEŞ'],
    col2: ['CANDAN AKYOL', 'HÜLYA GÜLER', 'İRİNA ŞİŞMAN'],
    col3: ['OSMAN YAMAN', 'ALONA GÜRSEL', 'EVREN SOYTOK']
  },
  {
    tarih: '2026-11-23',
    ay: 'Kasım',
    sehir: 'İSTANBUL',
    kategori: 'TE -U14&U',
    tesis: 'SOUL',
    supervisor: 'FERHAT KILIÇ',
    col1: ['YUSUF ÇEVİK', 'GÖKÇE SUMER', 'ELÇİN YENİOĞLU', 'İSMAİL ATAKER']
  },
  {
    tarih: '2026-11-23',
    ay: 'Kasım',
    sehir: 'ANKARA',
    kategori: 'ATP CHALLENGER',
    tesis: 'ATAK PRO',
    hakemSefi: 'ERKAN TARHAN',
    assRef: 'İLKER ÖRT',
    refRole: 'REF',
    col1: ['FIRAT KÖKVER', 'MUSTAFA GÖKKAYA'],
    col1Note: 'ATP',
    col3: ['CHIARA CASULA', 'YÜKSEL SÜVARİ', 'CEM ÇAĞLAR'],
    col3Note: 'ATP 75'
  },
  {
    tarih: '2026-11-30',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'İLKER ÖRT',
    col1: ['OZAN TURHAN', 'SARA BAŞER', 'ALAADDİN BOYAR', 'ALİ EREN ESKİOCAK', 'DİLA NAZ PAMUK'],
    col1Note: 'SALI-CUMA',
    col3: ['EXCHANGE', 'EXCHANGE', 'OSMAN YAMAN', 'SAKİNE DOĞAN', 'KEREM ATA', 'ALONA GÜRSEL'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-11-30',
    ay: 'Kasım',
    sehir: 'ANTALYA',
    kategori: 'ITF J100',
    tesis: 'MEGASARAY',
    supervisor: 'CEM ÇAĞLAR',
    col1: ['GÜVEN ÇELİK', 'KAMİL AYNA', 'DOĞA ECE ENGİN', 'SEDA SERAP YALVAÇ']
  },

  // ==================== SAYFA 10: ARALIK ====================
  {
    tarih: '2026-12-07',
    ay: 'Aralık',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'SERDAR SUMER',
    col1: ['ÇETİN KESİCİ', 'SAKİNE DOĞAN', 'DOĞA ECE ENGİN', 'GÜVEN ÇELİK', 'ALİ KEKEÇ'],
    col1Note: 'SALI-CUMA',
    col3: ['ALAADDİN BOYAR', 'MUSTAFA GÖKKAYA', 'SERKAN ALPER BAŞER', 'ALİ EREN ESKİOCAK', 'KAMİL AYNA', 'FIRAT KÖKVER'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-12-14',
    ay: 'Aralık',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'İLKER ÖRT',
    col1: ['SERKAN ALPER BAŞER', 'DİLEK AKDİLEK', 'MEHMET ALİ AKYÜZ', 'İSMAİL KURTGÖZ', 'MUSTAFA GÖKKAYA', 'DİLA NAZ PAMUK'],
    col1Note: 'SALI-CUMA',
    col3: ['ALİ KEKEÇ', 'YUSUF GÜZEL', 'ALAADDİN BOYAR', 'ÇETİN KESİCİ', 'KAMİL AYNA'],
    col3Note: 'SALI-PERŞEMBE'
  },
  {
    tarih: '2026-12-21',
    ay: 'Aralık',
    sehir: 'ANTALYA',
    kategori: '15K COMBINED',
    tesis: 'MEGASARAY',
    supervisor: 'ALAADDİN BOYAR',
    col1: ['MEHMET ALİ AKYÜZ', 'AHMET YAZICI', 'OSMAN YAMAN', 'GÜVEN ÇELİK', 'GÖKHAN PAMUK'],
    col1Note: 'SALI-CUMA',
    col3: ['CEM ÇAĞLAR', 'ALONA GÜRSEL', 'YUSUF GÜZEL', 'KAMİL AYNA', 'ALİ KEKEÇ', 'TBA'],
    col3Note: 'SALI-PERŞEMBE'
  }
];

export function generateInitialAssignments(): Atama[] {
  const refMap = new Map<string, RefSeed>();
  REFEREES_CATALOG.forEach(r => refMap.set(r.hakem.toUpperCase(), r));

  const atamalar: Atama[] = [];
  let currentId = 1;

  const pushRecord = (
    t: PdfTournamentDef,
    hakem: string,
    gorev: string,
    colTag?: string,
    extraNote?: string
  ) => {
    const cleanName = hakem.trim().toUpperCase();
    const seed = refMap.get(cleanName);
    const isPlaceholder = PLACEHOLDER_NAMES.has(cleanName);
    const noteParts = [colTag, extraNote].filter(Boolean);

    let durum: Atama['durum'] = 'ONAYLANDI';
    if (t.cancelled) {
      durum = 'İPTAL';
    } else if (isPlaceholder) {
      durum = 'BEKLEMEDE';
    }

    atamalar.push({
      id: currentId++,
      tarih: t.tarih,
      tarih_etiket: t.tarihEtiket,
      ay: t.ay,
      sehir: t.sehir,
      kategori: t.kategori,
      tesis: t.tesis,
      hakem: cleanName,
      gorev,
      hakem_sehir: seed?.sehir || (t.sehir !== 'BELİRTİLMEMİŞ' ? t.sehir : 'TÜRKİYE'),
      kokart_ref: seed?.ref_kokart || (isPlaceholder ? '-' : 'N'),
      kokart_chair: seed?.chair_kokart || (isPlaceholder ? '-' : 'N'),
      durum,
      notlar: noteParts.length > 0 ? noteParts.join(' · ') : undefined
    });
  };

  PDF_TOURNAMENTS.forEach(t => {
    const isAtp = t.kategori.toUpperCase().includes('ATP');
    const isWta = t.kategori.toUpperCase().includes('WTA');

    if (t.supervisor) {
      pushRecord(t, t.supervisor, 'SUPERVISOR', t.cancelled ? 'İPTAL' : undefined);
    }
    if (t.hakemSefi) {
      pushRecord(t, t.hakemSefi, 'HAKEM ŞEFİ', t.cancelled ? 'İPTAL' : undefined);
    }
    if (t.assRef) {
      pushRecord(t, t.assRef, t.refRole || 'ASS. REF.', t.cancelled ? 'İPTAL' : undefined);
    }

    (t.col1 || []).forEach(name => {
      const role = isAtp ? 'ATP' : isWta ? 'WTA' : 'HAKEM';
      pushRecord(t, name, role, 'SÜTUN:1', t.col1Note);
    });

    (t.col2 || []).forEach(name => {
      pushRecord(t, name, 'HAKEM', 'SÜTUN:2');
    });

    (t.col3 || []).forEach(name => {
      const role = isAtp ? 'ATP' : isWta ? 'WTA' : 'HAKEM';
      pushRecord(t, name, role, 'SÜTUN:3', t.col3Note);
    });
  });

  return atamalar;
}

export function buildRefereeProfiles(atamalar: Atama[]): RefereeInfo[] {
  const map = new Map<string, RefereeInfo>();

  atamalar.forEach(a => {
    // İptal edilmiş turnuva satırları ve TBA/EXCHANGE yer tutucuları aktif hakem istatistiğine katılmaz
    if (a.durum === 'İPTAL') return;

    const cleanName = (a.hakem || '').trim().toUpperCase();
    if (!cleanName || PLACEHOLDER_NAMES.has(cleanName)) return;

    if (!map.has(cleanName)) {
      map.set(cleanName, {
        hakem: cleanName,
        hakem_sehir: a.hakem_sehir || (a.sehir !== 'BELİRTİLMİŞ' ? a.sehir : 'TÜRKİYE') || 'TÜRKİYE',
        referee_badge: a.kokart_ref || 'N',
        chair_badge: a.kokart_chair || 'N',
        toplam_atama: 0,
        gorev_dagilimi: {},
        sehir_dagilimi: {},
        atamalar: []
      });
    }

    const ref = map.get(cleanName)!;
    ref.toplam_atama += 1;
    ref.gorev_dagilimi[a.gorev] = (ref.gorev_dagilimi[a.gorev] || 0) + 1;
    ref.sehir_dagilimi[a.sehir] = (ref.sehir_dagilimi[a.sehir] || 0) + 1;
    ref.atamalar.push(a);

    if (a.kokart_ref && (!ref.referee_badge || ref.referee_badge === '-')) {
      ref.referee_badge = a.kokart_ref;
    }
    if (a.kokart_chair && (!ref.chair_badge || ref.chair_badge === '-')) {
      ref.chair_badge = a.kokart_chair;
    }
  });

  return Array.from(map.values()).sort((a, b) => b.toplam_atama - a.toplam_atama);
}

const INITIAL_SEED_ASSIGNMENTS = generateInitialAssignments();
const ACTIVE_INITIAL_ASSIGNMENTS = INITIAL_SEED_ASSIGNMENTS.filter(a => a.durum !== 'İPTAL');
const INITIAL_SEED_PROFILES = buildRefereeProfiles(INITIAL_SEED_ASSIGNMENTS);
const ACTIVE_TOURNAMENT_KEYS = new Set(
  ACTIVE_INITIAL_ASSIGNMENTS.map(a => `${a.tarih}_${a.tesis}_${a.kategori}`)
);

export const METADATA_DEFAULT: MetadataInfo = {
  yil: 2026,
  toplam_aktif_atama: ACTIVE_INITIAL_ASSIGNMENTS.length,
  tekil_hakem_sayisi: INITIAL_SEED_PROFILES.length,
  toplam_turnuva_sayisi: ACTIVE_TOURNAMENT_KEYS.size,
  kaynak_dosya: '2026_Ocak-Aralik_Uluslararasi_Hakem_Atamalari.pdf',
  son_guncelleme: '2026-11-17'
};
