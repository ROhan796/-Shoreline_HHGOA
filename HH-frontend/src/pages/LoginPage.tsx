import React from 'react';
import { Navigate } from 'react-router-dom';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0805] flex items-center justify-center">
        <div className="text-[#F2EBD9] font-serif text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/generator" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0A0805] text-[#F2EBD9] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#1A1A1A] text-[#F2EBD9] flex items-center justify-center mx-auto mb-6 border border-[#3D3020]">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="font-serif font-bold text-3xl text-[#F2EBD9] mb-2">
          Sign In
        </h1>
        <p className="font-serif italic text-sm text-[#8A7B68] mb-8">
          Sign in with your organizer credentials to access the admin dashboard.
        </p>
        <div className="flex justify-center [&.cl-rootBox]:w-full [&.cl-card]:bg-[#1A1A1A] [&.cl-card]:border [&.cl-card]:border-[#3D3020] [&.cl-card]:shadow-xl">
          <SignIn
            routing="path"
            path="/login"
            afterSignInUrl="/generator"
            afterSignUpUrl="/generator"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-[#1A1A1A] border border-[#3D3020] shadow-xl',
                headerTitle: 'text-[#F2EBD9]',
                headerSubtitle: 'text-[#8A7B68]',
                formFieldLabel: 'text-[#8A7B68]',
                formFieldInput: 'bg-[#0A0805] border-[#3D3020] text-[#F2EBD9]',
                formButtonPrimary: 'bg-[#A0522D] hover:bg-[#8B4513]',
                footerActionLink: 'text-[#A0522D]',
                socialButtonsBlockButton: 'border-[#3D3020] text-[#F2EBD9]',
                dividerLine: 'bg-[#3D3020]',
                dividerText: 'text-[#8A7B68]',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};
