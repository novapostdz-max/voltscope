import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  RotateCcw, 
  ShieldAlert, 
  Droplets, 
  Wind, 
  ArrowUpDown, 
  Repeat, 
  Disc,
  HelpCircle,
  Zap
} from 'lucide-react';
import { INDUSTRIAL_MACHINES } from '../utils/electricalData';
import { audioService } from '../utils/audio';
import { motorStateManager } from '../utils/motorState';

interface PermutationOption {
  id: string;
  phases: ['L1' | 'L2' | 'L3', 'L1' | 'L2' | 'L3', 'L1' | 'L2' | 'L3'];
  colors: ['brun' | 'noir' | 'gris', 'brun' | 'noir' | 'gris', 'brun' | 'noir' | 'gris'];
  sequence: 'direct' | 'inverse';
  isExamCase?: boolean;
  isStandardReference?: boolean;
  title: string;
}

const ALL_PERMUTATIONS: PermutationOption[] = [
  {
    id: 'perm_123',
    phases: ['L1', 'L2', 'L3'],
    colors: ['brun', 'noir', 'gris'],
    sequence: 'direct',
    isStandardReference: true,
    title: 'Norme Standard (L1 - L2 - L3)',
  },
  {
    id: 'perm_231',
    phases: ['L2', 'L3', 'L1'],
    colors: ['noir', 'gris', 'brun'],
    sequence: 'direct',
    title: 'Décalage cyclique (L2 - L3 - L1)',
  },
  {
    id: 'perm_312',
    phases: ['L3', 'L1', 'L2'],
    colors: ['gris', 'brun', 'noir'],
    sequence: 'direct',
    title: 'Décalage cyclique (L3 - L1 - L2)',
  },
  {
    id: 'perm_132',
    phases: ['L1', 'L3', 'L2'],
    colors: ['brun', 'gris', 'noir'],
    sequence: 'inverse',
    isExamCase: true,
    title: 'CAS DE TON EXAMEN (L1 - L3 - L2)',
  },
  {
    id: 'perm_213',
    phases: ['L2', 'L1', 'L3'],
    colors: ['noir', 'brun', 'gris'],
    sequence: 'inverse',
    title: 'Inversion L1/L2 (L2 - L1 - L3)',
  },
  {
    id: 'perm_321',
    phases: ['L3', 'L2', 'L1'],
    colors: ['gris', 'noir', 'brun'],
    sequence: 'inverse',
    title: 'Inversion L1/L3 (L3 - L2 - L1)',
  },
];

