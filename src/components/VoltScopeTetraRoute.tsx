/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { SimuPhaseTetraBench } from "~/components/champTournant/SimuPhaseTetraBench";
import { ExamCaseStudy } from "~/components/ExamCaseStudy";
import { RotatingFieldSimulator } from "~/components/RotatingFieldSimulator";

export default function VoltScopeTetraRoute() {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<'bench' | 'simulator' | 'casestudy'>('bench');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8 text-slate-400 font-mono">Chargement du banc VoltScope...</div>;
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white flex flex-col gap-4">
      {/* Sélecteur de vue : Banc SimuPhase Tétra, Simulateur Moteur ou Étude de cas */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('bench')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeView === 'bench'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            ⚡ SimuPhase Tétra (Banc &amp; Contrôleur)
          </button>
          <button
            onClick={() => setActiveView('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeView === 'simulator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🔬 Simulateur Moteur &amp; Ferraris
          </button>
          <button
            onClick={() => setActiveView('casestudy')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeView === 'casestudy'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            📝 Étude de Cas Examen
          </button>
        </div>
      </div>

      {activeView === 'bench' ? (
        <SimuPhaseTetraBench
          onOpenExamCaseStudy={() => setActiveView('casestudy')}
          onOpenMotorSimulator={() => setActiveView('simulator')}
        />
      ) : activeView === 'simulator' ? (
        <RotatingFieldSimulator onOpenExamCaseStudy={() => setActiveView('casestudy')} />
      ) : (
        <ExamCaseStudy onOpenSimulator={() => setActiveView('simulator')} />
      )}
    </div>
  );
}
