import React from 'react';
import { UploadCloud, Sparkles, Share2, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartGenerator: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartGenerator }) => {
  const steps = [
    {
      num: '01',
      title: 'Drop Your Portrait',
      desc: 'Upload your photo. Adjust scale, pan, and angle positioning within the high-res frame.',
      icon: UploadCloud,
    },
    {
      num: '02',
      title: 'AI Title Synthesis',
      desc: 'Enter your name and tech focus. Gemini AI instantly curates a unique, witty builder title.',
      icon: Sparkles,
    },
    {
      num: '03',
      title: 'Export & Share Pass',
      desc: 'Download your high-res PNG pass and share directly to X with custom event tags.',
      icon: Share2,
    },
  ];

  return (
    <section className="py-24 bg-[#F2F0EB] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-[#A0522D]">
            Methodology
          </span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl text-[#1A1A1A] mt-3">
            HOW IT WORKS IN 3 STEPS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative bg-[#E8E5DC] border border-[#1A1A1A]/20 p-8 hover:border-[#1A1A1A] transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-[#1A1A1A] text-[#F2F0EB] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#A0522D]" />
                  </div>
                  <span className="font-serif text-3xl font-bold text-[#A0522D]/40 group-hover:text-[#A0522D] transition-colors">
                    {step.num}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-xl text-[#1A1A1A] mb-3">
                  {step.title}
                </h3>
                <p className="font-sans text-xs text-[#5A554C] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={onStartGenerator}
            className="px-8 py-4 bg-[#1A1A1A] text-[#F2F0EB] font-sans font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#A0522D] transition-all cursor-pointer inline-flex items-center gap-3 shadow-xl"
          >
            <span>Launch Studio Edition</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
