/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  RotateCw,
  RotateCcw,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  ArrowRightLeft,
  Gauge,
  Sliders,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { audioService } from '../../utils/audio';

export type GridMode = '400V_TRI_N' | '230V_TRI';
export type PhaseSequence = 'L1-L2-L3' | 'L1-L3-L2';

interface SimuPhaseTetraBenchProps {
  onOpenExamCaseStudy?: () => void;
  onOpenMotorSimulator?: () => void;
}

export const SimuPhaseTetraBench: React.FC<SimuPhaseTetraBenchProps> = ({
  onOpenExamCaseStudy,
  onOpenMotorSimulator,
}) => {
  // Grid and wiring parameters
  const [gridMode, setGridMode] = useState<GridMode>('400V_TRI_N');
  const [phaseOrder, setPhaseOrder] = useState<PhaseSequence>('L1-L2-L3');
  const [breakerClosed, setBreakerClosed] = useState<boolean>(true);
  const [l1Active, setL1Active] = useState<boolean>(true);
  const [l2Active, setL2Active] = useState<boolean>(true);
  const [l3Active, setL3Active] = useState<boolean>(true);
  const [neutralActive, setNeutralActive] = useState<boolean>(true);

  // Machine load state
  const [machineRunning, setMachineRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [diskAngle, setDiskAngle] = useState<number>(0);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Determine field status
  const activeCount = (l1Active ? 1 : 0) + (l2Active ? 1 : 0) + (l3Active ? 1 : 0);
  const hasPhaseLoss = activeCount < 3 || !breakerClosed;
  const isDirect = phaseOrder === 'L1-L2-L3';
  const rotationSign = hasPhaseLoss ? 0 : isDirect ? 1 : -1;

  // Animation loop
  useEffect(() => {
    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      if (machineRunning && !hasPhaseLoss) {
        const speed = rotationSign * 180 * speedMultiplier; // 180 deg/s
        setDiskAngle((prev) => (prev + speed * dt + 360000) % 360);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [machineRunning, hasPhaseLoss, rotationSign, speedMultiplier]);

  // Voltages
  const vSimple = gridMode === '400V_TRI_N' ? 230 : 133;
  const vComposee = gridMode === '400V_TRI_N' ? 400 : 230;

  const u12 = breakerClosed && l1Active && l2Active ? vComposee : 0;
  const u23 = breakerClosed && l2Active && l3Active ? vComposee : 0;
  const u31 = breakerClosed && l3Active && l1Active ? vComposee : 0;

  const v1 = breakerClosed && l1Active && (gridMode === '400V_TRI_N' ? neutralActive : true) ? vSimple : 0;
  const v2 = breakerClosed && l2Active && (gridMode === '400V_TRI_N' ? neutralActive : true) ? vSimple : 0;
  const v3 = breakerClosed && l3Active && (gridMode === '400V_TRI_N' ? neutralActive : true) ? vSimple : 0;

  const toggleBreaker = () => {
    setBreakerClosed(!breakerClosed);
    audioService.playRelayClick();
  };

  const swapPhases = () => {
    audioService.playRelayClick();
    setPhaseOrder((prev) => (prev === 'L1-L2-L3' ? 'L1-L3-L2' : 'L1-L2-L3'));
  };

  const resetAll = () => {
    audioService.playRelayClick();
    setPhaseOrder('L1-L2-L3');
    setL1Active(true);
    setL2Active(true);
    setL3Active(true);
    setNeutralActive(true);
    setBreakerClosed(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-left">
      {/* 1. Header Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>BANC DE CONTRÔLE TÉTRAPHASÉ &amp; POSE COMPTEUR COMMUNICANT</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              SimuPhase Tétra : Ordre des Phases &amp; Sécurité Réseau
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Simulation temps réel du banc de mesure BT (3×400V+N ou 3×230V), raccordement des bornes du compteur communicant, testeur d&apos;ordre de phases et comportement de la machine cliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={swapPhases}
              id="btn-swap-phases-bench"
              className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md active:scale-95"
              title="Permuter les phases L2 et L3 pour inverser le sens de rotation"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Permuter L2 ⇄ L3</span>
            </button>

            <button
              onClick={resetAll}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              title="Rétablir le branchement normal direct L1-L2-L3"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
              <span>Rétablir 1-2-3</span>
            </button>
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
              <strong>Ordre cyclique obligatoire :</strong> Si l’ordre des fils de sortie doit être modifié, celui-ci doit <strong>obligatoirement</strong> être changé selon un <strong>ordre cyclique</strong> (ex: <span className="text-emerald-300 font-bold">L1-L2-L3</span> ➔ <span className="text-emerald-300 font-bold">L2-L3-L1</span> ➔ <span className="text-emerald-300 font-bold">L3-L1-L2</span>), afin de conserver le même sens du champ tournant à l’arrivée du différentiel.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Interactive Cards: Status, Grid Type, Breaker & Phase Switches */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Card 1: Sens de rotation actuel */}
        <div
          className={`p-4 rounded-2xl border shadow-lg flex items-center justify-between transition-all ${
            hasPhaseLoss
              ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
              : isDirect
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
              : 'bg-amber-950/60 border-amber-500/60 text-amber-200'
          }`}
        >
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider block opacity-80">
              Sens Champ Tournant
            </span>
            <div className="flex items-center gap-2 mt-1">
              {hasPhaseLoss ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                  <span className="text-base font-black text-rose-300">DÉFAUT / 0V</span>
                </>
              ) : isDirect ? (
                <>
                  <RotateCw className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-base font-black text-emerald-300">HORLOGIQUE ↻</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                  <span className="text-base font-black text-amber-300">ANTIHORLOGIQUE ↺</span>
                </>
              )}
            </div>
            <span className="text-[11px] font-mono mt-1 block">
              Ordre : <strong className="text-white">{phaseOrder === 'L1-L2-L3' ? 'L1 ➔ L2 ➔ L3' : 'L1 ➔ L3 ➔ L2'}</strong>
            </span>
          </div>

          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900/80 border border-current shadow-inner">
            {hasPhaseLoss ? (
              <span className="text-2xl font-black text-rose-400">✕</span>
            ) : isDirect ? (
              <span className="text-2xl font-black text-emerald-400">↻</span>
            ) : (
              <span className="text-2xl font-black text-amber-400">↺</span>
            )}
          </div>
        </div>

        {/* Card 2: Type de réseau BT */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Réseau Basse Tension
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setGridMode('400V_TRI_N')}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  gridMode === '400V_TRI_N'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                3×400V+N
              </button>
              <button
                onClick={() => setGridMode('230V_TRI')}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  gridMode === '230V_TRI'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                3×230V
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black font-mono text-white">
              U = {gridMode === '400V_TRI_N' ? '400 V' : '230 V'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {gridMode === '400V_TRI_N' ? '(V = 230V)' : '(Triangle sans N)'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">
            Fréquence f = 50.0 Hz | Synergrid C2/112
          </span>
        </div>

        {/* Card 3: Disjoncteur 4P & Fusibles des 3 phases */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Disjoncteur 4P Amont
            </span>
            <button
              onClick={toggleBreaker}
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                breakerClosed
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-950 text-rose-300 border-rose-500/50'
              }`}
            >
              {breakerClosed ? 'ENCLENCHÉ' : 'DÉCLENCHÉ'}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-1">
            <button
              onClick={() => setL1Active((v) => !v)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                l1Active && breakerClosed
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 font-bold'
                  : 'bg-slate-800/40 border-slate-700 text-slate-500 line-through'
              }`}
              title="Couper/Rétablir la phase L1"
            >
              <div className="text-[10px] font-bold">L1</div>
              <div className="text-[9px] font-mono">{l1Active && breakerClosed ? '230V' : '0V'}</div>
            </button>

            <button
              onClick={() => setL2Active((v) => !v)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                l2Active && breakerClosed
                  ? 'bg-slate-800 border-slate-600 text-white font-bold'
                  : 'bg-slate-800/40 border-slate-700 text-slate-500 line-through'
              }`}
              title="Couper/Rétablir la phase L2"
            >
              <div className="text-[10px] font-bold">L2</div>
              <div className="text-[9px] font-mono">{l2Active && breakerClosed ? '230V' : '0V'}</div>
            </button>

            <button
              onClick={() => setL3Active((v) => !v)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                l3Active && breakerClosed
                  ? 'bg-slate-700/60 border-slate-500 text-slate-200 font-bold'
                  : 'bg-slate-800/40 border-slate-700 text-slate-500 line-through'
              }`}
              title="Couper/Rétablir la phase L3"
            >
              <div className="text-[10px] font-bold">L3</div>
              <div className="text-[9px] font-mono">{l3Active && breakerClosed ? '230V' : '0V'}</div>
            </button>

            <button
              onClick={() => setNeutralActive((v) => !v)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                neutralActive && breakerClosed
                  ? 'bg-blue-950/60 border-blue-500/60 text-blue-300 font-bold'
                  : 'bg-slate-800/40 border-slate-700 text-slate-500 line-through'
              }`}
              title="Couper/Rétablir le Neutre"
            >
              <div className="text-[10px] font-bold">N</div>
              <div className="text-[9px] font-mono">{neutralActive && breakerClosed ? '0V' : 'FLT'}</div>
            </button>
          </div>
          <span className="text-[9px] font-mono text-slate-500 mt-1">
            Cliquez pour simuler un fusible fondu
          </span>
        </div>

        {/* Card 4: Machine Réceptrice (Pompe / Compresseur) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Charge Atelier Client
            </span>
            <button
              onClick={() => setMachineRunning((r) => !r)}
              className={`p-1 rounded-lg border transition-all cursor-pointer ${
                machineRunning ? 'bg-amber-950 text-amber-300 border-amber-500/50' : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
              }`}
            >
              {machineRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="mt-2">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <span>Pompe de relevage / Compresseur :</span>
            </div>
            <div className="text-xs font-mono mt-0.5">
              {hasPhaseLoss ? (
                <span className="text-rose-400 font-bold">Vibration 100 Hz / Bloqué</span>
              ) : isDirect ? (
                <span className="text-emerald-400 font-bold">Refoulement normal (Débit OK)</span>
              ) : (
                <span className="text-amber-400 font-bold">DANGER : Tourne à l&apos;envers (Débit nul)</span>
              )}
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-500 mt-1">
            Vitesse : {hasPhaseLoss ? '0 tr/min' : isDirect ? '+1440 tr/min' : '-1440 tr/min'}
          </span>
        </div>
      </div>

      {/* 3. Central Stage: Testeur Chauvin Arnoux / Fluke & Compteur Communicant LCD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 cols): C.A 6608 / Fluke 9040 Rotating Field Tester */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>TESTEUR PORTABLE D&apos;ORDRE DE PHASE (TYPE FLUKE 9040 / C.A 6608)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Plage 40 - 690 V AC</span>
          </div>

          {/* Tester Casing */}
          <div className="w-full max-w-[400px] bg-slate-950 rounded-2xl p-6 border-2 border-slate-800 shadow-2xl flex flex-col items-center relative">
            {/* Top Terminals L1, L2, L3 */}
            <div className="w-full grid grid-cols-3 gap-2 pb-4 border-b border-slate-800 mb-4">
              {/* L1 Terminal */}
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 ${breakerClosed && l1Active ? 'bg-amber-500 border-amber-300 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-800 border-slate-700'}`} />
                <span className="text-[10px] font-mono font-bold text-slate-300 mt-1">BORNE L1</span>
                <span className="text-[9px] font-mono text-amber-400">{breakerClosed && l1Active ? '230V' : '0V'}</span>
              </div>

              {/* L2 Terminal */}
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 ${breakerClosed && l2Active ? 'bg-slate-400 border-white shadow-[0_0_8px_#ffffff]' : 'bg-slate-800 border-slate-700'}`} />
                <span className="text-[10px] font-mono font-bold text-slate-300 mt-1">BORNE L2</span>
                <span className="text-[9px] font-mono text-slate-300">{breakerClosed && l2Active ? '230V' : '0V'}</span>
              </div>

              {/* L3 Terminal */}
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 ${breakerClosed && l3Active ? 'bg-sky-500 border-sky-300 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-800 border-slate-700'}`} />
                <span className="text-[10px] font-mono font-bold text-slate-300 mt-1">BORNE L3</span>
                <span className="text-[9px] font-mono text-sky-400">{breakerClosed && l3Active ? '230V' : '0V'}</span>
              </div>
            </div>

            {/* Circular Rotating LED Ring */}
            <div className="relative w-44 h-44 my-2 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800 bg-slate-900 flex items-center justify-center shadow-inner">
                {/* 8 Peripheral LEDs */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                  const currentStep = Math.floor((diskAngle / 45) % 8);
                  const isActive = !hasPhaseLoss && (isDirect ? (currentStep + 8) % 8 === i : (8 - currentStep) % 8 === i);
                  const radD = (deg * Math.PI) / 180;
                  const x = 70 * Math.sin(radD);
                  const y = -70 * Math.cos(radD);

                  return (
                    <div
                      key={deg}
                      className={`absolute w-3.5 h-3.5 rounded-full transition-all duration-100 ${
                        isActive
                          ? isDirect
                            ? 'bg-emerald-400 shadow-[0_0_12px_#34d399] scale-125'
                            : 'bg-amber-400 shadow-[0_0_12px_#fbbf24] scale-125'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    />
                  );
                })}

                {/* Central LCD Display */}
                <div className="w-24 h-24 rounded-full bg-slate-950 border-2 border-slate-700 flex flex-col items-center justify-center p-2 shadow-inner text-center">
                  {hasPhaseLoss ? (
                    <>
                      <XCircle className="w-7 h-7 text-rose-500 mb-0.5" />
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">
                        PHASE MANQUANTE
                      </span>
                    </>
                  ) : isDirect ? (
                    <>
                      <RotateCw className="w-8 h-8 text-emerald-400 animate-spin mb-1" style={{ animationDuration: '2s' }} />
                      <span className="text-xs font-black text-emerald-400 tracking-wider">
                        R ➔ DIRECT
                      </span>
                      <span className="text-[9px] font-mono text-emerald-300 font-bold">
                        1 ➔ 2 ➔ 3
                      </span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-8 h-8 text-amber-400 animate-spin mb-1" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                      <span className="text-xs font-black text-amber-400 tracking-wider">
                        L ➔ INVERSÉ
                      </span>
                      <span className="text-[9px] font-mono text-amber-300 font-bold">
                        3 ➔ 2 ➔ 1
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Status Verdict */}
            <div className="w-full text-center mt-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-mono font-bold block text-slate-300">
                Diagnostic Terrain :
              </span>
              <span
                className={`text-xs font-black block mt-0.5 ${
                  hasPhaseLoss
                    ? 'text-rose-400'
                    : isDirect
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {hasPhaseLoss
                  ? '⚠️ Impossible d’établir un champ tournant (absence de tension sur une phase)'
                  : isDirect
                  ? '✅ Champ tournant conforme horlogique (autorisé pour mise en service)'
                  : '⚠️ Champ tournant antihorlogique (interdiction de mise en service sans correction)'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT (5 cols): Smart Meter LCD & Technical Rules */}
        <div className="lg:col-span-5 space-y-5">
          {/* Compteur Communicant Sagemcom / Siconia LCD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>ÉCRAN DU COMPTEUR COMMUNICANT TÉTRAPHASÉ</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/40">
                OBIS 1.8.0
              </span>
            </div>

            {/* Green Backlit LCD Display */}
            <div className="bg-[#bbf7d0]/30 border-2 border-[#86efac]/80 rounded-xl p-4 font-mono text-slate-950 shadow-inner">
              <div className="flex items-center justify-between text-xs font-black mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[11px] ${breakerClosed && l1Active ? 'bg-slate-900 text-white' : 'text-slate-400 line-through'}`}>L1</span>
                  <span className={`px-1.5 py-0.5 rounded text-[11px] ${breakerClosed && l2Active ? 'bg-slate-900 text-white' : 'text-slate-400 line-through'}`}>L2</span>
                  <span className={`px-1.5 py-0.5 rounded text-[11px] ${breakerClosed && l3Active ? 'bg-slate-900 text-white' : 'text-slate-400 line-through'}`}>L3</span>
                </div>

                <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-slate-300">
                  <span className="text-[10px] font-bold text-slate-700">CHAMP :</span>
                  {hasPhaseLoss ? (
                    <span className="text-rose-600 font-black animate-pulse">ERR</span>
                  ) : isDirect ? (
                    <span className="text-emerald-700 font-black text-sm">↻ OK</span>
                  ) : (
                    <span className="text-amber-700 font-black text-sm animate-pulse">↺ INV</span>
                  )}
                </div>
              </div>

              <div className="text-right text-2xl font-black tracking-widest my-2 text-slate-950">
                000458.74 <span className="text-xs">kWh</span>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-emerald-400/50 text-[11px] text-slate-800">
                <div>U12: <strong>{u12} V</strong></div>
                <div>U23: <strong>{u23} V</strong></div>
                <div>U31: <strong>{u31} V</strong></div>
              </div>
            </div>
          </div>

          {/* RGIE & ORES Technical Rules Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>RÈGLE RÉGLEMENTAIRE (RGIE &amp; ORES)</span>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong>1. Raccordement initial (Neuf) :</strong> Le gestionnaire de réseau doit livrer un champ tournant <strong>horlogique direct (1-2-3)</strong>.
              </p>
              <p>
                <strong>2. Remplacement sur existant :</strong> Toujours vérifier l&apos;ordre avant la dépose pour reproduire exactement l&apos;ordre initial et éviter d&apos;inverser les moteurs de l&apos;artisan/client.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-sky-300 font-mono">
                💡 Règle de correction : Permuter DEUX phases (ex: L2 et L3). Le Neutre reste rigoureusement intouché.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
