import React, { useRef, useState } from 'react';
import { CardFormat } from '../../types';

interface Card3DProps {
  format: CardFormat;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const Card3D: React.FC<Card3DProps> = ({
  format,
  title,
  subtitle,
  description,
  badge,
  isSelected,
  onSelect,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Max 15 degree rotation
    const rotateY = (x / (rect.width / 2)) * 14;
    const rotateX = -(y / (rect.height / 2)) * 14;

    setRotX(rotateX);
    setRotY(rotateY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  const isFormatA = format === 'A';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      style={{
        perspective: '1000px',
      }}
      className="cursor-pointer group select-none w-full max-w-sm"
    >
      <div
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${isHovered ? 1.03 : 1}, ${
            isHovered ? 1.03 : 1
          }, 1)`,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
        className={`relative rounded-none p-6 transition-all duration-300 border ${
          isSelected
            ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#F2F0EB] shadow-2xl'
            : 'bg-[#E8E5DC] border-[#1A1A1A]/20 hover:border-[#1A1A1A] hover:bg-[#FAF8F5]'
        }`}
      >
        {/* Format Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`font-sans text-[10px] tracking-[0.25em] uppercase font-bold px-2.5 py-1 ${
            isSelected ? 'bg-[#A0522D] text-white' : 'bg-[#A0522D]/10 text-[#A0522D] border border-[#A0522D]/20'
          }`}>
            {badge}
          </span>
          <span className={`text-[10px] font-sans uppercase tracking-widest ${
            isSelected ? 'text-[#D8D4C9]' : 'text-[#5A554C]'
          }`}>
            {isFormatA ? '1080 × 1080' : '1080 × 1350'}
          </span>
        </div>

        {/* Card Mock Visual Illustration */}
        <div className={`relative w-full aspect-square border p-4 mb-5 flex flex-col items-center justify-center overflow-hidden transition-colors ${
          isSelected ? 'bg-[#262626] border-[#333333]' : 'bg-[#F2F0EB] border-[#1A1A1A]/10'
        }`}>
          {isFormatA ? (
            /* Format A Graphic: PFP Frame */
            <div className="relative w-28 h-28 rounded-full border-2 border-[#A0522D] p-1 flex items-center justify-center bg-[#1A1A1A]">
              <div className="w-full h-full rounded-full bg-[#E8E5DC] flex items-center justify-center overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center text-base font-serif font-bold text-[#F2F0EB]">
                  HH
                </div>
              </div>
              {/* Circular tropical wave frame badge */}
              <div className="absolute -bottom-2 -right-1 bg-[#A0522D] text-white text-[9px] font-sans font-bold px-2 py-0.5 uppercase tracking-wider">
                GOA '26
              </div>
            </div>
          ) : (
            /* Format B Graphic: Full Builder ID Card */
            <div className="w-full h-full bg-[#FAF8F5] border border-[#1A1A1A]/20 p-3 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-none border border-[#1A1A1A] bg-[#1A1A1A] flex items-center justify-center text-xs font-serif font-bold text-[#F2F0EB]">
                    ID
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-serif font-bold text-[#1A1A1A] leading-none">Rohan Manna</p>
                    <p className="text-[9px] font-sans uppercase tracking-widest text-[#A0522D] mt-1">Full Stack · AI</p>
                  </div>
                </div>
                <div className="text-[9px] font-sans text-[#5A554C] uppercase tracking-widest">HH-2026</div>
              </div>

              {/* Fake AI title highlight */}
              <div className="bg-[#1A1A1A] text-[#F2F0EB] border border-[#1A1A1A] p-1.5 my-1 text-center">
                <p className="text-[10px] font-serif italic text-[#F2F0EB]">"The Async Alchemist"</p>
              </div>

              <div className="flex justify-between items-center text-[8px] font-sans uppercase tracking-widest text-[#5A554C] border-t border-[#1A1A1A]/10 pt-1">
                <span>#Shoreline</span>
                <span>BUILDER PASS</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Info */}
        <h3 className={`font-serif text-2xl font-bold mb-1 ${
          isSelected ? 'text-[#F2F0EB]' : 'text-[#1A1A1A]'
        }`}>
          {title}
        </h3>
        <p className="text-xs font-serif italic text-[#A0522D] mb-2">{subtitle}</p>
        <p className={`text-xs leading-relaxed mb-6 font-sans ${
          isSelected ? 'text-[#D8D4C9]' : 'text-[#5A554C]'
        }`}>{description}</p>

        {/* Action button inside card */}
        <div
          className={`w-full py-3 px-4 font-sans font-bold text-xs uppercase tracking-[0.2em] text-center transition-all ${
            isSelected
              ? 'bg-[#A0522D] text-white'
              : 'bg-[#1A1A1A] text-[#F2F0EB] hover:bg-[#A0522D]'
          }`}
        >
          {isSelected ? 'Selected Format' : 'Select Edition →'}
        </div>
      </div>
    </div>
  );
};
