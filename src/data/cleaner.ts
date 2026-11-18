import * as XLSX from 'xlsx';
import { Atama, MetadataInfo } from '../types';

export interface CleanResult {
  records: Atama[];
  metadata: MetadataInfo;
  log: string[];
}

export async function cleanTtfFile(file: File): Promise<CleanResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: true });
  return processWorkbook(workbook, file.name);
}

export function processWorkbook(workbook: XLSX.WorkBook, fileName: string = 'Atama.xlsx'): CleanResult {
  const logs: string[] = [];
  logs.push(`Dosya açıldı: ${fileName}`);

  // 1. TÜM HAKEMLER sayfasından sözlük oluştur
  const hakemInfo: Record<string, { hakem_sehir: string; referee_badge: string; chair_badge: string }> = {};

  const tumHakemlerSheetName = workbook.SheetNames.find(s => 
    s.trim().toUpperCase() === 'TÜM HAKEMLER' || 
    s.trim().toUpperCase() === 'TUM HAKEMLER' ||
    s.trim().toUpperCase().includes('HAKEM')
  );

  if (tumHakemlerSheetName && workbook.Sheets[tumHakemlerSheetName]) {
    const rawHakemler: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[tumHakemlerSheetName], { defval: '' });
    rawHakemler.forEach((row) => {
      // Find key that contains HAKEM
      const hakemKey = Object.keys(row).find(k => k.trim().toUpperCase() === 'HAKEM') || 'HAKEM';
      const name = String(row[hakemKey] || '').trim();
      if (name && name !== 'nan' && name !== 'undefined' && name !== '0') {
        // Şehir.1 / Şehir
        const sehirKey = Object.keys(row).find(k => k.includes('Şehir') || k.includes('Sehir')) || 'Şehir.1';
        const refKey = Object.keys(row).find(k => k.includes('Referee')) || 'Referee.1';
        const chairKey = Object.keys(row).find(k => k.includes('Chair')) || 'Chair.1';

        hakemInfo[name] = {
          hakem_sehir: String(row[sehirKey] || '').trim(),
          referee_badge: String(row[refKey] || '').trim(),
          chair_badge: String(row[chairKey] || '').trim()
        };
      }
    });
    logs.push(`'TÜM HAKEMLER' sayfasından ${Object.keys(hakemInfo).length} hakem bilgisi yüklendi.`);
  } else {
    logs.push(`Uyarı: 'TÜM HAKEMLER' sayfası bulunamadı, mevcut veritabanı kullanılacak.`);
  }

  // 2. ATAMA TAKİP sayfası
  const atamaSheetName = workbook.SheetNames.find(s => 
    s.trim().toUpperCase() === 'ATAMA TAKİP' || 
    s.trim().toUpperCase() === 'ATAMA TAKIP' ||
    s.trim().toUpperCase().includes('ATAMA')
  ) || workbook.SheetNames[0];

  if (!atamaSheetName || !workbook.Sheets[atamaSheetName]) {
    throw new Error("Çalışma kitabında 'ATAMA TAKİP' sayfası bulunamadı!");
  }

  const atamaSheet = workbook.Sheets[atamaSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(atamaSheet, { header: 1, defval: null });
  logs.push(`'${atamaSheetName}' sayfasında ${rows.length} satır bulundu.`);

  // Metin tarihlerini standart tarihe çevirme sözlüğü
  const dateFixes: Record<string, [string, string]> = {
    "28 Şubat - 09 Mart ": ["2026-02-28", "Mart"],
    "28 Şubat - 09 Mart": ["2026-02-28", "Mart"],
    "23 -26 TEMMUZ": ["2026-07-23", "Temmuz"],
    "23 - 26 TEMMUZ": ["2026-07-23", "Temmuz"],
    "7 -14 Mart": ["2026-03-07", "Mart"],
    "7-14 Mart": ["2026-03-07", "Mart"],
    "14-21 Mart": ["2026-03-14", "Mart"]
  };

  const cleanedRecords: Atama[] = [];
  let recordCounter = 1;

  // Python: for idx in range(6, len(rows_t)):
  const startRowIdx = Math.min(6, rows.length - 1);

  for (let idx = startRowIdx; idx < rows.length; idx++) {
    const r = rows[idx];
    if (!r || r.length < 5) continue;

    const tarih = r[1];
    const kat = r[2];
    const tesis = r[3];
    const hakem = r[4];
    const gorev = r[5];
    const ay = r[8];

    // #REF! veya tamamen boş satırları atla
    if (String(tarih) === '#REF!' || String(hakem) === '#REF!') {
      continue;
    }

    // Özel düzeltme: 23.11.2026 Ankara ATP Challenger ATAK PRO (Satır 879-888)
    const tesisCheck = String(tesis || '').trim();
    if (idx >= 878 && tesisCheck === 'ATAK PRO') {
      continue; // Bu bloğu aşağıda tam ve doğru haliyle ekleyeceğiz
    }

    // Hakem 0 veya boş ise atla
    if (!hakem || hakem === 0 || hakem === '0' || hakem === 'TBA' || String(hakem).trim() === '') {
      continue;
    }

    const hakemStr = String(hakem).trim();
    let gorevStr = (gorev && gorev !== 0 && gorev !== '0') ? String(gorev).trim() : 'HAKEM';
    let katStr = (kat && kat !== 0 && kat !== '0') ? String(kat).trim() : '';
    let tesisStr = (tesis && tesis !== 0 && tesis !== '0') ? String(tesis).trim().replace(/\n/g, ' ') : '';

    // Özel düzeltme: 13.07.2026 ENKA WTA 125 Soner Sivri görev kayması
    if (hakemStr === 'SONER SİVRİ' && gorevStr === 'SONER SİVRİ') {
      gorevStr = 'HAKEM ŞEFİ';
      logs.push(`Düzeltme yapıldı: SONER SİVRİ görevi 'HAKEM ŞEFİ' olarak güncellendi.`);
    }

    // Özel düzeltme: 13.07.2026 İzmir Kültürpark kategori kayması
    if (katStr === 'İZMİR' && tesisStr.includes('KÜLTÜR')) {
      katStr = 'ITF J30';
      logs.push(`Düzeltme yapıldı: İzmir Kültürpark kategorisi 'ITF J30' yapıldı.`);
    }

    // Özel düzeltme: 02.11.2026 MT200 Hale Bozkurt tesis=0 kayması
    if (katStr === 'MT200' && tesisStr === '' && hakemStr === 'HALE BOZKURT') {
      tesisStr = 'ROBINSON ÇAMYUVA';
      logs.push(`Düzeltme yapıldı: HALE BOZKURT tesisi 'ROBINSON ÇAMYUVA' olarak düzeltildi.`);
    }

    // Özel düzeltme: 05.10.2026 Samsun MT400 tesis=0
    if (katStr === 'MT400' && tesisStr === '' && String(tarih).includes('2026-10-05')) {
      tesisStr = 'SAMSUN TENİS KULÜBÜ';
      logs.push(`Düzeltme yapıldı: 05.10.2026 MT400 tesisi 'SAMSUN TENİS KULÜBÜ' olarak düzeltildi.`);
    }

    // Tarih ve Ay standardizasyonu
    let tarihIso = '';
    let ayStr = '';

    if (tarih instanceof Date) {
      tarihIso = tarih.toISOString().split('T')[0];
      ayStr = ay ? String(ay).trim() : getTurkishMonthName(tarih.getMonth() + 1);
    } else {
      const tStr = String(tarih || '').trim();
      if (dateFixes[tStr]) {
        [tarihIso, ayStr] = dateFixes[tStr];
      } else {
        tarihIso = tStr;
        ayStr = ay ? String(ay).trim() : parseMonthFromDate(tStr);
      }
    }

    const info = hakemInfo[hakemStr] || {};
    const sehirVal = detectCity(tesisStr, info.hakem_sehir);

    cleanedRecords.push({
      id: recordCounter++,
      tarih: tarihIso,
      ay: ayStr,
      kategori: katStr,
      tesis: tesisStr,
      sehir: sehirVal,
      hakem: hakemStr,
      gorev: gorevStr,
      hakem_sehir: info.hakem_sehir || '',
      kokart_ref: info.referee_badge || '',
      kokart_chair: info.chair_badge || '',
      durum: 'ONAYLANDI'
    });
  }

  // 23.11.2026 Ankara ATP Challenger (ATAK PRO) doğru kayıtlarını ekle
  const atakProEkip: [string, string][] = [
    ["İLKER ÖRT", "REF"],
    ["ERKAN TARHAN", "HAKEM ŞEFİ"],
    ["FIRAT KÖKVER", "ATP"],
    ["MUSTAFA GÖKKAYA", "ATP"],
    ["CHIARA CASULA", "ATP"],
    ["YÜKSEL SÜVARİ", "ATP"],
    ["CEM ÇAĞLAR", "ATP"]
  ];

  atakProEkip.forEach(([hName, gRole]) => {
    const info = hakemInfo[hName] || {};
    cleanedRecords.push({
      id: recordCounter++,
      tarih: "2026-11-23",
      ay: "Kasım",
      kategori: "ATP CHALLENGER",
      tesis: "ATAK PRO (ANKARA)",
      sehir: "ANKARA",
      hakem: hName,
      gorev: gRole,
      hakem_sehir: info.hakem_sehir || "ANKARA",
      kokart_ref: info.referee_badge || (hName === "İLKER ÖRT" ? "SB-R" : ""),
      kokart_chair: info.chair_badge || (hName === "İLKER ÖRT" ? "BB" : ""),
      durum: 'ONAYLANDI'
    });
  });

  logs.push(`ATAK PRO ATP Challenger heyeti (7 hakem) eklendi.`);

  // Sort by TARİH, TESİS, GÖREV
  cleanedRecords.sort((a, b) => {
    if (a.tarih !== b.tarih) return a.tarih.localeCompare(b.tarih);
    if (a.tesis !== b.tesis) return a.tesis.localeCompare(b.tesis);
    return a.gorev.localeCompare(b.gorev);
  });

  // Re-index
  cleanedRecords.forEach((r, i) => {
    r.id = i + 1;
  });

  // Metadata
  const uniqueReferees = new Set(cleanedRecords.map(r => r.hakem));
  const uniqueTournaments = new Set(cleanedRecords.map(r => `${r.tarih}_${r.tesis}`));

  const metadata: MetadataInfo = {
    yil: 2026,
    toplam_aktif_atama: cleanedRecords.length,
    tekil_hakem_sayisi: uniqueReferees.size,
    toplam_turnuva_sayisi: uniqueTournaments.size,
    kaynak_dosya: fileName,
    son_guncelleme: new Date().toISOString().split('T')[0]
  };

  logs.push(`İşlem tamamlandı! Toplam ${cleanedRecords.length} temiz atama, ${uniqueReferees.size} tekil hakem, ${uniqueTournaments.size} turnuva oluşturuldu.`);

  return {
    records: cleanedRecords,
    metadata,
    log: logs
  };
}

