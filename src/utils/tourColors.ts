import { TournamentColorTheme } from '../types';

export type TourTypeKey =
  | 'ITF_WTT'
  | 'ITF_JUNIORS'
  | 'ITF_MASTERS'
  | 'TENNIS_EUROPE'
  | 'ATP_CHALLENGER'
  | 'WTA'
  | 'TTF_NATIONAL';

export interface TourColorPalette {
  key: TournamentColorTheme;
  label: string;
  bannerBgClass: string;
  bannerBorderClass: string;
  subHeaderBgClass: string;
  tagBgClass: string;
  pillBgClass: string;
  // Explicit print-safe hex colors preserved in PDF & HTML output
  hexBannerBg: string;
  hexBannerText: string;
  hexBorder: string;
  hexSubHeaderBg: string;
  hexSubHeaderText: string;
  hexTagBg: string;
  hexTagText: string;
  hexBannerAccentBottom?: string;
}

export const TOUR_COLOR_PALETTES: Record<TournamentColorTheme, TourColorPalette> = {
  blue: {
    key: 'blue',
    label: 'Mavi (ITF WTT)',
    bannerBgClass: 'bg-blue-600 text-white',
    bannerBorderClass: 'border-blue-600',
    subHeaderBgClass: 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100',
    tagBgClass: 'bg-blue-600 text-white',
    pillBgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    hexBannerBg: '#2563eb',
    hexBannerText: '#ffffff',
    hexBorder: '#2563eb',
    hexSubHeaderBg: '#eff6ff',
    hexSubHeaderText: '#1e3a8a',
    hexTagBg: '#2563eb',
    hexTagText: '#ffffff'
  },
  emerald: {
    key: 'emerald',
    label: 'Yeşil (ITF Juniors)',
    bannerBgClass: 'bg-emerald-600 text-white',
    bannerBorderClass: 'border-emerald-600',
    subHeaderBgClass: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100',
    tagBgClass: 'bg-emerald-600 text-white',
    pillBgClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    hexBannerBg: '#16a34a',
    hexBannerText: '#ffffff',
    hexBorder: '#16a34a',
    hexSubHeaderBg: '#ecfdf5',
    hexSubHeaderText: '#064e3b',
    hexTagBg: '#16a34a',
    hexTagText: '#ffffff'
  },
  amber: {
    key: 'amber',
    label: 'Turuncu (ITF Masters)',
    bannerBgClass: 'bg-orange-600 text-white',
    bannerBorderClass: 'border-orange-600',
    subHeaderBgClass: 'bg-orange-50/80 dark:bg-orange-950/40 text-orange-950 dark:text-orange-100',
    tagBgClass: 'bg-orange-600 text-white',
    pillBgClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200',
    hexBannerBg: '#ea580c',
    hexBannerText: '#ffffff',
    hexBorder: '#ea580c',
    hexSubHeaderBg: '#fff7ed',
    hexSubHeaderText: '#7c2d12',
    hexTagBg: '#ea580c',
    hexTagText: '#ffffff'
  },
  teal: {
    key: 'teal',
    label: 'Turkuaz (Tennis Europe)',
    bannerBgClass: 'bg-teal-600 text-white',
    bannerBorderClass: 'border-teal-600',
    subHeaderBgClass: 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100',
    tagBgClass: 'bg-teal-600 text-white',
    pillBgClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200',
    hexBannerBg: '#0d9488',
    hexBannerText: '#ffffff',
    hexBorder: '#0d9488',
    hexSubHeaderBg: '#f0fdfa',
    hexSubHeaderText: '#134e4a',
    hexTagBg: '#0d9488',
    hexTagText: '#ffffff'
  },
  purple: {
    key: 'purple',
    label: 'Mor (WTA)',
    bannerBgClass: 'bg-purple-600 text-white',
    bannerBorderClass: 'border-purple-600',
    subHeaderBgClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100',
    tagBgClass: 'bg-purple-600 text-white',
    pillBgClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
    hexBannerBg: '#9333ea',
    hexBannerText: '#ffffff',
    hexBorder: '#9333ea',
    hexSubHeaderBg: '#faf5ff',
    hexSubHeaderText: '#581c87',
    hexTagBg: '#9333ea',
    hexTagText: '#ffffff'
  },
  slate: {
    key: 'slate',
    label: 'Siyah / Altın (ATP Challenger)',
    bannerBgClass: 'bg-slate-900 text-white border-b-2 border-amber-400',
    bannerBorderClass: 'border-slate-900',
    subHeaderBgClass: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white',
    tagBgClass: 'bg-slate-900 text-white',
    pillBgClass: 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
    hexBannerBg: '#0f172a',
    hexBannerText: '#ffffff',
    hexBorder: '#0f172a',
    hexSubHeaderBg: '#f1f5f9',
    hexSubHeaderText: '#0f172a',
    hexTagBg: '#0f172a',
    hexTagText: '#ffffff',
    hexBannerAccentBottom: '#fbbf24'
  },
  rose: {
    key: 'rose',
    label: 'Kırmızı (TTF Ulusal)',
    bannerBgClass: 'bg-rose-600 text-white',
    bannerBorderClass: 'border-rose-600',
    subHeaderBgClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100',
    tagBgClass: 'bg-rose-600 text-white',
    pillBgClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    hexBannerBg: '#dc2626',
    hexBannerText: '#ffffff',
    hexBorder: '#dc2626',
    hexSubHeaderBg: '#fef2f2',
    hexSubHeaderText: '#7f1d1d',
    hexTagBg: '#dc2626',
    hexTagText: '#ffffff'
  }
};

