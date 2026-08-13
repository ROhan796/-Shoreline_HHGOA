export type CardFormat = 'A' | 'B';

export interface CardData {
  format: CardFormat;
  photoUrl: string | null;
  photoOffsetX: number; // -100 to 100
  photoOffsetY: number; // -100 to 100
  photoScale: number;   // 0.5 to 2.5
  photoRotate: number;  // -180 to 180
  name: string;
  role: string;
  title: string;
  isAiGenerating?: boolean;
  accentColor?: string; // e.g. '#FF6B2B' or '#00C9A7' or '#E2E8F0'
  frameVariant?: 'classic' | 'neon' | 'cyber' | 'minimal';
}

export interface SavedCard {
  id: string;
  slug: string;
  format: CardFormat;
  name: string;
  role: string;
  title: string;
  imageDataUrl: string;
  imageUrl: string;
  createdAt: string;
  sharesCount: number;
}

export interface AdminStats {
  totalCards: number;
  formatBRatio: number;
  shareRate: number;
  todayCount: number;
  sharesToday: number;
}

export interface TimelineData {
  day: string;
  generations: number;
  shares: number;
}
