import React, { useState } from 'react';
import { Zap, Volume2, VolumeX, ShieldCheck, HelpCircle } from 'lucide-react';
import { audioService } from '../utils/audio';

interface HeaderProps {
  activeTab: 'exam' | 'simulation' | 'permutations' | 'tutor';
  onSelectTab: (tab: 'exam' | 'simulation' | 'permutations' | 'tutor') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const [soundActive, setSoundActive] = useState(false);

  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    audioService.setEnabled(nextState);
  };

  const navItems = [
    { id: 'exam', label: "Cas de ton Examen", badge: "Priorité" },
    { id: 'simulation', label: "Champ Tournant & Moteur", badge: "Ferraris" },
    { id: 'permutations', label: "6 Permutations & Dangers", badge: "Atelier" },
    { id: 'tutor', label: "Assistant IA Électro", badge: "Gemini" },
  ] as const;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl">
              <Zap className="w-6 h-6 fill-current text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">
                  SIMUPHASE <span className="text-amber-400">TÉTRA</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  3x400V + N
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Comprendre le champ tournant, la rotation horlogique &amp; le cas d&apos;examen
              </p>
            </div>
          </div>

          {/* Sound & Status actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                soundActive
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Activer le son réaliste 50Hz et moteur"
            >
              {soundActive ? (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="hidden md:inline font-mono">Son 50Hz : ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden md:inline font-mono">Son 50Hz : OFF</span>
                </>
              )}
            </button>
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conforme CENELEC HD 308 S2 / RGIE</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-semibold shadow-inner border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'exam' && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Ton Examen
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
