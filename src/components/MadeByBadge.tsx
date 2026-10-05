/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface MadeByBadgeProps {
  variant?: 'banner' | 'badge' | 'compact' | 'subtle';
  className?: string;
  showZap?: boolean;
}

export const MadeByBadge: React.FC<MadeByBadgeProps> = ({
  variant = 'badge',
  className = '',
  showZap = true,
}) => {
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-neon-pulse backdrop-blur-md ${className}`}
      >
        {/* Blinking indicator beacon */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-90" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        </span>
        <span className="font-mono text-[11px] font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1">
          <span className="text-slate-400 font-medium">made by</span>
          <span className="text-cyan-300 font-extrabold drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-flash-blink">
            boularabi amine
          </span>
        </span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`w-full flex justify-center py-4 ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative group cursor-pointer"
        >
          {/* Animated Ambient Glow Halo */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition duration-700 animate-pulse" />

          {/* Main Card Container */}
          <div className="relative flex items-center gap-3.5 px-6 py-3 bg-slate-950/95 border-2 border-cyan-400/60 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_45px_rgba(6,182,212,0.6)] animate-neon-pulse transition-all duration-300">
            {/* Pulsating & Blinking Dual Electric Beacon */}
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-cyan-400 opacity-80" />
              <span className="animate-pulse absolute inline-flex h-7 w-7 rounded-full bg-blue-500/40" />
              <div className="relative w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 border border-white shadow-[0_0_12px_#22d3ee] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </div>
            </div>

            {/* Glowing & Blinking Content */}
            <div className="flex items-center gap-2.5">
              {showZap && (
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
              )}
              
              <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                made by
              </span>

              {/* Blinking / glowing creator signature */}
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-black font-mono tracking-wider bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-200 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(34,211,238,0.95)] animate-flash-blink">
                  boularabi amine
                </span>
                <Sparkles className="w-4 h-4 text-cyan-300 animate-spin transition-transform duration-1000" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            {/* Certified Badge Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-400/40 text-[10.5px] font-mono font-bold text-cyan-300 shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Concepteur VoltScope</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Default 'badge' style with blinking neon glow
  return (
    <div
      className={`relative inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-slate-950/95 hover:bg-slate-900 border-2 border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.55)] animate-neon-pulse backdrop-blur-md transition-all duration-300 select-none ${className}`}
    >
      {/* Blinking Neon Dot with dual wave */}
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-90" />
        <span className="animate-pulse absolute -inset-0.5 inline-flex rounded-full bg-cyan-300/50" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-tr from-cyan-400 to-sky-300 border border-white shadow-[0_0_10px_#22d3ee]" />
      </span>

      {showZap && (
        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      )}

      {/* Styled text with pulsating neon glow and blinking highlights */}
      <span className="font-mono text-xs tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
        <span className="text-slate-400 font-semibold">made by</span>
        <span className="font-black bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-200 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-flash-blink tracking-wider">
          boularabi amine
        </span>
      </span>

      <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse drop-shadow-[0_0_6px_#22d3ee]" />
    </div>
  );
};
