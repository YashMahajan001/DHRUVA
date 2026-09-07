import React from 'react';
import { ShieldCheck, Wrench, AlertTriangle } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: string;
  isAdvisory?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isAdvisory = true,
}) => {
  return (
    <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg p-2.5 flex items-start gap-2">
      <div className="w-5 h-5 rounded bg-[#10b981]/20 text-[#10b981] flex items-center justify-center shrink-0 mt-0.5">
        <ShieldCheck className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 font-sans text-xs">
        <div className="flex items-center justify-between font-mono text-[8.5px] uppercase font-bold text-[#10b981] mb-0.5">
          <span>Action Recommendation</span>
          {isAdvisory && (
            <span className="text-[#849495] text-[7.5px] bg-[#090e1b] px-1 py-0.2 rounded border border-[#3b494b]/30">
              ADVISORY ONLY
            </span>
          )}
        </div>
        <p className="text-[#6ee7b7] font-medium leading-snug">{recommendation}</p>
      </div>
    </div>
  );
};
