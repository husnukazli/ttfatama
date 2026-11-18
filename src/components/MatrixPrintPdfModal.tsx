import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { TournamentBlockData } from '../types';
import { getTourShortName, resolveTourPalette } from '../utils/tourColors';

interface MatrixPrintPdfModalProps {
  groupedWeeks: {
    weekLabel: string;
    primaryDate: string;
    blocks: TournamentBlockData[];
  }[];
  startDate: string;
  endDate: string;
  totalTournaments: number;
  totalAssignments: number;
  onClose: () => void;
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const str = text || '';
  if (ctx.measureText(str).width <= maxWidth) return str;
  let clipped = str;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}…`;
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = (text || '').split(/\r?\n/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(truncateText(ctx, current, maxWidth));
        current = words[i];
      }
    }
    lines.push(truncateText(ctx, current, maxWidth));
  }
  return lines;
}

export const MatrixPrintPdfModal: React.FC<MatrixPrintPdfModalProps> = ({
  groupedWeeks,
  startDate,
  endDate,
  totalTournaments,
  totalAssignments,
  onClose
}) => {
  const [paperFormat, setPaperFormat] = useState<'A4_LANDSCAPE' | 'A3_LANDSCAPE'>('A4_LANDSCAPE');
  const [colorMode, setColorMode] = useState<'COLOR' | 'HIGH_CONTRAST'>('COLOR');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Trigger browser print
  const handleDirectPrint = () => {
    window.print();
  };

  // Generate and download an actual multi-page .pdf preserving card colors & Turkish typography
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const isA3 = paperFormat === 'A3_LANDSCAPE';
      const isHighContrast = colorMode === 'HIGH_CONTRAST';
      const pageW_mm = isA3 ? 420 : 297;
      const pageH_mm = isA3 ? 297 : 210;
      const marginMm = 10;
      const contentW_mm = pageW_mm - marginMm * 2;
      const contentH_mm = pageH_mm - marginMm * 2;

      const logicalW = isA3 ? 1800 : 1360;
      const logicalH = Math.floor(logicalW * (contentH_mm / contentW_mm));
      const dpr = 2;
      const cols = isA3 ? 4 : 3;
      const colGap = 16;
      const cardW = (logicalW - colGap * (cols - 1)) / cols;
      const usableBottomY = logicalH - 34;

      const fontFamily = '"Plus Jakarta Sans", "Inter", "Segoe UI", Arial, sans-serif';

      const getCardLayoutInfo = (b: TournamentBlockData) => {
        const isMajor =
          b.kategori.includes('WORLD') ||
          b.kategori.includes('CHALLENGER') ||
          b.tourType === 'ATP_CHALLENGER' ||
          b.tourType === 'WTA' ||
          Boolean(b.hakemSefiSlot || b.assRefSlot);
        const designatedList = b.designatedSlots || [];
        const hasScheduleNotes = b.rawAssignments.some(a => {
          const u = (a.notlar || '').toUpperCase();
          return u.includes('SALI-CUMA') || u.includes('SALI-PERŞEMBE');
        });
        const isScheduleSplit =
          (b.kategori.toUpperCase().includes('15K') ||
            b.kategori.toUpperCase().includes('25K') ||
            b.kategori.toUpperCase().includes('35K')) &&
          b.crewCol2.length === 0 &&
          (b.crewCol3.length > 0 || hasScheduleNotes);
        const isSingleCol = !isScheduleSplit && b.crewCol2.length === 0 && b.crewCol3.length === 0;
        const isAtpSplit = b.tourType === 'ATP_CHALLENGER' && b.crewCol2.length === 0 && b.crewCol3.length > 0;
        const isWtaSplit = b.tourType === 'WTA' && b.crewCol2.length === 0 && b.crewCol3.length > 0;

        const bannerH = 26;
        const subBarH = 24;
        const cancelledH = b.isCancelled ? 18 : 0;
        const leaderH = isMajor ? 34 : 22;
        const hasColCrew = !isSingleCol || b.crewCol1.length > 0 || designatedList.length === 0;
        const crewRowsCount = !hasColCrew
          ? 0
          : isSingleCol
            ? Math.max(2, b.crewCol1.length)
            : Math.max(3, b.crewCol1.length, b.crewCol2.length, b.crewCol3.length);
        const rowH = 18;
        const colHeaderH = isScheduleSplit ? 14 : 0;
        const crewH = crewRowsCount > 0 ? colHeaderH + crewRowsCount * rowH + 8 : 0;
        const designatedRows = designatedList.length > 0 ? Math.ceil(designatedList.length / 2) : 0;
        const designatedH = designatedRows > 0 ? designatedRows * 18 + 8 : 0;
        const totalH = bannerH + subBarH + cancelledH + leaderH + crewH + designatedH;

        return {
          isMajor,
          isSingleCol,
          isScheduleSplit,
          isAtpSplit,
          isWtaSplit,
          bannerH,
          subBarH,
          cancelledH,
          leaderH,
          rowH,
          colHeaderH,
          crewH,
          designatedH,
          designatedList,
          totalH
        };
      };

      const createPageCanvas = () => {
        const canvas = document.createElement('canvas');
        canvas.width = logicalW * dpr;
        canvas.height = logicalH * dpr;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, logicalW, logicalH);
        return { canvas, ctx };
      };

      const drawDocumentHeader = (ctx: CanvasRenderingContext2D): number => {
        // TTF Red badge
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 4, 48, 48);
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 18px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TTF', 24, 28);

        // Title & Subtitle
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = `700 10px ${fontFamily}`;
        ctx.fillText('TÜRKİYE TENİS FEDERASYONU', 60, 14);

        ctx.fillStyle = '#0f172a';
        ctx.font = `900 19px ${fontFamily}`;
        ctx.fillText('MERKEZ HAKEM KURULU HAFTALIK ATAMA PLANI', 60, 36);

        // Meta right side
        ctx.textAlign = 'right';
        ctx.fillStyle = '#0f172a';
        ctx.font = `700 12px monospace`;
        ctx.fillText(`Tarih Aralığı: ${startDate} — ${endDate}`, logicalW, 14);

        ctx.fillStyle = '#475569';
        ctx.font = `600 11px ${fontFamily}`;
        ctx.fillText(
          `${totalTournaments} Turnuva  ·  ${totalAssignments} Hakem Görevi  ·  Rapor: ${new Date().toLocaleDateString('tr-TR')}`,
          logicalW,
          34
        );

        // Divider line
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 62);
        ctx.lineTo(logicalW, 62);
        ctx.stroke();

        return 76;
      };

      const drawWeekStrip = (
        ctx: CanvasRenderingContext2D,
        y: number,
        title: string,
        countLabel: string
      ): number => {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, y, logicalW, 26);

        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, y, 5, 26);

        ctx.fillStyle = '#0f172a';
        ctx.font = `800 12px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(title.toUpperCase(), 14, y + 13);

        ctx.fillStyle = '#475569';
        ctx.font = `700 11px monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(countLabel, logicalW - 10, y + 13);

        return y + 34;
      };

      const drawCard = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        b: TournamentBlockData,
        renderH: number
      ) => {
        const info = getCardLayoutInfo(b);
        const palette = resolveTourPalette(b.tourType, b.colorTheme);
        const borderColor = b.isCancelled ? '#e11d48' : isHighContrast ? '#0f172a' : palette.hexBorder;
        const bannerBg = isHighContrast ? '#0f172a' : palette.hexBannerBg;
        const bannerText = isHighContrast ? '#ffffff' : palette.hexBannerText;
        const subBg = isHighContrast ? '#f8fafc' : palette.hexSubHeaderBg;
        const subText = isHighContrast ? '#0f172a' : palette.hexSubHeaderText;
        const tagBg = isHighContrast ? '#0f172a' : palette.hexTagBg;
        const tagText = isHighContrast ? '#ffffff' : palette.hexTagText;

        // Card white body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, w, renderH);

        let curY = y;

        // 1. Header Banner
        ctx.fillStyle = bannerBg;
        ctx.fillRect(x, curY, w, info.bannerH);

        if (!isHighContrast && palette.hexBannerAccentBottom) {
          ctx.fillStyle = palette.hexBannerAccentBottom;
          ctx.fillRect(x, curY + info.bannerH - 2, w, 2);
        }

        ctx.fillStyle = bannerText;
        ctx.textBaseline = 'middle';

        ctx.font = `800 10.5px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText(
          truncateText(ctx, getTourShortName(b.tourType).toUpperCase(), w * 0.34),
          x + 8,
          curY + info.bannerH / 2
        );

        ctx.font = `800 11px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(
          truncateText(ctx, b.tarihLabel, w * 0.36),
          x + w / 2,
          curY + info.bannerH / 2
        );

        ctx.font = `700 9.5px ${fontFamily}`;
        ctx.textAlign = 'right';
        ctx.fillText(
          b.isCancelled ? 'İPTAL · TTF' : 'TTF',
          x + w - 8,
          curY + info.bannerH / 2
        );

        curY += info.bannerH;

        // 2. Sub-bar (ŞEHİR | KATEGORİ | TESİS)
        ctx.fillStyle = subBg;
        ctx.fillRect(x, curY, w, info.subBarH);

        const thirdW = w / 3;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + thirdW, curY);
        ctx.lineTo(x + thirdW, curY + info.subBarH);
        ctx.moveTo(x + thirdW * 2, curY);
        ctx.lineTo(x + thirdW * 2, curY + info.subBarH);
        ctx.moveTo(x, curY + info.subBarH);
        ctx.lineTo(x + w, curY + info.subBarH);
        ctx.stroke();

        ctx.fillStyle = subText;
        ctx.font = `700 9.5px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(truncateText(ctx, b.sehir.toUpperCase(), thirdW - 8), x + thirdW * 0.5, curY + info.subBarH / 2);
        ctx.fillText(truncateText(ctx, b.kategori.toUpperCase(), thirdW - 8), x + thirdW * 1.5, curY + info.subBarH / 2);
        ctx.fillText(truncateText(ctx, b.tesis.toUpperCase(), thirdW - 8), x + thirdW * 2.5, curY + info.subBarH / 2);

        curY += info.subBarH;

        // 3. Cancelled notice strip
        if (b.isCancelled) {
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(x, curY, w, info.cancelledH);
          ctx.fillStyle = '#ffffff';
          ctx.font = `800 9.5px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText('İPTAL EDİLDİ', x + w / 2, curY + info.cancelledH / 2);
          curY += info.cancelledH;
        }

        // 4. Leadership bar
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(x, curY, w, info.leaderH);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, curY + info.leaderH);
        ctx.lineTo(x + w, curY + info.leaderH);
        ctx.stroke();

        if (info.isMajor) {
          ctx.beginPath();
          ctx.moveTo(x + thirdW, curY);
          ctx.lineTo(x + thirdW, curY + info.leaderH);
          ctx.moveTo(x + thirdW * 2, curY);
          ctx.lineTo(x + thirdW * 2, curY + info.leaderH);
          ctx.stroke();

          const col2Label = b.tourType === 'WTA' ? 'REF' : 'HAKEM ŞEFİ';
          const col2Val = b.tourType === 'WTA' ? (b.assRef || '-') : (b.hakemSefi || '-');
          const col3Label =
            b.tourType === 'WTA'
              ? 'HAKEM ŞEFİ'
              : b.tourType === 'ATP_CHALLENGER'
                ? 'REF.'
                : 'ASS. REF.';
          const col3Val = b.tourType === 'WTA' ? (b.hakemSefi || '-') : (b.assRef || '-');

          const leaders = [
            { label: 'SUPERVISOR', val: b.supervisor || '-' },
            { label: col2Label, val: col2Val },
            { label: col3Label, val: col3Val }
          ];

          leaders.forEach((ld, idx) => {
            const cx = x + thirdW * (idx + 0.5);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#64748b';
            ctx.font = `700 8px ${fontFamily}`;
            ctx.fillText(ld.label, cx, curY + 10);
            ctx.fillStyle = '#0f172a';
            ctx.font = `800 9.5px ${fontFamily}`;
            ctx.fillText(truncateText(ctx, ld.val, thirdW - 8), cx, curY + 24);
          });
        } else {
          const tagW = 82;
          ctx.fillStyle = tagBg;
          ctx.fillRect(x, curY, tagW, info.leaderH);
          ctx.fillStyle = tagText;
          ctx.font = `800 8.5px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.fillText('SUPERVISOR', x + tagW / 2, curY + info.leaderH / 2);

          ctx.fillStyle = '#0f172a';
          ctx.font = `800 10px ${fontFamily}`;
          ctx.textAlign = 'left';
          ctx.fillText(
            truncateText(ctx, b.supervisor || '-', w - tagW - 14),
            x + tagW + 8,
            curY + info.leaderH / 2
          );
        }

        curY += info.leaderH;

        // 5. Crew Columns
        const remainingCrewH = Math.max(0, y + renderH - curY - info.designatedH);

        if (remainingCrewH > 0) {
          if (info.isSingleCol) {
            ctx.textAlign = 'center';
            if (b.crewCol1.length === 0) {
              ctx.fillStyle = '#94a3b8';
              ctx.font = `600 9.5px ${fontFamily}`;
              ctx.fillText(b.isCancelled ? 'İptal edildi' : '-', x + w / 2, curY + 18);
            } else {
              b.crewCol1.forEach((slot, idx) => {
                const ry = curY + 4 + idx * info.rowH;
                ctx.fillStyle = '#1e293b';
                ctx.font = `600 9.5px ${fontFamily}`;
                ctx.fillText(truncateText(ctx, slot.hakem, w - 16), x + w / 2, ry + info.rowH / 2);
                ctx.strokeStyle = '#f1f5f9';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 4, ry + info.rowH);
                ctx.lineTo(x + w - 4, ry + info.rowH);
                ctx.stroke();
              });
            }
          } else {
            const col1W = info.isScheduleSplit ? w * 0.40 : thirdW;
            const col2W = info.isScheduleSplit ? w * 0.20 : thirdW;
            const col3W = info.isScheduleSplit ? w * 0.40 : thirdW;
            const col2X = x + col1W;
            const col3X = x + col1W + col2W;

            // Draw vertical column dividers
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(col2X, curY);
            ctx.lineTo(col2X, curY + remainingCrewH);
            ctx.moveTo(col3X, curY);
            ctx.lineTo(col3X, curY + remainingCrewH);
            ctx.stroke();

            if (info.isScheduleSplit && info.colHeaderH > 0) {
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(x + 1, curY, col1W - 2, info.colHeaderH);
              ctx.fillRect(col3X + 1, curY, col3W - 2, info.colHeaderH);

              ctx.strokeStyle = '#e2e8f0';
              ctx.beginPath();
              ctx.moveTo(x, curY + info.colHeaderH);
              ctx.lineTo(col2X, curY + info.colHeaderH);
              ctx.moveTo(col3X, curY + info.colHeaderH);
              ctx.lineTo(x + w, curY + info.colHeaderH);
              ctx.stroke();

              ctx.fillStyle = '#475569';
              ctx.font = `800 7.5px ${fontFamily}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('SALI - CUMA', x + col1W / 2, curY + info.colHeaderH / 2);
              ctx.fillText('SALI - PERŞEMBE', col3X + col3W / 2, curY + info.colHeaderH / 2);
            }

            const namesStartY = curY + info.colHeaderH;

            // Helper for crew columns
            const drawCrewCol = (slots: typeof b.crewCol1, colX: number, colW: number) => {
              slots.forEach((slot, idx) => {
                const ry = namesStartY + 4 + idx * info.rowH;
                ctx.fillStyle = '#1e293b';
                ctx.font = `600 9px ${fontFamily}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(truncateText(ctx, slot.hakem, colW - 10), colX + 5, ry + info.rowH / 2);

                ctx.strokeStyle = '#f1f5f9';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(colX + 2, ry + info.rowH);
                ctx.lineTo(colX + colW - 2, ry + info.rowH);
                ctx.stroke();
              });
            };

            drawCrewCol(b.crewCol1, x, col1W);

            if (info.isScheduleSplit) {
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(col2X + 1, curY, col2W - 2, remainingCrewH);
              if (b.ortaNot && b.ortaNot.trim()) {
                ctx.fillStyle = '#334155';
                ctx.font = `700 8px ${fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const wrapped = wrapTextLines(ctx, b.ortaNot.trim(), col2W - 8);
                const lineH = 11;
                const startTextY = curY + remainingCrewH / 2 - ((wrapped.length - 1) * lineH) / 2;
                wrapped.forEach((line, lIdx) => {
                  ctx.fillText(line, col2X + col2W / 2, startTextY + lIdx * lineH);
                });
              }
            } else if (info.isAtpSplit) {
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(col2X + 1, curY, col2W - 2, remainingCrewH);
              ctx.fillStyle = '#1e293b';
              ctx.font = `800 10px ${fontFamily}`;
              ctx.textAlign = 'center';
              ctx.fillText(b.atpLevel || 'ATP 75', col2X + col2W / 2, curY + remainingCrewH / 2);
            } else if (info.isWtaSplit) {
              ctx.fillStyle = '#faf5ff';
              ctx.fillRect(col2X + 1, curY, col2W - 2, remainingCrewH);
              ctx.fillStyle = '#6b21a8';
              ctx.font = `800 10px ${fontFamily}`;
              ctx.textAlign = 'center';
              ctx.fillText('WTA 125', col2X + col2W / 2, curY + remainingCrewH / 2);
            } else {
              drawCrewCol(b.crewCol2, col2X, col2W);
            }

            drawCrewCol(b.crewCol3, col3X, col3W);
          }
        }

        // 6. Dedicated Designated Referee Row
        if (info.designatedH > 0 && info.designatedList.length > 0) {
          const desY = y + renderH - info.designatedH;
          ctx.fillStyle = isHighContrast ? '#f1f5f9' : '#eef2ff';
          ctx.fillRect(x, desY, w, info.designatedH);

          ctx.strokeStyle = isHighContrast ? '#94a3b8' : '#c7d2fe';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, desY);
          ctx.lineTo(x + w, desY);
          ctx.stroke();

          const desTagW = 74;
          ctx.fillStyle = isHighContrast ? '#0f172a' : '#4f46e5';
          ctx.fillRect(x, desY, desTagW, info.designatedH);
          ctx.fillStyle = '#ffffff';
          ctx.font = `800 8px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('DESIGNATED', x + desTagW / 2, desY + info.designatedH / 2);

          const availW = w - desTagW - 12;
          const halfAvailW = availW / 2;
          info.designatedList.forEach((slot, idx) => {
            const rIdx = Math.floor(idx / 2);
            const cIdx = idx % 2;
            const textX = x + desTagW + 8 + cIdx * halfAvailW;
            const textY = desY + 4 + rIdx * 18 + 9;
            ctx.fillStyle = isHighContrast ? '#0f172a' : '#1e1b4b';
            ctx.font = `700 9px ${fontFamily}`;
            ctx.textAlign = 'left';
            ctx.fillText(truncateText(ctx, slot.hakem, halfAvailW - 6), textX, textY);
          });
        }

        // Outer border drawn last for crisp edges
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, renderH);
      };

      const pages: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = [];
      let currentPage = createPageCanvas();
      pages.push(currentPage);
      let cursorY = drawDocumentHeader(currentPage.ctx);

      const rowGap = 16;

      if (groupedWeeks.length === 0) {
        currentPage.ctx.fillStyle = '#64748b';
        currentPage.ctx.font = `600 14px ${fontFamily}`;
        currentPage.ctx.textAlign = 'center';
        currentPage.ctx.fillText(
          'Seçilen tarih aralığında turnuva kaydı bulunamadı.',
          logicalW / 2,
          cursorY + 80
        );
      } else {
        for (const week of groupedWeeks) {
          const rows: TournamentBlockData[][] = [];
          for (let i = 0; i < week.blocks.length; i += cols) {
            rows.push(week.blocks.slice(i, i + cols));
          }

          const firstRowH = Math.max(...rows[0].map(b => getCardLayoutInfo(b).totalH));
          if (cursorY + 34 + firstRowH > usableBottomY && cursorY > 90) {
            currentPage = createPageCanvas();
            pages.push(currentPage);
            cursorY = 10;
          }

          cursorY = drawWeekStrip(
            currentPage.ctx,
            cursorY,
            `${week.weekLabel} Haftası`,
            `${week.blocks.length} Turnuva`
          );

          rows.forEach((rowBlocks, rIdx) => {
            const rowH = Math.max(...rowBlocks.map(b => getCardLayoutInfo(b).totalH));
            if (rIdx > 0 && cursorY + rowH > usableBottomY) {
              currentPage = createPageCanvas();
              pages.push(currentPage);
              cursorY = drawWeekStrip(
                currentPage.ctx,
                10,
                `${week.weekLabel} Haftası (devam)`,
                `${week.blocks.length} Turnuva`
              );
            }

            rowBlocks.forEach((block, cIdx) => {
              const cardX = cIdx * (cardW + colGap);
              drawCard(currentPage.ctx, cardX, cursorY, cardW, block, rowH);
            });

            cursorY += rowH + rowGap;
          });

          cursorY += 8;
        }
      }

      // Draw footers across all pages
      const totalPages = pages.length;
      pages.forEach((p, idx) => {
        const footerY = logicalH - 14;
        p.ctx.strokeStyle = '#cbd5e1';
        p.ctx.lineWidth = 1;
        p.ctx.beginPath();
        p.ctx.moveTo(0, logicalH - 26);
        p.ctx.lineTo(logicalW, logicalH - 26);
        p.ctx.stroke();

        p.ctx.fillStyle = '#64748b';
        p.ctx.font = `600 9.5px ${fontFamily}`;
        p.ctx.textAlign = 'left';
        p.ctx.textBaseline = 'middle';
        p.ctx.fillText(
          'Türkiye Tenis Federasyonu (TTF) · Merkez Hakem Kurulu · 2026 Resmi Faaliyet Programı',
          0,
          footerY
        );

        p.ctx.textAlign = 'right';
        p.ctx.font = `700 10px monospace`;
        p.ctx.fillText(`Sayfa ${idx + 1} / ${totalPages}`, logicalW, footerY);
      });

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: isA3 ? 'a3' : 'a4',
        compress: true
      });

      pages.forEach((p, idx) => {
        if (idx > 0) doc.addPage(isA3 ? 'a3' : 'a4', 'landscape');
        const imgData = p.canvas.toDataURL('image/jpeg', 0.94);
        doc.addImage(imgData, 'JPEG', marginMm, marginMm, contentW_mm, contentH_mm);
      });

      doc.save(`TTF_Haftalik_Hakem_Matrisi_${startDate}_${endDate}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="print-modal-root fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div 
        className="print-modal-dialog bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Görünümü Yazdır & PDF Olarak Kaydet
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {startDate} — {endDate} ({groupedWeeks.length} Hafta · {totalTournaments} Turnuva)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Color choice */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setColorMode('COLOR')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  colorMode === 'COLOR' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Renkli
              </button>
              <button
                onClick={() => setColorMode('HIGH_CONTRAST')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  colorMode === 'HIGH_CONTRAST' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Siyah-Beyaz
              </button>
            </div>

            {/* Format choice */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setPaperFormat('A4_LANDSCAPE')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  paperFormat === 'A4_LANDSCAPE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Yatay
              </button>
              <button
                onClick={() => setPaperFormat('A3_LANDSCAPE')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  paperFormat === 'A3_LANDSCAPE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                A3 Geniş Yatay
              </button>
            </div>

            {/* Direct Print Button */}
            <button
              onClick={handleDirectPrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Yazıcıya Gönder</span>
            </button>

            {/* Real PDF File Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'PDF Oluşturuluyor...' : 'PDF İndir (.pdf)'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="no-print bg-emerald-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Renkli haftalık hakem atama matrisi PDF (.pdf) dosyası olarak cihazınıza indirildi!
            </span>
            <button onClick={() => setDownloadSuccess(false)} className="text-white hover:underline text-[11px]">✕</button>
          </div>
        )}

        {/* Live Preview Container (Matches Print Layout) */}
        <div className="print-modal-scroll p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 font-sans">
          
          <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-300 printable-matrix-content">
            
            {/* Document Antet */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xl tracking-tighter">
                  TTF
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                    TÜRKİYE TENİS FEDERASYONU
                  </div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                    MERKEZ HAKEM KURULU HAFTALIK ATAMA PLANI
                  </h1>
                </div>
              </div>

              <div className="text-right text-xs font-mono">
                <div className="font-bold text-slate-900">
                  {startDate} — {endDate}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {totalTournaments} Turnuva · {totalAssignments} Hakem Görevi
                </div>
              </div>
            </div>

            {/* Weeks */}
            <div className="space-y-6">
              {groupedWeeks.map(week => (
                <div key={week.weekLabel} className="space-y-2">
                  <div className="bg-slate-100 px-3 py-1.5 border-l-4 border-emerald-600 font-extrabold text-xs uppercase flex items-center justify-between">
                    <span>{week.weekLabel} Haftası</span>
                    <span className="font-mono text-[11px] text-slate-600 font-medium">
                      {week.blocks.length} Turnuva
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {week.blocks.map(b => {
                      const palette = resolveTourPalette(b.tourType, b.colorTheme);
                      const isHighContrast = colorMode === 'HIGH_CONTRAST';
                      const cardBorder = b.isCancelled ? '#e11d48' : isHighContrast ? '#0f172a' : palette.hexBorder;
                      const headerStyle: React.CSSProperties = isHighContrast
                        ? { backgroundColor: '#0f172a', color: '#ffffff' }
                        : {
                            backgroundColor: palette.hexBannerBg,
                            color: palette.hexBannerText,
                            borderBottom: palette.hexBannerAccentBottom
                              ? `2px solid ${palette.hexBannerAccentBottom}`
                              : undefined
                          };
                      const subBarStyle: React.CSSProperties = isHighContrast
                        ? { backgroundColor: '#f8fafc', color: '#0f172a' }
                        : { backgroundColor: palette.hexSubHeaderBg, color: palette.hexSubHeaderText };
                      const tagStyle: React.CSSProperties = isHighContrast
                        ? { backgroundColor: '#0f172a', color: '#ffffff' }
                        : { backgroundColor: palette.hexTagBg, color: palette.hexTagText };

                      const designatedList = b.designatedSlots || [];
                      const hasScheduleNotes = b.rawAssignments.some(a => {
                        const u = (a.notlar || '').toUpperCase();
                        return u.includes('SALI-CUMA') || u.includes('SALI-PERŞEMBE');
                      });
                      const isMajor =
                        b.kategori.includes('WORLD') ||
                        b.kategori.includes('CHALLENGER') ||
                        b.tourType === 'ATP_CHALLENGER' ||
                        b.tourType === 'WTA' ||
                        Boolean(b.hakemSefiSlot || b.assRefSlot);
                      const isScheduleSplit =
                        (b.kategori.toUpperCase().includes('15K') ||
                          b.kategori.toUpperCase().includes('25K') ||
                          b.kategori.toUpperCase().includes('35K')) &&
                        b.crewCol2.length === 0 &&
                        (b.crewCol3.length > 0 || hasScheduleNotes);
                      const isSingleCol = !isScheduleSplit && b.crewCol2.length === 0 && b.crewCol3.length === 0;
                      const isAtpSplit = b.tourType === 'ATP_CHALLENGER' && b.crewCol2.length === 0 && b.crewCol3.length > 0;
                      const isWtaSplit = b.tourType === 'WTA' && b.crewCol2.length === 0 && b.crewCol3.length > 0;

                      return (
                        <div
                          key={b.id}
                          style={{ borderColor: cardBorder }}
                          className={`print-card-avoid-break border-2 rounded overflow-hidden text-[11px] bg-white ${b.isCancelled ? 'opacity-85' : ''}`}
                        >
                          {/* Header */}
                          <div
                            style={headerStyle}
                            className="px-2 py-1.5 flex items-center justify-between font-bold text-[10px]"
                          >
                            <span className="uppercase">{getTourShortName(b.tourType)}</span>
                            <span className="font-mono">{b.tarihLabel}</span>
                            <span className="text-[9px]">{b.isCancelled ? 'İPTAL · TTF' : 'TTF'}</span>
                          </div>

                          {/* Sub bar */}
                          <div
                            style={subBarStyle}
                            className="grid grid-cols-3 text-center py-1 font-semibold text-[10px] border-b border-slate-200"
                          >
                            <div className="truncate px-1">{b.sehir}</div>
                            <div className="truncate px-1 border-x border-slate-300/60">{b.kategori}</div>
                            <div className="truncate px-1">{b.tesis}</div>
                          </div>

                          {b.isCancelled && (
                            <div className="bg-rose-600 text-white text-center font-extrabold text-[9.5px] py-0.5 tracking-wider uppercase">
                              İPTAL EDİLDİ
                            </div>
                          )}

                          {/* Leadership */}
                          {isMajor ? (
                            <div className="grid grid-cols-3 text-center border-b border-slate-200 bg-slate-100 text-[9.5px] divide-x divide-slate-200">
                              <div className="p-1">
                                <div className="text-[8.5px] font-bold text-slate-500 uppercase">SUPERVISOR</div>
                                <div className="font-extrabold text-slate-900 truncate">{b.supervisor || '-'}</div>
                              </div>
                              {b.tourType === 'WTA' ? (
                                <>
                                  <div className="p-1">
                                    <div className="text-[8.5px] font-bold text-slate-500 uppercase">REF</div>
                                    <div className="font-extrabold text-slate-900 truncate">{b.assRef || '-'}</div>
                                  </div>
                                  <div className="p-1">
                                    <div className="text-[8.5px] font-bold text-slate-500 uppercase">HAKEM ŞEFİ</div>
                                    <div className="font-extrabold text-slate-900 truncate">{b.hakemSefi || '-'}</div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="p-1">
                                    <div className="text-[8.5px] font-bold text-slate-500 uppercase">Hakem Şefi</div>
                                    <div className="font-extrabold text-slate-900 truncate">{b.hakemSefi || '-'}</div>
                                  </div>
                                  <div className="p-1">
                                    <div className="text-[8.5px] font-bold text-slate-500 uppercase">{b.tourType === 'ATP_CHALLENGER' ? 'Ref.' : 'Ass. Ref.'}</div>
                                    <div className="font-extrabold text-slate-900 truncate">{b.assRef || '-'}</div>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center border-b border-slate-200 bg-slate-100 text-[10px]">
                              <span
                                style={tagStyle}
                                className="font-bold px-1.5 py-0.5 text-[9px] shrink-0"
                              >
                                SUPERVISOR
                              </span>
                              <span className="font-extrabold px-2 py-0.5 text-slate-900 truncate">
                                {b.supervisor || '-'}
                              </span>
                            </div>
                          )}

                          {/* Roster list */}
                          {isSingleCol ? (
                            (b.crewCol1.length > 0 || designatedList.length === 0) && (
                              <div className="text-[9.5px] p-1 min-h-[50px] text-center space-y-0.5">
                                {b.crewCol1.length === 0 ? (
                                  <div className="text-slate-400 py-2">{b.isCancelled ? 'İptal edildi' : '-'}</div>
                                ) : (
                                  b.crewCol1.map((slot, i) => (
                                    <div key={i} className="truncate text-slate-800 font-medium">{slot.hakem}</div>
                                  ))
                                )}
                              </div>
                            )
                          ) : (
                            <div
                              className={`grid divide-x divide-slate-100 text-[9.5px] p-1 min-h-[60px] ${
                                isScheduleSplit ? 'grid-cols-[1fr_0.55fr_1fr]' : 'grid-cols-3'
                              }`}
                            >
                              <div className="min-w-0 space-y-0.5 pr-1">
                                {isScheduleSplit && (
                                  <div className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50 text-center py-0.5 border-b border-slate-200 mb-0.5">
                                    Salı - Cuma
                                  </div>
                                )}
                                {b.crewCol1.map((slot, i) => (
                                  <div key={i} className="truncate text-slate-800 font-medium">{slot.hakem}</div>
                                ))}
                              </div>
                              {isScheduleSplit ? (
                                <div className="min-w-0 flex items-center justify-center text-center text-[8.5px] font-semibold text-slate-700 bg-slate-50/50 px-1 whitespace-pre-wrap break-words">
                                  {b.ortaNot ? b.ortaNot : ''}
                                </div>
                              ) : isAtpSplit ? (
                                <div className="flex items-center justify-center text-[9.5px] font-extrabold text-slate-700 bg-slate-50">
                                  {b.atpLevel || 'ATP 75'}
                                </div>
                              ) : isWtaSplit ? (
                                <div className="flex items-center justify-center text-[9.5px] font-extrabold text-purple-800 bg-purple-50">
                                  WTA 125
                                </div>
                              ) : (
                                <div className="space-y-0.5 px-1">
                                  {b.crewCol2.map((slot, i) => (
                                    <div key={i} className="truncate text-slate-800 font-medium">{slot.hakem}</div>
                                  ))}
                                </div>
                              )}
                              <div className="min-w-0 space-y-0.5 pl-1">
                                {isScheduleSplit && (
                                  <div className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-50 text-center py-0.5 border-b border-slate-200 mb-0.5">
                                    Salı - Perşembe
                                  </div>
                                )}
                                {b.crewCol3.map((slot, i) => (
                                  <div key={i} className="truncate text-slate-800 font-medium">{slot.hakem}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dedicated Designated Row */}
                          {designatedList.length > 0 && (
                            <div
                              style={{
                                backgroundColor: isHighContrast ? '#f1f5f9' : '#eef2ff',
                                borderTop: `1px solid ${isHighContrast ? '#94a3b8' : '#c7d2fe'}`
                              }}
                              className="flex items-stretch text-[9.5px]"
                            >
                              <span
                                style={{
                                  backgroundColor: isHighContrast ? '#0f172a' : '#4f46e5',
                                  color: '#ffffff'
                                }}
                                className="font-extrabold px-1.5 py-1 text-[8px] tracking-wider uppercase flex items-center shrink-0"
                              >
                                DESIGNATED
                              </span>
                              <div className="px-2 py-1 flex flex-wrap gap-x-2.5 gap-y-0.5 font-bold text-indigo-950">
                                {designatedList.map((slot, i) => (
                                  <span key={i} className="truncate">{slot.hakem}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 font-mono">
              Türkiye Tenis Federasyonu (TTF) · Merkez Hakem Kurulu · 2026 Resmi Faaliyet Programı
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
