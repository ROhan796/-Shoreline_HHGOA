import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, SignInButton, UserButton } from '@clerk/clerk-react';
import { apiFetch } from '../api';
import { Sparkles, LayoutDashboard, Image as ImageIcon, Home, ChevronRight } from 'lucide-react';

export const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isSignedIn, getToken } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || location.pathname !== '/'
          ? 'bg-[#F2F0EB]/95 backdrop-blur-md border-b border-[#1A1A1A]/10 py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to={isSignedIn ? '/generator' : '/'}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="relative w-10 h-10 rounded-sm bg-[#1A1A1A] border border-[#1A1A1A] flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="font-serif text-lg font-bold text-[#F2F0EB]">HH</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#A0522D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-[#1A1A1A] group-hover:text-[#A0522D] transition-colors uppercase">
                SHORELINE
              </span>
              <span className="hidden sm:inline-block font-sans text-[10px] uppercase tracking-[0.2em] text-[#A0522D] bg-[#A0522D]/10 px-2 py-0.5 border border-[#A0522D]/20 font-bold">
                Official Generator
              </span>
            </div>
            <p className="text-[10px] font-sans uppercase tracking-widest text-[#5A554C] hidden sm:block">
              Editorial Builder Pass & Frame Studio
            </p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-8 font-sans text-[11px] uppercase tracking-[0.25em]">
          {!isSignedIn && (
            <Link
              to="/"
              className={`transition-all ${
                isActive('/') ? 'font-bold border-b border-[#1A1A1A] text-[#1A1A1A]' : 'text-[#5A554C] hover:line-through'
              }`}
            >
              Overview
            </Link>
          )}
          <Link
            to={isSignedIn ? '/generator' : '/login'}
            className={`transition-all ${
              isActive('/generator') ? 'font-bold border-b border-[#1A1A1A] text-[#1A1A1A]' : 'text-[#5A554C] hover:line-through'
            }`}
          >
            Studio
          </Link>
          <Link
            to="/gallery"
            className={`transition-all ${
              isActive('/gallery') ? 'font-bold border-b border-[#1A1A1A] text-[#1A1A1A]' : 'text-[#5A554C] hover:line-through'
            }`}
          >
            Journal
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`transition-all ${
                isActive('/admin') ? 'font-bold border-b border-[#A0522D] text-[#A0522D]' : 'text-[#5A554C] hover:text-[#A0522D]'
              }`}
            >
              Curator
            </Link>
          )}
        </div>

        {/* Right CTA + Auth */}
        <div className="flex items-center gap-3">
          <Link
            to={isSignedIn ? '/generator' : '/login'}
            className="group overflow-hidden rounded-none bg-[#1A1A1A] text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] px-6 py-3 border border-[#1A1A1A] hover:bg-[#A0522D] hover:border-[#A0522D] transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F2F0EB]" />
            <span>Create Pass</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Clerk Auth */}
          {isSignedIn ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-9 h-9',
                },
              }}
            />
          ) : (
            <Link to="/login" className="px-4 py-2.5 bg-[#A0522D] text-white text-[10px] font-sans font-bold uppercase tracking-[0.2em] hover:bg-[#8B4513] transition-all">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden items-center justify-around bg-[#E8E5DC] border-t border-[#1A1A1A]/10 mt-3 py-2 px-2">
        <Link
          to={isSignedIn ? '/generator' : '/'}
          className={`flex flex-col items-center text-[10px] font-sans uppercase tracking-wider ${
            isActive('/') || isActive('/generator') ? 'text-[#1A1A1A] font-bold' : 'text-[#5A554C]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>{isSignedIn ? 'Studio' : 'Home'}</span>
        </Link>
        <Link
          to={isSignedIn ? '/generator' : '/login'}
          className={`flex flex-col items-center text-[10px] font-sans uppercase tracking-wider ${
            isActive('/generator') ? 'text-[#A0522D] font-bold' : 'text-[#5A554C]'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span>Studio</span>
        </Link>
        <Link
          to="/gallery"
          className={`flex flex-col items-center text-[10px] font-sans uppercase tracking-wider ${
            isActive('/gallery') ? 'text-[#1A1A1A] font-bold' : 'text-[#5A554C]'
          }`}
        >
          <ImageIcon className="w-4 h-4 mb-0.5" />
          <span>Journal</span>
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            className={`flex flex-col items-center text-[10px] font-sans uppercase tracking-wider ${
              isActive('/admin') ? 'text-[#A0522D] font-bold' : 'text-[#5A554C]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
};
