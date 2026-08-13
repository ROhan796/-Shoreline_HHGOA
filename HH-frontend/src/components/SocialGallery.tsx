import React from 'react';
import { SavedCard } from '../types';
import { Share2, Heart, Sparkles } from 'lucide-react';

interface SocialGalleryProps {
  cards: SavedCard[];
  onSelectCard?: (card: SavedCard) => void;
}

export const SocialGallery: React.FC<SocialGalleryProps> = ({ cards, onSelectCard }) => {
  // Multiply list for continuous infinite marquee loop
  const displayCardsRow1 = [...cards, ...cards, ...cards];
  const displayCardsRow2 = [...cards].reverse();
  const row2Doubled = [...displayCardsRow2, ...displayCardsRow2, ...displayCardsRow2];

  return (
    <section className="py-20 bg-[#E8E5DC] relative overflow-hidden border-t border-b border-[#1A1A1A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-[#A0522D]">
          Edition Archive
        </span>
        <h2 className="font-serif font-bold text-3xl sm:text-5xl text-[#1A1A1A] mt-3">
          ATTENDEE PASSES IN THE WILD
        </h2>
        <p className="font-serif italic text-sm text-[#5A554C] mt-2">
          Curated collection of builder passes generated for Shoreline.
        </p>
      </div>

      {/* Marquee Row 1 */}
      <div className="flex overflow-hidden relative w-full mb-6 py-2">
        <div className="animate-marquee flex gap-6 px-4">
          {displayCardsRow1.map((card, idx) => (
            <div
              key={`r1-${card.id}-${idx}`}
              onClick={() => onSelectCard && onSelectCard(card)}
              className="w-64 sm:w-72 flex-shrink-0 bg-[#FAF8F5] border border-[#1A1A1A]/20 p-4 hover:border-[#1A1A1A] transition-all cursor-pointer group hover:-translate-y-1 shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-sans font-bold text-[#A0522D] uppercase tracking-[0.2em]">
                  FORMAT {card.format}
                </span>
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#5A554C]">
                  {card.sharesCount} shares
                </span>
              </div>
              <div className="w-full aspect-[4/3] bg-[#F2F0EB] border border-[#1A1A1A]/10 p-3 flex flex-col justify-between overflow-hidden relative">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-none bg-[#1A1A1A] text-[#F2F0EB] flex items-center justify-center font-serif font-bold text-xs">
                    {card.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-serif font-bold text-[#1A1A1A] truncate max-w-[140px]">{card.name}</p>
                    <p className="text-[9px] font-sans uppercase tracking-widest text-[#A0522D] truncate max-w-[140px]">{card.role}</p>
                  </div>
                </div>
                <div className="bg-[#1A1A1A] p-2 my-1">
                  <p className="text-[10px] font-serif italic text-[#F2F0EB] truncate">
                    "{card.title}"
                  </p>
                </div>
                <div className="flex justify-between items-center text-[9px] font-sans uppercase tracking-widest text-[#5A554C]">
                  <span>#Shoreline</span>
                  <span className="text-[#A0522D] font-bold">VERIFIED</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Row 2 (Reverse) */}
      <div className="flex overflow-hidden relative w-full py-2">
        <div className="animate-marquee-reverse flex gap-6 px-4">
          {row2Doubled.map((card, idx) => (
            <div
              key={`r2-${card.id}-${idx}`}
              onClick={() => onSelectCard && onSelectCard(card)}
              className="w-64 sm:w-72 flex-shrink-0 bg-[#FAF8F5] border border-[#1A1A1A]/20 p-4 hover:border-[#1A1A1A] transition-all cursor-pointer group hover:-translate-y-1 shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-sans font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">
                  FORMAT {card.format}
                </span>
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#5A554C]">
                  {card.sharesCount} shares
                </span>
              </div>
              <div className="w-full aspect-[4/3] bg-[#F2F0EB] border border-[#1A1A1A]/10 p-3 flex flex-col justify-between overflow-hidden relative">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-none bg-[#A0522D] text-white flex items-center justify-center font-serif font-bold text-xs">
                    {card.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-serif font-bold text-[#1A1A1A] truncate max-w-[140px]">{card.name}</p>
                    <p className="text-[9px] font-sans uppercase tracking-widest text-[#A0522D] truncate max-w-[140px]">{card.role}</p>
                  </div>
                </div>
                <div className="bg-[#1A1A1A] p-2 my-1">
                  <p className="text-[10px] font-serif italic text-[#F2F0EB] truncate">
                    "{card.title}"
                  </p>
                </div>
                <div className="flex justify-between items-center text-[9px] font-sans uppercase tracking-widest text-[#5A554C]">
                  <span>#HHGoa2026</span>
                  <span className="text-[#A0522D] font-bold">GOA PASS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