export const TOUR_TYPE_DEFAULT_COLOR: Record<TourTypeKey, TournamentColorTheme> = {
  ITF_WTT: 'blue',
  ITF_JUNIORS: 'emerald',
  ITF_MASTERS: 'amber',
  TENNIS_EUROPE: 'teal',
  ATP_CHALLENGER: 'slate',
  WTA: 'purple',
  TTF_NATIONAL: 'rose'
};

export function getTourTypeFromCategory(kategori: string): TourTypeKey {
  const k = (kategori || '').toUpperCase();
  if (k.includes('ATP') || k.includes('CHALLENGER')) return 'ATP_CHALLENGER';
  if (k.includes('WTA')) return 'WTA';
  if (k.includes('TE -') || k.includes('TENNIS EUROPE') || k.includes('U14') || k.includes('U16') || k.includes('U12') || k.includes('SUMMER CUP') || k.includes('WINTER CUP')) return 'TENNIS_EUROPE';
  if (k.includes('MT') || k.includes('MASTER') || k.includes('WORLD TEAM') || k.includes('WORLD INDIVIDUAL') || k.includes('EUROPEAN CLUB')) return 'ITF_MASTERS';
  if (k.includes('J30') || k.includes('J60') || k.includes('J100') || k.includes('J200') || k.includes('JUNIOR')) return 'ITF_JUNIORS';
  if (k.includes('15K') || k.includes('25K') || k.includes('35K') || k.includes('W35') || k.includes('WTT') || k.includes('COMBINED')) return 'ITF_WTT';
  return 'TTF_NATIONAL';
}

export function getTourShortName(tourType: TourTypeKey): string {
  switch (tourType) {
    case 'ITF_WTT': return 'ITF WTT';
    case 'ITF_JUNIORS': return 'ITF Juniors';
    case 'ITF_MASTERS': return 'ITF Masters';
    case 'TENNIS_EUROPE': return 'Tennis Europe';
    case 'ATP_CHALLENGER': return 'ATP Challenger';
    case 'WTA': return 'WTA 125';
    default: return 'TTF Ulusal';
  }
}

export function resolveTourPalette(
  tourType: TourTypeKey,
  customColor?: TournamentColorTheme
): TourColorPalette {
  const key = customColor || TOUR_TYPE_DEFAULT_COLOR[tourType] || 'blue';
  return TOUR_COLOR_PALETTES[key] || TOUR_COLOR_PALETTES.blue;
}
