import React, { useState, useEffect, useRef } from 'react';
import { CardData, CardFormat, SavedCard } from '../types';
import { apiFetch } from '../api';
import { CanvasRenderer } from './CanvasRenderer';
import {
  UploadCloud,
  Sparkles,
  RefreshCw,
  Sliders,
  RotateCw,
  ZoomIn,
  Move,
  Flame,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface GeneratorStudioProps {
  initialFormat?: CardFormat;
  onCardGenerated: (savedCard: SavedCard, dataUrl: string) => void;
  onCancel?: () => void;
}

export const GeneratorStudio: React.FC<GeneratorStudioProps> = ({
  initialFormat = 'B',
  onCardGenerated,
}) => {
  const [cardData, setCardData] = useState<CardData>({
    format: initialFormat,
    photoUrl: null,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoScale: 1,
    photoRotate: 0,
    name: 'Rohan Manna',
    role: 'Full Stack · AI Engineer',
    title: 'The Async Alchemist',
    isAiGenerating: false,
  });

  const [renderedDataUrl, setRenderedDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [typewriterTitle, setTypewriterTitle] = useState(cardData.title);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debouncedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize typewriter effect when title changes from AI
  const triggerTypewriter = (newTitle: string) => {
    setIsTyping(true);
    setTypewriterTitle('');
    let idx = 0;

    const timer = setInterval(() => {
      if (idx <= newTitle.length) {
        setTypewriterTitle(newTitle.slice(0, idx));
        idx++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 25);
  };

  // Generate AI Title from server endpoint
  const generateAiTitle = async (stackVal?: string, nameVal?: string) => {
    setCardData((prev) => ({ ...prev, isAiGenerating: true }));
    try {
      const data = await apiFetch('/api/title', {
        method: 'POST',
        body: JSON.stringify({
          stack: stackVal || cardData.role,
          name: nameVal || cardData.name,
          role: cardData.role,
        }),
      });

      if (data.title) {
        setCardData((prev) => ({ ...prev, title: data.title, isAiGenerating: false }));
        triggerTypewriter(data.title);
      } else {
        setCardData((prev) => ({ ...prev, isAiGenerating: false }));
      }
    } catch (err) {
      setCardData((prev) => ({ ...prev, isAiGenerating: false }));
    }
  };

  // Handle Photo File Select / Drop
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCardData((prev) => ({
          ...prev,
          photoUrl: e.target!.result as string,
          photoOffsetX: 0,
          photoOffsetY: 0,
          photoScale: 1,
          photoRotate: 0,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Auto trigger AI title after user types in role field
  const handleRoleChange = (val: string) => {
    setCardData((prev) => ({ ...prev, role: val }));

    if (debouncedTimeoutRef.current) {
      clearTimeout(debouncedTimeoutRef.current);
    }
    debouncedTimeoutRef.current = setTimeout(() => {
      generateAiTitle(val, cardData.name);
    }, 700);
  };

  // Submit and Save Card
  const handleGenerate = async () => {
    if (!cardData.photoUrl) {
      setErrorMessage('Please upload a photo first!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const data = await apiFetch('/api/cards', {
        method: 'POST',
        body: JSON.stringify({
          format: cardData.format,
          name: cardData.name,
          role: cardData.role,
          title: cardData.title,
          imageDataUrl: renderedDataUrl,
        }),
      });

      if (data.success && data.card) {
        onCardGenerated(data.card, renderedDataUrl);
      } else {
        setErrorMessage('Failed to save card. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage('Network error during card generation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#F2F0EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A1A1A]/10 pb-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.5em] text-[#A0522D] font-sans font-bold">
              Edition Studio
            </span>
            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[#1A1A1A] mt-2">
              BUILDER PASS GENERATOR
            </h1>
            <p className="font-serif italic text-sm text-[#5A554C] mt-1">
              Customize your portrait, name, stack, and AI-curated title in real time.
            </p>
          </div>

          {/* Format Toggle Pill */}
          <div className="flex items-center gap-1 bg-[#E8E5DC] border border-[#1A1A1A]/10 p-1.5 self-center sm:self-auto">
            <button
              onClick={() => setCardData((prev) => ({ ...prev, format: 'A' }))}
              className={`px-4 py-2 text-xs font-sans uppercase tracking-[0.2em] transition-all cursor-pointer ${
                cardData.format === 'A'
                  ? 'bg-[#1A1A1A] text-[#F2F0EB] font-bold'
                  : 'text-[#5A554C] hover:text-[#1A1A1A]'
              }`}
            >
              Format A (PFP)
            </button>
            <button
              onClick={() => setCardData((prev) => ({ ...prev, format: 'B' }))}
              className={`px-4 py-2 text-xs font-sans uppercase tracking-[0.2em] transition-all cursor-pointer ${
                cardData.format === 'B'
                  ? 'bg-[#1A1A1A] text-[#F2F0EB] font-bold'
                  : 'text-[#5A554C] hover:text-[#1A1A1A]'
              }`}
            >
              Format B (Full Pass)
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#A0522D]/10 border border-[#A0522D] text-[#A0522D] text-xs font-sans uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs underline cursor-pointer font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Live Canvas Preview Panel */}
          <div className="lg:col-span-6 lg:sticky lg:top-28 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-sans uppercase tracking-[0.4em] text-[#A0522D] font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A0522D]" />
                Live Studio Render
              </span>
              <span className="text-[10px] font-sans uppercase tracking-widest text-[#5A554C]">
                {cardData.format === 'A' ? '1080 × 1080' : '1080 × 1350'}
              </span>
            </div>

            <CanvasRenderer
              cardData={cardData}
              onCanvasRendered={(dataUrl) => setRenderedDataUrl(dataUrl)}
            />

            <p className="text-[10px] font-sans uppercase tracking-widest text-[#5A554C] mt-3 text-center">
              ✦ Real-time vector layout synchronization on input change.
            </p>
          </div>

          {/* RIGHT: Control Panel */}
          <div className="lg:col-span-6 bg-[#E8E5DC] border border-[#1A1A1A]/10 p-6 sm:p-8 space-y-6">
            {/* STEP 1: Photo Upload */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-sans font-bold text-[#A0522D] uppercase tracking-[0.2em] flex items-center gap-2">
                  <span>STEP 1</span>
                  <span className="text-[#1A1A1A]">· Upload Portrait</span>
                </label>
                {cardData.photoUrl && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-sans text-[#A0522D] hover:underline cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                  >
                    <RefreshCw className="w-3 h-3" /> Replace Photo
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              {!cardData.photoUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed p-10 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-[#A0522D] bg-[#A0522D]/10'
                      : 'border-[#1A1A1A]/20 bg-[#FAF8F5] hover:border-[#1A1A1A] hover:bg-[#FFFFFF]'
                  }`}
                >
                  <div className="w-12 h-12 bg-[#1A1A1A] text-[#F2F0EB] flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-serif font-bold text-[#1A1A1A] mb-1">
                    Drop portrait photo here or click to browse
                  </p>
                  <p className="text-[10px] font-sans uppercase tracking-widest text-[#5A554C]">
                    Supports JPG, PNG, WEBP · Max 20MB
                  </p>
                </div>
              ) : (
                /* Photo Adjustment Controls */
                <div className="bg-[#FAF8F5] border border-[#1A1A1A]/10 p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs font-sans uppercase tracking-wider text-[#5A554C]">
                    <span className="flex items-center gap-1.5 text-[#1A1A1A] font-bold">
                      <Sliders className="w-3.5 h-3.5 text-[#A0522D]" /> Adjust Positioning
                    </span>
                    <button
                      onClick={() =>
                        setCardData((prev) => ({
                          ...prev,
                          photoOffsetX: 0,
                          photoOffsetY: 0,
                          photoScale: 1,
                          photoRotate: 0,
                        }))
                      }
                      className="text-[#A0522D] hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-sans text-[#5A554C] uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-3 h-3 text-[#A0522D]" /> Scale
                      </span>
                      <span>{Math.round(cardData.photoScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={cardData.photoScale}
                      onChange={(e) =>
                        setCardData((prev) => ({ ...prev, photoScale: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-[#1A1A1A] cursor-pointer"
                    />
                  </div>

                  {/* Pan X Slider */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans text-[#5A554C] uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Move className="w-3 h-3 text-[#1A1A1A]" /> Pan X
                        </span>
                        <span>{cardData.photoOffsetX}px</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={cardData.photoOffsetX}
                        onChange={(e) =>
                          setCardData((prev) => ({
                            ...prev,
                            photoOffsetX: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-[#1A1A1A] cursor-pointer"
                      />
                    </div>

                    {/* Pan Y Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans text-[#5A554C] uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Move className="w-3 h-3 text-[#1A1A1A]" /> Pan Y
                        </span>
                        <span>{cardData.photoOffsetY}px</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={cardData.photoOffsetY}
                        onChange={(e) =>
                          setCardData((prev) => ({
                            ...prev,
                            photoOffsetY: parseInt(e.target.value),
                          }))
                        }
                        className="w-full accent-[#1A1A1A] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Rotate Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-sans text-[#5A554C] uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <RotateCw className="w-3 h-3 text-[#A0522D]" /> Angle
                      </span>
                      <span>{cardData.photoRotate}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={cardData.photoRotate}
                      onChange={(e) =>
                        setCardData((prev) => ({
                          ...prev,
                          photoRotate: parseInt(e.target.value),
                        }))
                      }
                      className="w-full accent-[#A0522D] cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Name & Role */}
            <div className="space-y-4 border-t border-[#1A1A1A]/10 pt-6">
              <label className="text-xs font-sans font-bold text-[#A0522D] uppercase tracking-[0.2em] block">
                STEP 2 · ATTENDEE METADATA
              </label>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans uppercase tracking-wider text-[#5A554C] block">
                  Full Name
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={cardData.name}
                  onChange={(e) => setCardData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rohan Manna"
                  className="w-full bg-[#FAF8F5] border border-[#1A1A1A]/20 px-4 py-3 text-sm text-[#1A1A1A] font-serif focus:outline-none focus:border-[#1A1A1A] transition-all"
                />
              </div>

              {/* Role / Tech Stack Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-sans uppercase tracking-wider text-[#5A554C] block">
                  Role & Tech Focus
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={cardData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  placeholder="e.g. Full Stack · Next.js · AI"
                  className="w-full bg-[#FAF8F5] border border-[#1A1A1A]/20 px-4 py-3 text-sm text-[#1A1A1A] font-serif focus:outline-none focus:border-[#1A1A1A] transition-all"
                />
              </div>

              {/* AI Builder Title Box */}
              <div className="space-y-2 bg-[#1A1A1A] text-[#F2F0EB] p-5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-sans font-bold text-[#A0522D] uppercase tracking-[0.3em] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#A0522D]" />
                    AI Builder Title
                  </label>
                  <button
                    type="button"
                    onClick={() => generateAiTitle()}
                    disabled={cardData.isAiGenerating}
                    className="px-3 py-1 bg-[#A0522D] text-white text-[10px] font-sans uppercase tracking-wider hover:bg-white hover:text-black transition-all cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${cardData.isAiGenerating ? 'animate-spin' : ''}`} />
                    {cardData.isAiGenerating ? 'Synthesizing...' : 'Re-curate'}
                  </button>
                </div>

                <div className="mt-2 text-xl font-serif italic text-[#F2F0EB] min-h-[36px] flex items-center">
                  <span>"{isTyping ? typewriterTitle : cardData.title}"</span>
                  {isTyping && <span className="animate-blink text-[#A0522D]">|</span>}
                </div>
                <p className="text-[9px] font-sans uppercase tracking-widest text-[#8C867A]">
                  Gemini 3.6 Flash · Auto-generated from your tech focus
                </p>
              </div>
            </div>

            {/* STEP 3: Final Generate CTA */}
            <div className="border-t border-[#1A1A1A]/10 pt-6">
              <button
                onClick={handleGenerate}
                disabled={isSubmitting}
                className={`w-full py-4 text-xs font-sans font-bold uppercase tracking-[0.25em] text-center transition-all cursor-pointer flex items-center justify-center gap-3 ${
                  isSubmitting
                    ? 'bg-[#C2BBB0] text-[#5A554C] cursor-not-allowed'
                    : 'bg-[#1A1A1A] text-[#F2F0EB] hover:bg-[#A0522D] shadow-xl'
                }`}
              >
                <Flame className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : 'fill-current'}`} />
                <span>{isSubmitting ? 'Rendering Final Pass...' : 'Export Builder Pass'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
