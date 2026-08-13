import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '../api';
import { ShieldOff } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    (async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const data = await apiFetch('/api/auth/me', { headers });
        setIsAdmin(data.is_admin);
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] flex items-center justify-center">
        <div className="text-[#1A1A1A] font-serif text-xl animate-pulse">Checking access...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-[#F2F0EB] flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-[#A0522D] text-white flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8" />
          </div>
          <h1 className="font-serif font-bold text-3xl text-[#1A1A1A] mb-4">
            Admin Access Required
          </h1>
          <p className="font-serif italic text-sm text-[#5A554C] mb-8">
            Only the first registered user has admin privileges. Your account does not have admin access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