export const PermutationsLab: React.FC = () => {
  const [selectedPermId, setSelectedPermId] = useState<string>('perm_132'); // Default to exam case
  const [selectedMachineId, setSelectedMachineId] = useState<string>('pump');
  // Persistent angle: never resets to 0 when clicking permutations or switching tabs
  const [machineAngle, setMachineAngle] = useState<number>(motorStateManager.machineAngleDeg);

  const selectedPerm = ALL_PERMUTATIONS.find((p) => p.id === selectedPermId) || ALL_PERMUTATIONS[0];
  const selectedMachine = INDUSTRIAL_MACHINES.find((m) => m.id === selectedMachineId) || INDUSTRIAL_MACHINES[0];

  const isDirect = selectedPerm.sequence === 'direct';

  // Smooth continuous animation without ever restarting from zero
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // 45 degrees per second = 1 full turn in 8 seconds (very gentle)
      const degPerSec = 45;
      const delta = (isDirect ? degPerSec : -degPerSec) * dt;
      motorStateManager.advanceMachine(delta);
      setMachineAngle(motorStateManager.machineAngleDeg);

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isDirect]);

  const selectPerm = (id: string) => {
    audioService.playRelayClick();
    setSelectedPermId(id);
  };

  const selectMachine = (id: string) => {
    audioService.playRelayClick();
    setSelectedMachineId(id);
  };

  const getMachineIcon = (iconName: string) => {
    switch (iconName) {
      case 'Droplets': return <Droplets className="w-5 h-5 text-sky-400" />;
      case 'Wind': return <Wind className="w-5 h-5 text-cyan-400" />;
      case 'ArrowUpDown': return <ArrowUpDown className="w-5 h-5 text-amber-400" />;
      case 'Repeat': return <Repeat className="w-5 h-5 text-orange-400" />;
      case 'Disc': return <Disc className="w-5 h-5 text-rose-400" />;
      default: return <Zap className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SÉCURITÉ &amp; COMBINATOIRE DES 3 PHASES</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Les 6 Permutations Possibles (3! = 6) &amp; Impacts Industriels
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Sur un réseau triphasé, il existe exactement 6 manières de raccorder les 3 phases aux 3 bornes du moteur.
              3 combinaisons donnent un sens <strong className="text-emerald-400">horlogique</strong>, et 3 combinaisons donnent un sens <strong className="text-rose-400">antihorlogique</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* REMARQUE IMPORTANTE : CONSERVATION DU CHAMP TOURNANT EN SORTIE */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-2 border-amber-500/70 rounded-2xl p-4 sm:p-5 shadow-xl flex items-start gap-3.5 relative overflow-hidden">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 mt-0.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        <div className="space-y-2 text-xs sm:text-sm text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xs">
              Remarque Importante
            </span>
            <span className="text-[11px] font-mono text-amber-300/80 font-semibold">
              Règle Fondamentale RGIE &amp; Tête de Compteur
            </span>
          </div>

          <p className="text-amber-100 font-semibold leading-relaxed">
            Le champ tournant en sortie doit impérativement être conservé à l’identique. Les câbles de sortie en tête de compteur doivent rester dans le même ordre que celui existant. Toute modification de cet ordre risque de modifier le champ tournant à l’arrivée du différentiel.
          </p>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-amber-200/90 text-xs font-mono leading-relaxed flex items-start gap-2">
            <span className="text-amber-400 font-bold shrink-0">⚡</span>
            <span>
              <strong>Règle de modification :</strong> Si l’ordre des fils de sortie doit être modifié, celui-ci doit <strong>obligatoirement</strong> être changé selon un <strong>ordre cyclique</strong> (ex: <span className="text-emerald-300 font-bold">L1-L2-L3</span> ➔ <span className="text-emerald-300 font-bold">L2-L3-L1</span> ➔ <span className="text-emerald-300 font-bold">L3-L1-L2</span>), afin de conserver le même sens du champ tournant à l’arrivée du différentiel.
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 6 Permutations selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>SÉLECTIONNEZ UNE COMBINAISON POUR OBSERVER L&apos;EFFET :</span>
          <span className="hidden sm:inline">3 Directes (Horaires) · 3 Inverses (Antihoraires)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_PERMUTATIONS.map((perm) => {
            const isSelected = perm.id === selectedPermId;
            const isDirectPerm = perm.sequence === 'direct';

            return (
              <button
                key={perm.id}
                onClick={() => selectPerm(perm.id)}
                className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? isDirectPerm
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                      : 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Badges for Exam or Reference */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-white font-mono">{perm.title}</span>
                  {perm.isExamCase && (
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Ton Examen
                    </span>
                  )}
                  {perm.isStandardReference && (
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Référence
                    </span>
                  )}
                </div>

                {/* Wire color chips */}
                <div className="flex items-center gap-2 my-2">
                  {perm.phases.map((ph, idx) => {
                    const col = perm.colors[idx];
                    const hex = col === 'brun' ? '#A16207' : col === 'noir' ? '#1E293B' : '#64748B';
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: hex }} />
                        <span>{ph}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Result indicator */}
                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    {isDirectPerm ? (
                      <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className={isDirectPerm ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isDirectPerm ? 'Horlogique (CW)' : 'Antihorlogique (CCW)'}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {isDirectPerm ? 'Ordre Direct' : 'Ordre Inverse'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Industrial Machine Simulator Stage */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Conséquence sur la Machine Raccordée</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Pourquoi l&apos;ordre des phases est vérifié avec une sévérité absolue par les inspecteurs
            </p>
          </div>

          {/* Machine selection pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {INDUSTRIAL_MACHINES.map((machine) => (
              <button
                key={machine.id}
                onClick={() => selectMachine(machine.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  machine.id === selectedMachineId
                    ? 'bg-slate-800 text-amber-300 shadow-sm border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {getMachineIcon(machine.iconName)}
                <span>{machine.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Machine details & status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual animation simulation (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 sm:p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center shadow-2xl overflow-hidden">
              {/* Cadran avec graduations périphériques */}
              <svg viewBox="-100 -100 200 200" className="absolute inset-0 w-full h-full pointer-events-none">
                <circle r="92" fill="none" stroke="#1e293b" strokeWidth="6" />
                <circle r="86" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                {Array.from({ length: 24 }).map((_, i) => {
                  const rad = (i * 15 * Math.PI) / 180;
                  return (
                    <line
                      key={i}
                      x1={86 * Math.sin(rad)}
                      y1={-86 * Math.cos(rad)}
                      x2={91 * Math.sin(rad)}
                      y2={-91 * Math.cos(rad)}
                      stroke={i % 6 === 0 ? '#f59e0b' : '#64748b'}
                      strokeWidth={i % 6 === 0 ? 2 : 1}
                    />
                  );
                })}
              </svg>

              {/* Turbine / Rouet industriel en rotation continue */}
              <div
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center relative"
                style={{
                  transform: `rotate(${machineAngle}deg)`,
                }}
              >
                {/* 6 pales aérodynamiques incurvées */}
                <svg viewBox="-70 -70 140 140" className="w-full h-full">
                  <defs>
                    <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="50%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                  </defs>
                  {[0, 60, 120, 180, 240, 300].map((bAngle) => (
                    <g key={bAngle} transform={`rotate(${bAngle})`}>
                      <path
                        d="M 0 -12 C 15 -28 32 -48 48 -44 C 44 -34 26 -20 10 -6 Z"
                        fill="url(#bladeGrad)"
                        stroke="#94a3b8"
                        strokeWidth="1"
                      />
                    </g>
                  ))}
                  {/* Moyeu central de la turbine */}
                  <circle r="18" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <circle r="12" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                </svg>
              </div>

              {/* Moyeu central fixe avec icône de la machine et indicateur de sens */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center backdrop-blur-md border shadow-2xl transition-colors ${
                    isDirect
                      ? 'bg-emerald-950/85 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-rose-950/85 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                  }`}
                >
                  {isDirect ? (
                    <RotateCw className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <RotateCcw className="w-5 h-5 text-rose-400" />
                  )}
                  <span className="text-[7.5px] font-mono font-black mt-0.5 tracking-tighter">
                    {isDirect ? 'CW' : 'CCW'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs font-mono text-slate-400 block mb-1">Rotation actuelle :</span>
              <span
                className={`text-sm font-bold font-mono px-3 py-1 rounded-full border inline-block ${
                  isDirect
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                }`}
              >
                {isDirect ? 'Sens Horlogique (Normal)' : 'Sens Antihorlogique (Inversé !)'}
              </span>
            </div>
          </div>

          {/* Machine behavior textual impact (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                {getMachineIcon(selectedMachine.iconName)}
                <span>{selectedMachine.name}</span>
              </h4>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  selectedMachine.dangerLevel === 'Critique'
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : selectedMachine.dangerLevel === 'Grave'
                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                    : 'bg-blue-950 text-blue-300 border-blue-600'
                }`}
              >
                Danger : {selectedMachine.dangerLevel}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {selectedMachine.description}
            </p>

            {/* Side-by-side normal vs reverse comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div
                className={`p-4 rounded-xl border ${
                  isDirect
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>FONCTIONNEMENT HORLOGIQUE :</span>
                </div>
                <p className="leading-relaxed text-[11px]">{selectedMachine.normalBehavior}</p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  !isDirect
                    ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-rose-400 mb-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>DYSFONCTIONNEMENT ANTIHORLOGIQUE :</span>
                </div>
                <p className="leading-relaxed text-[11px]">{selectedMachine.reverseBehavior}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