function getTurkishMonthName(monthNumber: number): string {
  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  return months[monthNumber - 1] || "Ocak";
}

function parseMonthFromDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const m = parseInt(parts[1], 10);
    return getTurkishMonthName(m);
  }
  return 'Ocak';
}

function detectCity(tesis: string, hakemSehir?: string): string {
  const t = (tesis || '').toUpperCase();
  if (t.includes('ANTALYA') || t.includes('MEGASARAY') || t.includes('KAYA PALAZZO') || t.includes('ROBINSON') || t.includes('ALİ BEY')) return 'ANTALYA';
  if (t.includes('İZMİR') || t.includes('IZMIR') || t.includes('KÜLTÜRPARK') || t.includes('UTEM')) return 'İZMİR';
  if (t.includes('ANKARA') || t.includes('ATAK PRO') || t.includes('ATK')) return 'ANKARA';
  if (t.includes('İSTANBUL') || t.includes('ISTANBUL') || t.includes('ENKA') || t.includes('TED') || t.includes('TAÇ')) return 'İSTANBUL';
  if (t.includes('BURSA') || t.includes('PODYUMPARK')) return 'BURSA';
  if (t.includes('ADANA') || t.includes('ATDSK')) return 'ADANA';
  if (t.includes('SAMSUN')) return 'SAMSUN';
  if (t.includes('MERSİN') || t.includes('METİK')) return 'MERSİN';
  if (t.includes('TRABZON')) return 'TRABZON';
  if (t.includes('GAZİANTEP')) return 'GAZİANTEP';
  if (t.includes('ESKİŞEHİR')) return 'ESKİŞEHİR';
  if (t.includes('BODRUM') || t.includes('MUĞLA')) return 'MUĞLA';
  if (t.includes('BATMAN')) return 'BATMAN';
  if (t.includes('KONYA')) return 'KONYA';
  if (t.includes('KAYSERİ')) return 'KAYSERİ';
  return hakemSehir || 'TÜRKİYE';
}

