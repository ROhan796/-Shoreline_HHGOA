import React from 'react';
import { HeroParticles } from './3d/HeroParticles';
import { Card3D } from './3d/Card3D';
import { CardFormat } from '../types';
import { Sparkles, ArrowDown, Zap, Shield, Share2, Flame } from 'lucide-react';

interface LandingHeroProps {
  onSelectFormat: (format: CardFormat) => void;
  onStartGenerator: () => void;
  statsCount?: number;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSelectFormat,
  onStartGenerator,
  statsCount = 1247,
}) => {
  return (
    <div className="relative min-h-screen pt-32 pb-20 flex flex-col justify-between overflow-hidden bg-[#F2F0EB]">
      {/* Three.js Canvas Background */}
      <HeroParticles />

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 text-center flex flex-col items-center">
        {/* Eyebrow badge - Editorial style */}
        <span className="text-[10px] uppercase tracking-[0.5em] mb-6 text-[#A0522D] font-sans font-bold">
          Project 2026 — Shoreline
        </span>

        {/* Hero Display Typography - Editorial Serif */}
        <h1 className="font-serif font-bold text-6xl sm:text-8xl lg:text-9xl text-[#1A1A1A] tracking-tight leading-[0.88] mb-8 max-w-5xl">
          The Pass of<br />
          <span className="italic font-normal text-[#A0522D]">
            Hackers & Sun.
          </span>
        </h1>

        {/* Subtitle Body Copy */}
        <div className="max-w-xl mx-auto space-y-4 mb-12">
          <p className="text-xl sm:text-2xl leading-relaxed italic text-[#1A1A1A]/80 font-serif">
            A minimalist intervention in digital identity. Frame your avatar and build your official attendee pass for Shoreline.
          </p>
          <p className="text-xs leading-loose font-sans text-[#5A554C] uppercase tracking-[0.25em]">
            Renders in 10 seconds · Exportable high-resolution PNG
          </p>
        </div>

        {/* Primary CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-12">
          <button
            onClick={onStartGenerator}
            className="w-full sm:w-auto px-10 py-5 rounded-none bg-[#1A1A1A] text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.25em] border border-[#1A1A1A] hover:bg-[#A0522D] hover:border-[#A0522D] transition-all cursor-pointer flex items-center justify-center gap-3 shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-[#F2F0EB]" />
            <span>Design Your Pass</span>
          </button>
        </div>

        {/* Stat Pill - Editorial style */}
        <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-[#E8E5DC] border border-[#1A1A1A]/10 text-xs font-sans uppercase tracking-[0.2em] text-[#1A1A1A]">
          <span className="w-2 h-2 rounded-full bg-[#A0522D]" />
          <span><strong className="font-bold">{statsCount.toLocaleString()}</strong> Passes Curated to Date</span>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-16 flex flex-col items-center gap-2 text-[#5A554C] text-[10px] font-sans uppercase tracking-[0.4em]">
          <span>Select Format Edition Below</span>
          <ArrowDown className="w-4 h-4 text-[#A0522D] animate-bounce" />
        </div>
      </div>

      {/* Format Picker Section */}
      <div id="format-picker" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#1A1A1A]/10">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.5em] text-[#A0522D] font-sans font-bold">
            Curated Formats
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-5xl text-[#1A1A1A] mt-2">
            Select Edition Format
          </h2>
          <p className="font-serif italic text-base text-[#5A554C] mt-2 max-w-md mx-auto">
            Choose your framing layout to launch the real-time studio renderer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
          <Card3D
            format="A"
            badge="FORMAT A"
            title="PFP Frame"
            subtitle="1080 × 1080 Square Avatar"
            description="Your photograph bounded by the minimal editorial Shoreline tropical border line. Tailored for profile avatars."
            onSelect={() => onSelectFormat('A')}
          />
          <Card3D
            format="B"
            badge="FORMAT B"
            title="Builder ID Card"
            subtitle="1080 × 1350 Full Pass"
            description="Comprehensive exhibition pass featuring attendee portrait, tech stack, and custom AI-curated Builder Title."
            onSelect={() => onSelectFormat('B')}
          />
        </div>
      </div>
    </div>
  );
};
