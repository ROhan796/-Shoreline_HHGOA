import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { SavedCard } from '../types';
import { CardReveal3D } from '../components/3d/CardReveal3D';
import {
  Download,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const SharePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<SavedCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiFetch(`/api/cards/${slug}`)
      .then((data) => {
        if (data.card) {
          setCard(data.card);
        } else {
          setError('Card not found');
        }
      })
      .catch(() => setError('Card not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDownload = () => {
    if (!card) return;
    const link = document.createElement('a');
    link.download = `shoreline-${card.name.toLowerCase().replace(/\s+/g, '-')}-card.png`;
    link.href = card.imageDataUrl || card.imageUrl || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareToX = () => {
    if (!card) return;
    const shareUrl = `${window.location.origin}/share/${card.slug}`;
    const text = `Just generated my Shoreline builder card! See you in Goa! #Shoreline`;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] flex items-center justify-center">
        <div className="text-[#1A1A1A] font-serif text-xl animate-pulse">Loading card...</div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif font-bold text-3xl text-[#1A1A1A] mb-4">Card Not Found</h1>
          <p className="font-serif italic text-sm text-[#5A554C] mb-8">This card may have been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#1A1A1A] text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#A0522D] transition-all cursor-pointer"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/share/${card.slug}`;

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#F2F0EB] flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#A0522D]/10 border border-[#A0522D]/30 text-[#A0522D] text-[10px] font-sans font-bold uppercase tracking-[0.3em] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>BUILDER PASS</span>
        </div>

        <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[#1A1A1A] tracking-tight mb-2">
          {card.name}
        </h1>
        <p className="font-serif italic text-sm text-[#5A554C] mb-6">
          {card.role} — "{card.title}"
        </p>

        {(card.imageDataUrl || card.imageUrl) && (
          <CardReveal3D
            imageDataUrl={card.imageDataUrl || card.imageUrl}
            name={card.name}
            format={card.format}
          />
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto my-8">
          <button
            onClick={handleDownload}
            className="w-full sm:w-1/2 py-4 px-6 bg-[#1A1A1A] text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#A0522D] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handleShareToX}
            className="w-full sm:w-1/2 py-4 px-6 bg-[#E8E5DC] border border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-[#A0522D]" />
            <span>Share on X</span>
          </button>
        </div>

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

        <button
          onClick={() => navigate('/')}
          className="text-xs font-sans uppercase tracking-widest text-[#5A554C] hover:text-[#1A1A1A] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};
