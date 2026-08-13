import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { CardFormat, SavedCard } from './types';
import { apiFetch } from './api';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { LandingHero } from './components/LandingHero';
import { GeneratorStudio } from './components/GeneratorStudio';
import { ResultScreen } from './components/ResultScreen';
import { SocialGallery } from './components/SocialGallery';
import { HowItWorks } from './components/HowItWorks';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { SharePage } from './pages/SharePage';

function HomePage() {
  const [galleryCards, setGalleryCards] = useState<SavedCard[]>([]);
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/generator', { replace: true });
      return;
    }
    apiFetch('/api/cards')
      .then((data) => {
        if (data.cards) {
          setGalleryCards(data.cards);
        }
      })
      .catch(() => {});
  }, [isSignedIn]);

  if (isSignedIn) return null;

  return (
    <>
      <LandingHero
        onSelectFormat={(format: CardFormat) => navigate('/generator')}
        onStartGenerator={() => navigate('/generator')}
        statsCount={1247 + galleryCards.length}
      />
      <HowItWorks onStartGenerator={() => navigate('/generator')} />
      <SocialGallery
        cards={galleryCards}
        onSelectCard={(card: SavedCard) => {
          navigate(`/share/${card.slug}`);
        }}
      />
    </>
  );
}

function GeneratorPage() {
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState('');
  const navigate = useNavigate();

  const handleCardGenerated = (card: SavedCard, dataUrl: string) => {
    setSavedCard(card);
    setCardDataUrl(dataUrl);
    navigate('/result', { state: { card, dataUrl } });
  };

  return (
    <GeneratorStudio
      initialFormat="B"
      onCardGenerated={handleCardGenerated}
      onCancel={() => navigate('/')}
    />
  );
}

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { card?: SavedCard; dataUrl?: string } | null;

  if (!state?.card) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif font-bold text-3xl text-[#1A1A1A] mb-4">No Card Generated</h1>
          <button
            onClick={() => navigate('/generator')}
            className="px-6 py-3 bg-[#1A1A1A] text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#A0522D] transition-all cursor-pointer"
          >
            Generate a Card
          </button>
        </div>
      </div>
    );
  }

  return (
    <ResultScreen
      savedCard={state.card}
      imageDataUrl={state.dataUrl || ''}
      onMakeAnother={() => navigate('/generator')}
    />
  );
}

function GalleryPage() {
  const [galleryCards, setGalleryCards] = useState<SavedCard[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/api/cards')
      .then((data) => {
        if (data.cards) {
          setGalleryCards(data.cards);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="pt-24 pb-20">
      <SocialGallery
        cards={galleryCards}
        onSelectCard={(card: SavedCard) => navigate(`/share/${card.slug}`)}
      />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0A0805] text-[#F2EBD9] font-sans-body selection:bg-[#FF6B2B] selection:text-black flex flex-col justify-between">
      <Navigation />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/share/:slug" element={<SharePage />} />
          <Route path="/generator" element={<ProtectedRoute><GeneratorPage /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <AppFooter />
    </div>
  );
}

function AppFooter() {
  const { isSignedIn } = useAuth();
  const { isAdmin } = useNavState();
  const navigate = useNavigate();

  return (
    <footer className="border-t border-[#3D3020] bg-[#0A0805] py-8 text-xs font-mono-code text-[#8A7B68]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF6B2B]" />
          <span className="text-[#F2EBD9] font-bold">SHORELINE</span>
          <span>· Frame & Builder ID Generator</span>
        </div>

        <div className="flex items-center gap-6 text-[11px] uppercase tracking-wider font-mono-eyebrow">
          <button onClick={() => navigate('/')} className="hover:text-[#FF6B2B] transition-colors cursor-pointer">
            Home
          </button>
          <button onClick={() => navigate(isSignedIn ? '/generator' : '/login')} className="hover:text-[#FF6B2B] transition-colors cursor-pointer">
            Studio
          </button>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className="hover:text-[#00C9A7] transition-colors cursor-pointer">
              Admin
            </button>
          )}
          <span className="text-[#FF6B2B]">#Shoreline</span>
        </div>

        <div className="text-[10px] text-[#5C5044]">
          Crafted for Shoreline · Brutalist Tropics
        </div>
      </div>
    </footer>
  );
}

function useNavState() {
  const { isSignedIn, getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      (async () => {
        try {
          const token = await getToken();
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const data = await apiFetch('/api/auth/me', { headers });
          setIsAdmin(data.is_admin);
        } catch {
          setIsAdmin(false);
        }
      })();
    } else {
      setIsAdmin(false);
    }
  }, [isSignedIn]);

  return { isAdmin };
}
