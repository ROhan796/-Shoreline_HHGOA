import React, { useRef, useState } from 'react';

interface CardReveal3DProps {
  imageDataUrl: string;
  name?: string;
  format?: 'A' | 'B';
}

export const CardReveal3D: React.FC<CardReveal3DProps> = ({
  imageDataUrl,
  name,
  format = 'B',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(-6);
  const [rotY, setRotY] = useState(8);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateY = (x / (rect.width / 2)) * 18;
    const rotateX = -(y / (rect.height / 2)) * 18;

    setRotX(rotateX);
    setRotY(rotateY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(-6);
    setRotY(8);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1200px' }}
      className="relative w-full max-w-sm sm:max-w-md mx-auto my-6 select-none cursor-grab active:cursor-grabbing"
    >
      {/* Subtle Drop Shadow */}
      <div className="absolute -inset-2 bg-black/5 blur-xl pointer-events-none" />

      {/* Floating 3D card */}
      <div
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${
            isHovered ? 1.04 : 1
          }, ${isHovered ? 1.04 : 1}, 1)`,
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="relative rounded-none bg-[#FAF8F5] border-2 border-[#1A1A1A] p-2.5 shadow-2xl overflow-hidden group transition-all"
      >
        {/* Card Canvas Image */}
        <div className="relative w-full overflow-hidden bg-[#F2F0EB] border border-[#1A1A1A]/10">
          <img
            src={imageDataUrl}
            alt={`${name || 'Builder'}'s Shoreline Card`}
            className="w-full h-auto object-contain block transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Glare effect */}
        <div
          style={{
            background: `radial-gradient(circle at ${50 + rotY * 3}% ${
              50 - rotX * 3
            }%, rgba(255, 255, 255, 0.25) 0%, transparent 60%)`,
          }}
          className="absolute inset-0 pointer-events-none"
        />
      </div>
    </div>
  );
};
