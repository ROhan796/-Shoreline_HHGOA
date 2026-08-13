import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { SavedCard } from '../types';
import { CardReveal3D } from './3d/CardReveal3D';
import {
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Flame,
  ArrowLeft,
} from 'lucide-react';

interface ResultScreenProps {
  savedCard: SavedCard;
  imageDataUrl: string;
  onMakeAnother: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  savedCard,
  imageDataUrl,
  onMakeAnother,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const shareUrl = `${window.location.origin}/share/${savedCard.slug}`;

  // Confetti burst on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B2B', '#00C9A7', '#FF9A5C', '#F2EBD9'],
      });
    } catch (e) {
      // Gracefully ignore if confetti is restricted
    }
  }, []);

  // Download card PNG
  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `shoreline-${savedCard.name.toLowerCase().replace(/\s+/g, '-')}-card.png`;
      link.href = imageDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(false);
      setDownloaded(true);

      setTimeout(() => setDownloaded(false), 3000);
    }, 400);
  };

  // Share to X or Native Mobile Share
  const handleShareToX = async () => {
    const text = `Just generated my Shoreline builder card! See you in Goa! 🌴💻 #Shoreline`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shoreline Builder Card',
          text,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to Twitter intent
      }
    }

    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  };

  // Copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#F2F0EB] flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 text-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#A0522D]/10 border border-[#A0522D]/30 text-[#A0522D] text-[10px] font-sans font-bold uppercase tracking-[0.3em] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>✦ BUILDER PASS RENDERED ✦</span>
        </div>

        <h1 className="font-serif font-bold text-4xl sm:text-6xl text-[#1A1A1A] tracking-tight mb-2">
          READY TO PUBLISH & FLEX
        </h1>
        <p className="font-serif italic text-sm text-[#5A554C] max-w-lg mx-auto mb-6">
          Your Shoreline {savedCard.format === 'A' ? 'PFP Frame Edition' : 'Full Pass Edition'} has been exported in high vector clarity.
        </p>

        {/* 3D Floating Card Reveal */}
        <CardReveal3D
          imageDataUrl={imageDataUrl}
          name={savedCard.name}
          format={savedCard.format}
        />

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto my-8">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:w-1/2 py-4 px-6 bg-[#1A1A1A] text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#A0522D] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Downloaded ✓</span>
              </>
            ) : (
              <>
                <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                <span>{downloading ? 'Preparing...' : 'Download PNG'}</span>
              </>
            )}
          </button>

          {/* Share to X Button */}
          <button
            onClick={handleShareToX}
            className="w-full sm:w-1/2 py-4 px-6 bg-[#E8E5DC] border border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-[#A0522D]" />
            <span>Share on X 🐦</span>
          </button>
        </div>

        {/* Copy Share Link Row */}
        <div className="max-w-md mx-auto bg-[#E8E5DC] border border-[#1A1A1A]/20 p-3 flex items-center justify-between gap-2 mb-8">
          <div className="truncate text-left font-sans text-xs text-[#5A554C] px-2">
            {shareUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#A0522D] text-[#F2F0EB] font-sans font-bold text-[10px] uppercase tracking-widest flex-shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Secondary Back Action */}
        <button
          onClick={onMakeAnother}
          className="text-xs font-sans uppercase tracking-widest text-[#5A554C] hover:text-[#1A1A1A] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Generate Another Edition</span>
        </button>
      </div>
    </div>
  );
};
