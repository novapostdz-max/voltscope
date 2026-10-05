import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  RotateCcw, 
  RefreshCw, 
  Gauge, 
  Zap, 
  ArrowRight,
  ArrowDown,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { WIRE_DEFINITIONS, evaluateInputOutputTransfer } from '../utils/electricalData';
import { audioService } from '../utils/audio';
import { motorStateManager } from '../utils/motorState';

interface ExamCaseStudyProps {
  onOpenSimulator?: () => void;
  onOpenRTCC?: () => void;
  onBackHome?: () => void;
}

export const ExamCaseStudy: React.FC<ExamCaseStudyProps> = () => {
  // 1. Couleurs des fils d'ENTRÉE sur les bornes 1, 2, 3 du compteur (Arrivée réseau / installation)
  // Par défaut : le cas exact de l'examen : [Brun (L1), Gris (L3), Noir (L2)]
  const [inputWires, setInputWires] = useState<[string, string, string]>(['brun', 'gris', 'noir']);

  // 2. Couleurs des fils de SORTIE sur les bornes 1, 2, 3 du compteur (Départ vers le moteur)
  // Par défaut : raccordement standard [Brun, Noir, Gris]
  const [outputWires, setOutputWires] = useState<[string, string, string]>(['brun', 'noir', 'gris']);

  // Presets & modes
  const [activeScenario, setActiveScenario] = useState<
    'exam-direct' | 'cyclic-out-123' | 'cyclic-out-231' | 'cyclic-out-312' | 'custom'
  >('exam-direct');

  // Animation & motor speed
  const [rotaAngle, setRotaAngle] = useState(motorStateManager.rotaPhaseAngleDeg);
  const [motorSpeedMode, setMotorSpeedMode] = useState<'ultra-slow' | 'slow' | 'moderate'>('slow');
  const [isMotorPaused, setIsMotorPaused] = useState<boolean>(false);

  // Full transfer calculation:
  // - Incoming potentials on terminals 1, 2, 3
  // - Outgoing connections to motor coils U (Brun), V (Noir), W (Gris)
  const transfer = evaluateInputOutputTransfer(inputWires, outputWires);

  // Helper for phase hex colors: L1=Brun, L2=Noir, L3=Gris
  const getPhaseColor = (phase: string) => {
    if (phase === 'L1') return '#854D0E'; // Brun
    if (phase === 'L2') return '#0F172A'; // Noir
    if (phase === 'L3') return '#64748B'; // Gris
    return '#334155';
  };

  // Step speed in degrees per second (very gentle and slow)
  const baseDegPerSec = motorSpeedMode === 'ultra-slow' ? 20 : motorSpeedMode === 'slow' ? 45 : 90;

  // Continuous animation loop that NEVER restarts from zero
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!isMotorPaused) {
        // Continuous angle increment: positive for clockwise (Horlogique), negative for CCW (Antihorlogique)
        const delta = (transfer.isDirect ? baseDegPerSec : -baseDegPerSec) * dt;
        motorStateManager.advanceRotaPhase(delta);
        setRotaAngle(motorStateManager.rotaPhaseAngleDeg);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [transfer.isDirect, baseDegPerSec, isMotorPaused]);

  // Handler for changing an input terminal wire
  const setInputWireForTerminal = (terminalIdx: 0 | 1 | 2, color: string) => {
    audioService.playRelayClick();
    setActiveScenario('custom');
    setInputWires((prev) => {
      const next: [string, string, string] = [prev[0], prev[1], prev[2]];
      next[terminalIdx] = color;
      return next;
    });
  };

  // Handler for changing an output terminal wire
  const setOutputWireForTerminal = (terminalIdx: 0 | 1 | 2, color: string) => {
    audioService.playRelayClick();
    setActiveScenario('custom');
    setOutputWires((prev) => {
      const next: [string, string, string] = [prev[0], prev[1], prev[2]];
      next[terminalIdx] = color;
      return next;
    });
  };

  // Quick presets applying the cyclic order ON THE OUTPUT from left to right!
  // With Input arrival fixed to Exam (Brun, Gris, Noir = L1, L3, L2)
  const applyOutputScenario = (
    scenario: 'exam-direct' | 'cyclic-out-123' | 'cyclic-out-231' | 'cyclic-out-312'
  ) => {
    audioService.playRelayClick();
    setActiveScenario(scenario);

    // Keep arrival from exam: Brun (L1), Gris (L3), Noir (L2)
    setInputWires(['brun', 'gris', 'noir']);

    if (scenario === 'exam-direct') {
      // Piège de l'examen : fils de sortie branchés tout droit (Brun, Noir, Gris)
      // Bornes 1(L1), 2(L3), 3(L2) -> U=L1, V=L3, W=L2 (Antihorlogique)
      setOutputWires(['brun', 'noir', 'gris']);
    } else if (scenario === 'cyclic-out-123') {
      // Ordre cyclique direct 1 en sortie (de gauche à droite) :
      // On inverse les fils sur bornes 2 et 3 : Borne 1=Brun, Borne 2=Gris, Borne 3=Noir
      // Moteur reçoit : U=L1, V=L2, W=L3 -> Horlogique !
      setOutputWires(['brun', 'gris', 'noir']);
    } else if (scenario === 'cyclic-out-231') {
      // Ordre cyclique direct 2 en sortie (de gauche à droite) : L2 - L3 - L1
      // Borne 1=Gris(W), Borne 2=Noir(V), Borne 3=Brun(U)
      // Moteur reçoit : U=L2, V=L3, W=L1 -> Horlogique !
      setOutputWires(['gris', 'noir', 'brun']);
    } else if (scenario === 'cyclic-out-312') {
      // Ordre cyclique direct 3 en sortie (de gauche à droite) : L3 - L1 - L2
      // Borne 1=Noir(V), Borne 2=Brun(U), Borne 3=Gris(W)
      // Moteur reçoit : U=L3, V=L1, W=L2 -> Horlogique !
      setOutputWires(['noir', 'brun', 'gris']);
    }
  };

  // Swap output terminals 2 and 3
  const swapOutput2and3 = () => {
    audioService.playRelayClick();
    setActiveScenario('custom');
    setOutputWires(([w1, w2, w3]) => [w1, w3, w2]);
  };

  // Cyclic shift of output wires from left to right: (w1, w2, w3) -> (w3, w1, w2)
  const cyclicShiftOutputLeftToRight = () => {
    audioService.playRelayClick();
    setActiveScenario('custom');
    setOutputWires(([w1, w2, w3]) => [w3, w1, w2]);
  };

  // Motor coil name for a wire color
  const getCoilName = (wireColor: string) => {
    if (wireColor === 'brun') return 'U';
    if (wireColor === 'noir') return 'V';
    if (wireColor === 'gris') return 'W';
    return '?';
  };

  return (
    <div className="space-y-3 max-w-7xl mx-auto pb-6 text-left">
      {/* HEADER COMPACT : LOI TRIPHASÉE + PRESETS + REMARQUE IMPORTANTE (Sans perte d'espace) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-2">
        {/* Ligne 1 : Loi Triphasée & 4 Presets 1-clic */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30 text-[11px] shrink-0">
              Loi Triphasée
            </span>
            <span className="text-slate-300 text-[11px]">
              <strong className="text-emerald-400">L1-L2-L3 = L2-L3-L1 = L3-L1-L2 (Horlogique)</strong>
              <span className="mx-1.5 text-slate-600">|</span>
              <strong className="text-rose-400">Inverser 2 fils = Antihorlogique</strong>
            </span>
          </div>

          {/* 4 Boutons de scénarios rapides en sortie */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              onClick={() => applyOutputScenario('exam-direct')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeScenario === 'exam-direct'
                  ? 'bg-rose-500/25 text-rose-300 border-rose-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
              title="Sortie non inversée (piège examen) : le moteur tourne en sens inverse"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Piège Examen (Antihorlogique)</span>
            </button>

            <button
              onClick={() => applyOutputScenario('cyclic-out-123')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeScenario === 'cyclic-out-123'
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
              title="Sortie Cycle 1 : L1-L2-L3 de gauche à droite (Correction 2 ↔ 3)"
            >
              <RotateCw className="w-3 h-3 text-emerald-400" />
              <span>Sortie Cycle L1-L2-L3</span>
            </button>

            <button
              onClick={() => applyOutputScenario('cyclic-out-231')}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeScenario === 'cyclic-out-231'
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Sortie Cycle 2 : L2-L3-L1 de gauche à droite"
            >
              <RotateCw className="w-3 h-3 text-emerald-400" />
              <span>Sortie Cycle L2-L3-L1</span>
            </button>

            <button
              onClick={() => applyOutputScenario('cyclic-out-312')}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeScenario === 'cyclic-out-312'
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Sortie Cycle 3 : L3-L1-L2 de gauche à droite"
            >
              <RotateCw className="w-3 h-3 text-emerald-400" />
              <span>Sortie Cycle L3-L1-L2</span>
            </button>
          </div>
        </div>

        {/* Ligne 2 : REMARQUE IMPORTANTE (Compacte, ultra-lisible, zéro vide gaspillé) */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 text-amber-100 flex items-start gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug text-[11px] sm:text-xs">
            <span className="font-black text-amber-300 uppercase tracking-wide mr-1.5 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
              Remarque Importante :
            </span>
            <span>
              Le champ tournant en sortie doit impérativement être conservé à l’identique. Les câbles de sortie en tête de compteur doivent rester dans le même ordre que celui existant. Toute modification de cet ordre risque de modifier le champ tournant à l’arrivée du différentiel.
            </span>
            <div className="mt-1 font-mono text-[10.5px] text-amber-300/95 flex items-center gap-1">
              <span>⚡ <strong>Ordre cyclique obligatoire :</strong> Si l’ordre des fils de sortie doit être modifié, celui-ci doit <strong>obligatoirement</strong> être changé selon un <strong>ordre cyclique</strong> (ex: <span className="text-emerald-300 font-bold">L1-L2-L3</span> ➔ <span className="text-emerald-300 font-bold">L2-L3-L1</span> ➔ <span className="text-emerald-300 font-bold">L3-L1-L2</span>), afin de conserver le même sens du champ tournant à l’arrivée du différentiel.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single-Window Layout: Left (Meter) + Right (Motor & Rota-Phase) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: THE COMPLETE METER (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-xl flex-1 flex flex-col justify-start space-y-2.5">
            
            {/* 1. FAÇADE HAUTE DU COMPTEUR & ÉCRAN LCD (Utilisation complète du fond bleu amont) */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-700 p-2.5 shadow-md space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 font-extrabold text-xs sm:text-sm tracking-wide">
                    COMPTEUR TÉTRAPOLAIRE ÉLECTRONIQUE COMMUNICANT
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={swapOutput2and3}
                    className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20 transition-colors flex items-center gap-1 font-mono cursor-pointer"
                    title="Permuter les bornes 2 et 3 en sortie"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Inverser Sortie 2 ↔ 3</span>
                  </button>
                  <button
                    onClick={cyclicShiftOutputLeftToRight}
                    className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 transition-colors font-mono flex items-center gap-1 cursor-pointer"
                    title="Décalage cyclique en sortie de gauche à droite"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>Décaler Sortie</span>
                  </button>
                </div>
              </div>

              {/* Écran LCD Digital du Compteur et Télémétrie intégrée */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 rounded-lg p-2 border border-slate-800 text-[10px] font-mono text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400 font-bold">
                  3×400V + N · 50.0 Hz
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Breaker : FERMÉ (ON)
                </span>
                <span className="text-slate-400">1000 imp/kWh</span>
              </div>
            </div>

            {/* UNIFIED WHITE BOARD: BORNES D'ENTRÉE DU COMPTEUR + BORNES DE SORTIE */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border-2 border-slate-300 shadow-lg space-y-2.5">
              
              {/* SECTION A: 1. BORNES D'ENTRÉE DU COMPTEUR (REPOSÉES BIEN EN HAUT) */}
              <div>
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-200 text-xs font-mono">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-xs">
                    <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                    <span>1. BORNES D&apos;ENTRÉE DU COMPTEUR (ARRIVÉE AMONT)</span>
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                    Ordre Amont : <strong className={transfer.inputSeq.isClockwise ? 'text-emerald-700' : 'text-rose-700'}>
                      {transfer.inputSeq.isClockwise ? 'Direct (1-2-3)' : 'Inverse'}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {[0, 1, 2].map((idx) => {
                    const currentWire = WIRE_DEFINITIONS[inputWires[idx]];
                    const termNum = idx + 1;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-amber-500 transition-all shadow-sm"
                      >
                        <span className="text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">
                          Borne {termNum}
                        </span>

                        {/* Vis laiton */}
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 border border-amber-900/60 flex items-center justify-center mb-1 shadow-inner">
                          <div className="w-2.5 h-0.5 bg-slate-900 rounded" />
                        </div>

                        {/* Fil avec couleur très visible */}
                        <div
                          className="w-4 h-8 rounded-full mb-1 shadow-sm border border-slate-900/40 relative overflow-hidden"
                          style={{ backgroundColor: currentWire.hex }}
                        >
                          <div className="absolute left-0.5 top-0 bottom-0 w-1 bg-white/30 rounded-full" />
                        </div>

                        <span className="text-xs font-black text-slate-900 mb-0.5">{currentWire.name.split(' ')[0]}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-700 mb-1">
                          Phase {currentWire.role}
                        </span>
                        
                        <select
                          value={inputWires[idx]}
                          onChange={(e) => setInputWireForTerminal(idx as 0 | 1 | 2, e.target.value)}
                          className="w-full text-[11px] font-mono font-bold bg-white border border-slate-300 rounded px-1 py-1 text-slate-900 focus:outline-none focus:border-amber-600 cursor-pointer"
                        >
                          <option value="brun">Brun (L1)</option>
                          <option value="noir">Noir (L2)</option>
                          <option value="gris">Gris (L3)</option>
                        </select>
                      </div>
                    );
                  })}

                  {/* Neutre N Entrée */}
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-sky-50 border-2 border-sky-200 shadow-sm">
                    <span className="text-[10px] font-mono font-bold text-sky-800 uppercase mb-1">
                      Borne N
                    </span>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 border border-amber-900/60 flex items-center justify-center mb-1 shadow-inner">
                      <div className="w-2.5 h-0.5 bg-slate-900 rounded" />
                    </div>
                    <div className="w-4 h-8 rounded-full mb-1 bg-sky-500 shadow-sm border border-slate-900/40 relative overflow-hidden">
                      <div className="absolute left-0.5 top-0 bottom-0 w-1 bg-white/30 rounded-full" />
                    </div>
                    <span className="text-xs font-black text-slate-900 mb-0.5">Bleu</span>
                    <span className="text-[10px] font-mono font-bold text-sky-700 mb-1">Neutre (N)</span>
                    <div className="w-full text-[10px] font-mono font-semibold py-1 bg-sky-100 text-sky-800 rounded border border-sky-200">
                      Fixe
                    </div>
                  </div>
                </div>
              </div>

              {/* FLUX DE COURANT TRAVERSANT LE COMPTEUR (Visual Separator) */}
              <div className="flex items-center justify-center py-0.5">
                <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-600 font-bold uppercase tracking-wider">
                  <span>↓ FLUX TRAVERSANT LE COMPTEUR TÉTRA ↓</span>
                </div>
              </div>

              {/* SECTION B: 2. BORNES DE SORTIE DU COMPTEUR (DÉPART AVAL VERS MOTEUR) */}
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200 text-xs font-mono">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. BORNES DE SORTIE DU COMPTEUR (DÉPART AVAL VERS MOTEUR)</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    Câble vers moteur
                  </span>
                </div>

                {/* PROMINENT BANNER: ORDRE CYCLIQUE EN SORTIE DE GAUCHE À DROITE */}
                <div className={`mb-2.5 p-2 rounded-xl border text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-1.5 ${
                  transfer.isDirect 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-current text-[10px] uppercase">
                      De Gauche à Droite :
                    </span>
                    <span>
                      Borne 1 ({transfer.term1Phase}) ➔ Borne 2 ({transfer.term2Phase}) ➔ Borne 3 ({transfer.term3Phase})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-extrabold text-xs">
                    {transfer.isDirect ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        CYCLE DIRECT ({transfer.phaseAtU}-{transfer.phaseAtV}-{transfer.phaseAtW})
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        ORDRE INVERSÉ ({transfer.phaseAtU}-{transfer.phaseAtV}-{transfer.phaseAtW})
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {[0, 1, 2].map((idx) => {
                    const currentWire = WIRE_DEFINITIONS[outputWires[idx]];
                    const termNum = idx + 1;
                    const phaseAtThisTerm = idx === 0 ? transfer.term1Phase : idx === 1 ? transfer.term2Phase : transfer.term3Phase;
                    const coilFed = getCoilName(outputWires[idx]);

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-amber-500 transition-all shadow-sm"
                      >
                        <div className="flex items-center justify-between w-full text-[10px] font-mono font-bold text-slate-600 uppercase mb-1 px-1">
                          <span>Borne {termNum}</span>
                          <span className="text-amber-700 font-black">{phaseAtThisTerm}</span>
                        </div>

                        {/* Vis laiton */}
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 border border-amber-900/60 flex items-center justify-center mb-1 shadow-inner">
                          <div className="w-2.5 h-0.5 bg-slate-900 rounded" />
                        </div>

                        {/* Fil sortie */}
                        <div
                          className="w-4 h-8 rounded-full mb-1 shadow-sm border border-slate-900/40 relative overflow-hidden"
                          style={{ backgroundColor: currentWire.hex }}
                        >
                          <div className="absolute left-0.5 top-0 bottom-0 w-1 bg-white/30 rounded-full" />
                        </div>

                        <span className="text-xs font-black text-slate-900 mb-0.5">{currentWire.name.split(' ')[0]}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-700 mb-1">
                          Alimente Bobine {coilFed}
                        </span>
                        
                        <select
                          value={outputWires[idx]}
                          onChange={(e) => setOutputWireForTerminal(idx as 0 | 1 | 2, e.target.value)}
                          className="w-full text-[11px] font-mono font-bold bg-white border border-slate-300 rounded px-1 py-1 text-slate-900 focus:outline-none focus:border-amber-600 cursor-pointer"
                        >
                          <option value="brun">Brun (U)</option>
                          <option value="noir">Noir (V)</option>
                          <option value="gris">Gris (W)</option>
                        </select>
                      </div>
                    );
                  })}

                  {/* Neutre N Sortie */}
                  <div className="flex flex-col items-center text-center p-2 rounded-xl bg-sky-50 border-2 border-sky-200 shadow-sm">
                    <div className="flex items-center justify-between w-full text-[10px] font-mono font-bold text-sky-800 uppercase mb-1 px-1">
                      <span>Borne N</span>
                      <span>Neutre</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 border border-amber-900/60 flex items-center justify-center mb-1 shadow-inner">
                      <div className="w-2.5 h-0.5 bg-slate-900 rounded" />
                    </div>
                    <div className="w-4 h-8 rounded-full mb-1 bg-sky-500 shadow-sm border border-slate-900/40 relative overflow-hidden">
                      <div className="absolute left-0.5 top-0 bottom-0 w-1 bg-white/30 rounded-full" />
                    </div>
                    <span className="text-xs font-black text-slate-900 mb-0.5">Bleu</span>
                    <span className="text-[10px] font-mono font-bold text-sky-700 mb-1">Neutre (N)</span>
                    <div className="w-full text-[10px] font-mono font-semibold py-1 bg-sky-100 text-sky-800 rounded border border-sky-200">
                      Fixe
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Transfer Status Strip: Result on motor windings */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] font-mono gap-1 text-slate-700">
                <span className="font-bold text-slate-900">Alimentation des enroulements du moteur :</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-semibold">
                  Bobine U (Brun) = <strong>{transfer.phaseAtU}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-semibold">
                  Bobine V (Noir) = <strong>{transfer.phaseAtV}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-semibold">
                  Bobine W (Gris) = <strong>{transfer.phaseAtW}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE ROTA-PHASE & MOTOR (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700/80 rounded-2xl p-4 shadow-2xl flex-1 flex flex-col justify-between space-y-4">
            
            {/* Header + Speed controls on 1 line */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-white tracking-wider block text-xs uppercase">
                    MOTEUR ASYNCHRONE TRIPHASÉ
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Visualisation du Sens Réel de Rotation
                  </span>
                </div>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMotorSpeedMode('ultra-slow')}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    motorSpeedMode === 'ultra-slow'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                  title="Vitesse ultra-douce (20°/s)"
                >
                  20°/s
                </button>
                <button
                  onClick={() => setMotorSpeedMode('slow')}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    motorSpeedMode === 'slow'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                  title="Vitesse standard (45°/s)"
                >
                  45°/s
                </button>
                <button
                  onClick={() => setIsMotorPaused(!isMotorPaused)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                    isMotorPaused
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isMotorPaused ? 'Reprendre la rotation' : 'Mettre en pause'}
                >
                  {isMotorPaused ? '▶' : '⏸'}
                </button>
              </div>
            </div>

            {/* Statuts LED Horlogique / Antihorlogique */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <div
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                  transfer.isDirect
                    ? 'bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-950/60 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 opacity-40'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    transfer.isDirect
                      ? 'bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse ring-2 ring-emerald-300'
                      : 'bg-slate-700'
                  }`}
                />
                <div>
                  <div className="text-[11px] font-black text-emerald-300 leading-tight">ORDRE DIRECT</div>
                  <div className="text-[9px] text-slate-400 font-mono">Sens Horlogique (1-2-3) ↻</div>
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                  !transfer.isDirect
                    ? 'bg-rose-950/70 border-rose-500 shadow-md shadow-rose-950/60 ring-1 ring-rose-500/50'
                    : 'bg-slate-950/60 border-slate-800 opacity-40'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    !transfer.isDirect
                      ? 'bg-rose-500 shadow-md shadow-rose-500 animate-pulse ring-2 ring-rose-300'
                      : 'bg-slate-700'
                  }`}
                />
                <div>
                  <div className="text-[11px] font-black text-rose-300 leading-tight">ORDRE INVERSÉ</div>
                  <div className="text-[9px] text-slate-400 font-mono">Sens Antihorlogique ↺</div>
                </div>
              </div>
            </div>

            {/* VISUEL HAUTE FIDÉLITÉ : LE MOTEUR ASYNCHRONE TRIPHASÉ (COUPE ÉCORCHÉE & AILETTES) */}
            <div className="bg-slate-950/90 rounded-2xl p-3.5 border border-slate-800 shadow-inner space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 border-b border-slate-800/80 pb-1.5">
                <span className="uppercase tracking-wider flex items-center gap-1.5 font-bold text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Moteur Triphasé 3×400V (Vue Industrielle)
                </span>
                <span className="text-[9.5px] font-semibold text-slate-400">
                  Ns = 1500 tr/min · 4% Glissement
                </span>
              </div>

              {/* Dessin SVG Industriel du Moteur Asynchrone */}
              <div className="relative w-full aspect-[16/9] flex items-center justify-center bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden py-1">
                <svg viewBox="0 0 340 180" className="w-full h-full drop-shadow-xl select-none">
                  <defs>
                    {/* Gradients pour la carcasse en fonte d'acier */}
                    <linearGradient id="motorCaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>

                    {/* Gradient ailettes de refroidissement */}
                    <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#475569" />
                      <stop offset="50%" stopColor="#64748b" />
                      <stop offset="100%" stopColor="#334155" />
                    </linearGradient>

                    {/* Gradient arbre moteur en acier poli */}
                    <linearGradient id="shaftSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#e2e8f0" />
                      <stop offset="40%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>

                    {/* Rotor squirrel cage lamination pack */}
                    <radialGradient id="rotorCoreGrad" cx="40%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="70%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </radialGradient>
                  </defs>

                  {/* 1. Pattes de fixation au sol (Mounting Feet) */}
                  <path d="M 60 155 L 45 170 L 105 170 L 95 155 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  <path d="M 235 155 L 225 170 L 285 170 L 270 155 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  {/* Boulons d'ancrage */}
                  <circle cx="75" cy="164" r="3" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1" />
                  <circle cx="255" cy="164" r="3" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1" />
                  {/* Ligne de sol atelier */}
                  <line x1="30" y1="170" x2="310" y2="170" stroke="#334155" strokeWidth="1.5" strokeDasharray="6,4" />

                  {/* 2. Carcasse cylindrique avec ailettes thermiques (Cooling Fins) */}
                  {/* Ailettes longitudinales horizontales en arrière-plan */}
                  {[-40, -28, -16, -4, 8, 20, 32, 44].map((offsetY, idx) => (
                    <rect
                      key={idx}
                      x="70"
                      y={105 + offsetY}
                      width="190"
                      height="5"
                      rx="2.5"
                      fill="url(#finGrad)"
                      stroke="#1e293b"
                      strokeWidth="0.8"
                    />
                  ))}

                  {/* Corps central du stator */}
                  <rect x="85" y="55" width="160" height="100" rx="14" fill="url(#motorCaseGrad)" stroke="#475569" strokeWidth="2" />

                  {/* Anneau de levage M12 sur le dessus (Lifting Eye Bolt) */}
                  <ellipse cx="165" cy="22" rx="7" ry="10" fill="none" stroke="#94a3b8" strokeWidth="3" />
                  <rect x="160" y="30" width="10" height="6" fill="#64748b" stroke="#334155" strokeWidth="1" />

                  {/* 3. Boîte à bornes IP55 (Terminal Box) sur le dessus */}
                  <rect x="125" y="34" width="80" height="24" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                  <rect x="127" y="36" width="76" height="6" rx="2" fill="#1e293b" />
                  {/* 3 Fils d'alimentation entrant par le presse-étoupe : Brun, Noir, Gris */}
                  <g transform="translate(133, 44)">
                    <circle cx="10" cy="5" r="4" fill="#854d0e" stroke="#fbbf24" strokeWidth="1" />
                    <text x="10" y="8" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold">U</text>

                    <circle cx="32" cy="5" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                    <text x="32" y="8" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold">V</text>

                    <circle cx="54" cy="5" r="4" fill="#64748b" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="54" y="8" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold">W</text>
                  </g>

                  {/* 4. Fenêtre écorchée centrale montrant le Stator & Rotor en coupe */}
                  <circle cx="165" cy="105" r="45" fill="#090d16" stroke="#334155" strokeWidth="2.5" />

                  {/* Les 6 pôles bobinés du Stator (Bobinages cuivre à 120°) */}
                  {[0, 60, 120, 180, 240, 300].map((poleAngle, pIdx) => {
                    const pRad = (poleAngle * Math.PI) / 180;
                    const px = 165 + 38 * Math.cos(pRad);
                    const py = 105 + 38 * Math.sin(pRad);
                    const isBobineU = pIdx === 0 || pIdx === 3;
                    const isBobineV = pIdx === 1 || pIdx === 4;
                    const coilColor = isBobineU ? '#b45309' : isBobineV ? '#334155' : '#64748b';

                    return (
                      <g key={pIdx}>
                        <rect
                          x={px - 6}
                          y={py - 5}
                          width="12"
                          height="10"
                          rx="2"
                          fill={coilColor}
                          stroke="#fbbf24"
                          strokeWidth="0.8"
                          opacity="0.9"
                        />
                      </g>
                    );
                  })}

                  {/* Lignes de champ magnétique tournant B dans l'entrefer */}
                  <g transform={`rotate(${rotaAngle} 165 105)`}>
                    <circle r="34" cx="165" cy="105" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="5,4" opacity="0.6" />
                    <circle r="30" cx="165" cy="105" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="6,6" opacity="0.75" />
                  </g>

                  {/* 5. Rotor à cage d'écureuil & Barres en rotation */}
                  <g transform={`rotate(${rotaAngle} 165 105)`}>
                    {/* Disque rotor feuilleté */}
                    <circle cx="165" cy="105" r="26" fill="url(#rotorCoreGrad)" stroke="#475569" strokeWidth="1.5" />
                    {/* Anneau de court-circuit extérieur en cuivre */}
                    <circle cx="165" cy="105" r="24" fill="none" stroke="#d97706" strokeWidth="1.5" />

                    {/* Barres de cage inclinées (12 barres aluminium) */}
                    {Array.from({ length: 12 }).map((_, barIdx) => {
                      const bRad = (barIdx * 30 * Math.PI) / 180;
                      const bx1 = 165 + 13 * Math.cos(bRad);
                      const by1 = 105 + 13 * Math.sin(bRad);
                      const bx2 = 165 + 24 * Math.cos(bRad + 0.15); // inclinaison anti-harmoniques
                      const by2 = 105 + 24 * Math.sin(bRad + 0.15);
                      return (
                        <line
                          key={barIdx}
                          x1={bx1}
                          y1={by1}
                          x2={bx2}
                          y2={by2}
                          stroke="#cbd5e1"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      );
                    })}

                    {/* Moyeu et arbre moteur central en acier */}
                    <circle cx="165" cy="105" r="11" fill="url(#shaftSteelGrad)" stroke="#1e293b" strokeWidth="1.5" />
                    {/* Rainure de clavette et clavette d'entraînement */}
                    <rect x="163" y="96" width="4" height="6" fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />
                    <circle cx="165" cy="105" r="3" fill="#0f172a" />
                  </g>

                  {/* 6. Arbre de sortie externe prolongé vers la droite avec poulie / clavette */}
                  <rect x="245" y="99" width="45" height="12" rx="2" fill="url(#shaftSteelGrad)" stroke="#334155" strokeWidth="1.2" />
                  {/* Rainure de clavette visible sur l'arbre extérieur */}
                  <rect x="255" y="97" width="18" height="4" fill="#fbbf24" stroke="#78350f" strokeWidth="0.7" />

                  {/* 7. Arc fléché de couple et sens de rotation cinématique */}
                  <g transform="translate(165, 105)">
                    {transfer.isDirect ? (
                      /* SENS DIRECT (VERT HORLOGIQUE ↻) */
                      <g>
                        {/* Ombre / liseré de contraste */}
                        <path
                          d="M -35 0 A 35 35 0 0 1 32 -14"
                          fill="none"
                          stroke="#022c22"
                          strokeWidth="5"
                          strokeLinecap="round"
                          opacity="0.9"
                        />
                        {/* Arc principal vert horlogique */}
                        <path
                          d="M -35 0 A 35 35 0 0 1 32 -14"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                        <polygon
                          points="34,-21 39,-10 27,-14"
                          fill="#34d399"
                          stroke="#064e3b"
                          strokeWidth="0.8"
                        />
                      </g>
                    ) : (
                      /* SENS INVERSE (ROUGE ANTIHORLOGIQUE ↺) : symétrie axiale parfaite 100% identique au vert */
                      <g transform="scale(-1, 1)">
                        {/* Ombre / liseré de contraste */}
                        <path
                          d="M -35 0 A 35 35 0 0 1 32 -14"
                          fill="none"
                          stroke="#450a0a"
                          strokeWidth="5"
                          strokeLinecap="round"
                          opacity="0.9"
                        />
                        {/* Arc principal rouge antihorlogique */}
                        <path
                          d="M -35 0 A 35 35 0 0 1 32 -14"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                        <polygon
                          points="34,-21 39,-10 27,-14"
                          fill="#fb7185"
                          stroke="#4c0519"
                          strokeWidth="0.8"
                        />
                      </g>
                    )}
                  </g>

                  {/* 8. Plaque signalétique constructeur industrielle sur le flanc */}
                  <rect x="92" y="125" width="40" height="20" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
                  <text x="112" y="132" textAnchor="middle" fill="#94a3b8" fontSize="4.5" fontWeight="bold" fontFamily="monospace">RGIE 3x400V</text>
                  <text x="112" y="138" textAnchor="middle" fill="#38bdf8" fontSize="5" fontWeight="bold" fontFamily="monospace">1440 RPM</text>
                  <text x="112" y="143" textAnchor="middle" fill="#a3e635" fontSize="4" fontFamily="monospace">IP55 · 3 kW</text>
                </svg>
              </div>

              {/* Télémétrie & Diagnostic mécanique du Moteur */}
              <div className="space-y-1 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                    Sens Réel de Rotation Moteur :
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    Glissement g = 4.0%
                  </span>
                </div>

                <div
                  className={`text-xs font-black flex items-center gap-1.5 py-0.5 ${
                    transfer.isDirect ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {transfer.isDirect ? (
                    <>
                      <RotateCw className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Rotation HORLOGIQUE CONFORME (Sens horaire standard)</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Rotation ANTIHORLOGIQUE INVERSÉE (Sens inverse non conforme !)</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <span>
                    Séquence aux bobines :{' '}
                    <strong className="text-amber-400">
                      U ({transfer.phaseAtU}) · V ({transfer.phaseAtV}) · W ({transfer.phaseAtW})
                    </strong>
                  </span>
                  <span className="text-slate-400">
                    N_arbre ≈ <strong className="text-white">1440 tr/min</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Verdict Explanation Box */}
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed font-mono ${
                transfer.isDirect
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                {transfer.isDirect ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>CHAMP TOURNANT CONFORME (DIRECT)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>CHAMP TOURNANT INVERSÉ (PIÈGE EXAMEN)</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-normal opacity-95">
                {transfer.formulaProof}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
