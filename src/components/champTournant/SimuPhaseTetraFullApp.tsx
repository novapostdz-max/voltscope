/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from '../Header';
import { ExamCaseStudy } from '../ExamCaseStudy';
import { RotatingFieldSimulator } from '../RotatingFieldSimulator';
import { PermutationsLab } from '../PermutationsLab';
import { AiTutor } from '../AiTutor';
import { Radio, ArrowLeft } from 'lucide-react';

interface SimuPhaseTetraFullAppProps {
  onOpenRTCC?: () => void;
  onBackHome?: () => void;
}

export const SimuPhaseTetraFullApp: React.FC<SimuPhaseTetraFullAppProps> = ({
  onOpenRTCC,
  onBackHome,
}) => {
  const [activeTab, setActiveTab] = useState<'exam' | 'simulation' | 'permutations' | 'tutor'>('exam');

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
      {/* Top Banner Navigation Bar */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content View with padding */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {activeTab === 'exam' && <ExamCaseStudy />}
        {activeTab === 'simulation' && <RotatingFieldSimulator />}
        {activeTab === 'permutations' && <PermutationsLab />}
        {activeTab === 'tutor' && <AiTutor />}
      </main>

      {/* Footer Navigation Bar */}
      <footer className="p-4 border-t border-slate-900 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          {onBackHome && (
            <button
              onClick={onBackHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à VoltScope</span>
            </button>
          )}

          {onOpenRTCC && (
            <button
              onClick={onOpenRTCC}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900 text-sky-300 border border-sky-800 transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Fenêtre Relais RTCC</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500">
          SimuPhase Tétra · Compteur &amp; Champ Tournant · Conforme RGIE Livre 1
        </div>
      </footer>
    </div>
  );
};