// Export functions matching Python script
export function downloadCleanedExcel(records: Atama[], fileName: string = 'TTF_2026_Hakem_Atamalari_TEMIZ.xlsx') {
  const formattedRows = records.map(r => ({
    "TARİH": r.tarih,
    "AY": r.ay,
    "KATEGORİ": r.kategori,
    "TESİS": r.tesis,
    "HAKEM": r.hakem,
    "GÖREVİ": r.gorev,
    "HAKEM_ŞEHİR": r.hakem_sehir || r.sehir,
    "REFEREE_KOKART": r.kokart_ref,
    "CHAIR_KOKART": r.kokart_chair
  }));

  const ws = XLSX.utils.json_to_sheet(formattedRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "TEMİZ ATAMALAR");
  XLSX.writeFile(wb, fileName);
}

export function downloadCleanedJson(records: Atama[], fileName: string = 'ttf_2026_atamalar_temiz.json') {
  const formattedRows = records.map(r => ({
    "TARİH": r.tarih,
    "AY": r.ay,
    "KATEGORİ": r.kategori,
    "TESİS": r.tesis,
    "HAKEM": r.hakem,
    "GÖREVİ": r.gorev,
    "HAKEM_ŞEHİR": r.hakem_sehir || r.sehir,
    "REFEREE_KOKART": r.kokart_ref,
    "CHAIR_KOKART": r.kokart_chair
  }));

  const jsonStr = JSON.stringify(formattedRows, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadIcsCalendar(refereeName: string, refereeAssignments: Atama[]) {
  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TTF//Turkiye Tenis Federasyonu Hakem Atamalari 2026//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:TTF 2026 - ${refereeName} Görev Takvimi`,
    "X-WR-TIMEZONE:Europe/Istanbul"
  ];

  refereeAssignments.forEach((a) => {
    // Generate dates
    const dStr = a.tarih.replace(/-/g, '');
    const uid = `ttf-2026-${a.id}-${dStr}@ttf.org.tr`;
    icsContent.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dStr}T090000Z`,
      `DTSTART;VALUE=DATE:${dStr}`,
      `SUMMARY:TTF Tenis: ${a.kategori} - ${a.gorev}`,
      `DESCRIPTION:Görev: ${a.gorev}\\nTesis: ${a.tesis}\\nŞehir: ${a.sehir}\\nKokart Ref: ${a.kokart_ref || '-'} / Kule: ${a.kokart_chair || '-'}`,
      `LOCATION:${a.tesis}\\, ${a.sehir}\\, Türkiye`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  });

  icsContent.push("END:VCALENDAR");

  const blob = new Blob([icsContent.join("\r\n")], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `TTF_2026_${refereeName.replace(/\s+/g, '_')}_Takvim.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
