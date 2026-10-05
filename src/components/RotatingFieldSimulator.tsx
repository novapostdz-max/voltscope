import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCw, 
  RotateCcw, 
  RefreshCw, 
  Gauge, 
  Sliders, 
  ChevronRight, 
  ChevronLeft,
  Activity,
  Layers,
  Sparkles,
  BookOpen,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { audioService } from '../utils/audio';
import { motorStateManager } from '../utils/motorState';

interface RotatingFieldSimulatorProps {
  onOpenExamCaseStudy?: () => void;
  onOpenRTCC?: () => void;
}

export const RotatingFieldSimulator: React.FC<RotatingFieldSimulatorProps> = ({
  onOpenExamCaseStudy,
  onOpenRTCC,
}) => {
  // Simulation parameters
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [phaseOrder, setPhaseOrder] = useState<'direct' | 'inverse'>('direct');
  // Visual frequency in Hz: default to 0.2 Hz for a very gentle, slow pedagogical rotation (1 turn = 5 seconds)
  const [visualFreq, setVisualFreq] = useState<number>(0.2);
  // Persistent continuous angles (never resets to 0 when opening tab or changing phases)
  const [timeAngleDeg, setTimeAngleDeg] = useState<number>(motorStateManager.fieldAngleDeg);
  const [rotorAngleDeg, setRotorAngleDeg] = useState<number>(motorStateManager.rotorAngleDeg);
  const [showComponents, setShowComponents] = useState<boolean>(true);
  const [showSineWaves, setShowSineWaves] = useState<boolean>(true);
  const [polePairs, setPolePairs] = useState<number>(2); // 1 = 3000 rpm, 2 = 1500 rpm

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);

  // Animation frame loop - continuous rotation without ever resetting to 0
  useEffect(() => {
    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      if (isRunning) {
        // Delta angle in degrees
        const sign = phaseOrder === 'direct' ? 1 : -1;
        const deltaField = 360 * visualFreq * dt * sign;
        const deltaRotor = 360 * visualFreq * dt * sign * 0.96; // 4% slip

        motorStateManager.advanceField(deltaField);
        motorStateManager.advanceRotor(deltaRotor);

        setTimeAngleDeg(motorStateManager.fieldAngleDeg);
        setRotorAngleDeg(motorStateManager.rotorAngleDeg);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, visualFreq, phaseOrder]);

  // Adjust audio pitch when frequency or run state changes
  useEffect(() => {
    if (audioService.getIsEnabled()) {
      audioService.startMotorSound(visualFreq * 40, isRunning);
    }
  }, [visualFreq, isRunning]);

  const toggleRun = () => {
    setIsRunning(!isRunning);
    audioService.playRelayClick();
  };

  const togglePhaseOrder = () => {
    audioService.playRelayClick();
    setPhaseOrder((prev) => (prev === 'direct' ? 'inverse' : 'direct'));
  };

  const stepAngle = (deg: number) => {
    setIsRunning(false);
    audioService.playRelayClick();
    setTimeAngleDeg((prev) => (prev + deg + 360) % 360);
  };

  // Convert timeAngle to radians
  const wtRad = (timeAngleDeg * Math.PI) / 180;

  // Instantaneous voltages / normalized currents
  // In Direct sequence:
  // u1 = sin(wt)
  // u2 = sin(wt - 120°)
  // u3 = sin(wt - 240°)
  // In Inverse sequence (Swapping phase 2 and 3, exactly like Brun-Gris-Noir-Bleu!):
  // u1 = sin(wt)
  // u2 = sin(wt - 240°)
  // u3 = sin(wt - 120°)
  const phase1Val = Math.sin(wtRad);
  const phase2Val = phaseOrder === 'direct' 
    ? Math.sin(wtRad - (2 * Math.PI) / 3) 
    : Math.sin(wtRad - (4 * Math.PI) / 3);
  const phase3Val = phaseOrder === 'direct' 
    ? Math.sin(wtRad - (4 * Math.PI) / 3) 
    : Math.sin(wtRad - (2 * Math.PI) / 3);

  // Geometric axes of the 3 stator coil pairs (spatial 120° separation)
  // Let coil 1 be at top (90°)
  // coil 2 at bottom-right (90° - 120° = -30° = 330°)
  // coil 3 at bottom-left (90° - 240° = -150° = 210°)
  const axis1Angle = Math.PI / 2; // 90° (up)
  const axis2Angle = Math.PI / 2 - (2 * Math.PI) / 3; // -30°
  const axis3Angle = Math.PI / 2 - (4 * Math.PI) / 3; // 210°

  // Magnetic vectors B1, B2, B3 along coil axes
  const B_SCALE = 55; // visual scale in pixels
  const b1x = phase1Val * B_SCALE * Math.cos(axis1Angle);
  const b1y = -phase1Val * B_SCALE * Math.sin(axis1Angle); // svg y is inverted

  const b2x = phase2Val * B_SCALE * Math.cos(axis2Angle);
  const b2y = -phase2Val * B_SCALE * Math.sin(axis2Angle);

  const b3x = phase3Val * B_SCALE * Math.cos(axis3Angle);
  const b3y = -phase3Val * B_SCALE * Math.sin(axis3Angle);

  // Resultant magnetic vector B_res = B1 + B2 + B3
  const bResX = b1x + b2x + b3x;
  const bResY = b1y + b2y + b3y;
  const bResMag = Math.sqrt(bResX * bResX + bResY * bResY);
  const bResAngleDeg = (Math.atan2(-bResY, bResX) * 180) / Math.PI;

  // Real motor theoretical speeds at 50Hz
  const syncSpeed = (60 * 50) / polePairs; // e.g. 1500 or 3000
  const rotorSpeed = Math.round(syncSpeed * 0.96); // 4% slip

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Title & Introduction Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>THÉORÈME DE FERRARIS &amp; PHYSIQUE DU STATOR</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Le Champ Magnétique Tournant &amp; la Rotation du Rotor
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Les trois tensions triphasées déphasées de 120° dans le temps alimentent 3 bobines déphasées de 120° dans l&apos;espace.
              La somme des trois champs produit un vecteur unique <strong className="text-amber-400">B_résultant</strong> de module constant qui tourne à la vitesse synchrone !
            </p>
          </div>

          {/* Quick status pill & Navigation buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenExamCaseStudy && (
              <button
                onClick={onOpenExamCaseStudy}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Aller à l'étude de cas d'examen ORES"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Étude de Cas Examen</span>
              </button>
            )}

            {onOpenRTCC && (
              <button
                onClick={onOpenRTCC}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Aller au simulateur Relais RTCC"
              >
                <Radio className="w-4 h-4 text-sky-400" />
                <span>Relais RTCC</span>
              </button>
            )}

            <button
              onClick={togglePhaseOrder}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                phaseOrder === 'direct'
                  ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300 shadow-lg shadow-emerald-950/40'
                  : 'bg-rose-950/70 border-rose-500/80 text-rose-300 shadow-lg shadow-rose-950/40'
              }`}
            >
              {phaseOrder === 'direct' ? (
                <>
                  <RotateCw className="w-4 h-4 text-emerald-400" />
                  <span>SENS DIRECT (HORLOGIQUE)</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>SENS INVERSE (CAS EXAMEN)</span>
                </>
              )}
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
              <strong>Règle cyclique :</strong> Si l’ordre des fils de sortie doit être modifié, celui-ci doit <strong>obligatoirement</strong> être changé selon un <strong>ordre cyclique</strong> (ex: <span className="text-emerald-300 font-bold">L1-L2-L3</span> ➔ <span className="text-emerald-300 font-bold">L2-L3-L1</span> ➔ <span className="text-emerald-300 font-bold">L3-L1-L2</span>), afin de conserver le même sens du champ tournant à l’arrivée du différentiel.
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Stator & Rotating Field Visualizer (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>COUPE TRANSVERSALE DU STATOR &amp; ROTOR</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Angle: <span className="text-amber-400 font-bold">{Math.round(timeAngleDeg)}°</span>
            </div>
          </div>

          {/* Stator SVG Diagram */}
          <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center my-2">
            <svg viewBox="-180 -180 360 360" className="w-full h-full drop-shadow-2xl">
              <defs>
                {/* Gradients */}
                <radialGradient id="statorGrad" cx="0%" cy="0%" r="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                <radialGradient id="rotorGrad" cx="0%" cy="0%" r="80%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </radialGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Stator Outer Ring (Frame) */}
              <circle r="160" fill="none" stroke="#334155" strokeWidth="16" />
              <circle r="150" fill="none" stroke="#1e293b" strokeWidth="4" />

              {/* Circular trajectory of rotating magnetic field B_res */}
              <circle r={B_SCALE * 1.5} fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3,3" opacity="0.35" />

              {/* Stator 3 Poles Coils Layout (at 120° angles) */}
              {/* Coil 1: Phase 1 L1 (U1) - BRUN */}
              <g transform="translate(0, -135)">
                <rect x="-28" y="-15" width="56" height="30" rx="7" fill="#854d0e" stroke="#fbbf24" strokeWidth="2.5" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  L1 (U1)
                </text>
                {/* Intensity halo based on phase1 current */}
                <circle r="24" fill="#854d0e" opacity={Math.abs(phase1Val) * 0.45} filter="url(#glow)" />
              </g>

              {/* Coil 2: Phase 2 L2 (V) - NOIR (ou L3 Gris si ordre inverse) at 330° (bottom-right) */}
              <g transform={`translate(${135 * Math.cos(axis2Angle)}, ${-135 * Math.sin(axis2Angle)})`}>
                <rect
                  x="-28"
                  y="-15"
                  width="56"
                  height="30"
                  rx="7"
                  fill={phaseOrder === 'direct' ? '#0f172a' : '#64748b'}
                  stroke={phaseOrder === 'direct' ? '#94a3b8' : '#cbd5e1'}
                  strokeWidth="2.5"
                />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {phaseOrder === 'direct' ? 'L2 (V)' : 'L3 (W)'}
                </text>
                <circle
                  r="24"
                  fill={phaseOrder === 'direct' ? '#64748b' : '#cbd5e1'}
                  opacity={Math.abs(phase2Val) * 0.45}
                  filter="url(#glow)"
                />
              </g>

              {/* Coil 3: Phase 3 L3 (W) - GRIS (ou L2 Noir si ordre inverse) at 210° (bottom-left) */}
              <g transform={`translate(${135 * Math.cos(axis3Angle)}, ${-135 * Math.sin(axis3Angle)})`}>
                <rect
                  x="-28"
                  y="-15"
                  width="56"
                  height="30"
                  rx="7"
                  fill={phaseOrder === 'direct' ? '#64748b' : '#0f172a'}
                  stroke={phaseOrder === 'direct' ? '#cbd5e1' : '#94a3b8'}
                  strokeWidth="2.5"
                />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {phaseOrder === 'direct' ? 'L3 (W)' : 'L2 (V)'}
                </text>
                <circle
                  r="24"
                  fill={phaseOrder === 'direct' ? '#cbd5e1' : '#64748b'}
                  opacity={Math.abs(phase3Val) * 0.45}
                  filter="url(#glow)"
                />
              </g>

              {/* Air Gap Circle */}
              <circle r="95" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />

              {/* Rotor Body (Squirrel Cage) rotating continuously along with field without resetting to zero */}
              <g transform={`rotate(${rotorAngleDeg})`}>
                {/* Rotor iron core */}
                <circle r="72" fill="url(#rotorGrad)" stroke="#64748b" strokeWidth="2" />
                {/* Rotor bars (conductive squirrel cage bars) */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <circle
                    key={deg}
                    cx={56 * Math.cos((deg * Math.PI) / 180)}
                    cy={56 * Math.sin((deg * Math.PI) / 180)}
                    r="4"
                    fill="#fbbf24"
                    stroke="#b45309"
                    strokeWidth="1"
                  />
                ))}
                {/* Center Shaft with Keyway */}
                <circle r="18" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                <rect x="14" y="-3" width="6" height="6" fill="#e2e8f0" rx="1" />
                {/* Center dot */}
                <circle r="4" fill="#f8fafc" />
              </g>

              {/* Magnetic Component Vectors (B1, B2, B3) */}
              {showComponents && (
                <g opacity="0.85">
                  {/* B1 Vector along vertical axis */}
                  <line x1="0" y1="0" x2={b1x} y2={b1y} stroke="#d97706" strokeWidth="2" strokeDasharray="2,2" />
                  <circle cx={b1x} cy={b1y} r="3" fill="#d97706" />

                  {/* B2 Vector */}
                  <line x1="0" y1="0" x2={b2x} y2={b2y} stroke="#64748b" strokeWidth="2" strokeDasharray="2,2" />
                  <circle cx={b2x} cy={b2y} r="3" fill="#64748b" />

                  {/* B3 Vector */}
                  <line x1="0" y1="0" x2={b3x} y2={b3y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="2,2" />
                  <circle cx={b3x} cy={b3y} r="3" fill="#94a3b8" />
                </g>
              )}
            </svg>

            {/* Overlaid Rotation Direction Badge */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
              <div
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl border ${
                  phaseOrder === 'direct'
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                    : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                }`}
              >
                {phaseOrder === 'direct' ? (
                  <>
                    <div style={{ transform: `rotate(${rotorAngleDeg}deg)` }} className="flex items-center justify-center">
                      <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span>Rotation Horlogique (Sens Horaire)</span>
                  </>
                ) : (
                  <>
                    <div style={{ transform: `rotate(${rotorAngleDeg}deg)` }} className="flex items-center justify-center">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <span>Rotation Antihorlogique (Sens Inverse)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Player Controls */}
          <div className="w-full mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleRun}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
                title={isRunning ? "Mettre en pause" : "Démarrer la rotation"}
              >
                {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => stepAngle(-15)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                title="Reculer de 15°"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => stepAngle(15)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                title="Avancer de 15°"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={togglePhaseOrder}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono border border-slate-700 flex items-center gap-1 cursor-pointer"
                title="Inverser le sens de rotation (Permutation de 2 phases)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Inverser Sens</span>
              </button>
            </div>

            {/* Speed / Frequency slider & gentle presets */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
              <span className="text-slate-300 font-semibold">Vitesse du moteur :</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVisualFreq(0.1)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    visualFreq === 0.1
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Rotation ultra douce (1 tour en 10 secondes)"
                >
                  Très doux (0.1 Hz)
                </button>
                <button
                  onClick={() => setVisualFreq(0.2)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    visualFreq === 0.2
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Rotation douce (1 tour en 5 secondes)"
                >
                  Doux (0.2 Hz)
                </button>
                <button
                  onClick={() => setVisualFreq(0.5)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    visualFreq === 0.5
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Vitesse modérée"
                >
                  0.5 Hz
                </button>
              </div>

              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={visualFreq}
                  onChange={(e) => setVisualFreq(parseFloat(e.target.value))}
                  className="w-24 accent-amber-400 cursor-pointer"
                />
                <span className="text-amber-400 font-bold w-12 text-right">{visualFreq.toFixed(2)} Hz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: 3-Phase Sine Waves & Formulas (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Synchronized 3-Phase Waveform Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>FORMES D&apos;ONDES TRIPHASÉES (50 Hz)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Déphasage 120°</span>
            </div>

            {/* SVG Sine Wave Canvas */}
            <div className="h-44 w-full bg-slate-950 rounded-xl border border-slate-800/80 p-2 relative overflow-hidden">
              <svg viewBox="0 -1.2 360 2.4" preserveAspectRatio="none" className="w-full h-full">
                {/* Horizontal Zero Voltage Axis */}
                <line x1="0" y1="0" x2="360" y2="0" stroke="#334155" strokeWidth="0.04" strokeDasharray="4,4" />

                {/* Vertical 120° and 240° grid lines */}
                <line x1="120" y1="-1.2" x2="120" y2="1.2" stroke="#1e293b" strokeWidth="0.04" />
                <line x1="240" y1="-1.2" x2="240" y2="1.2" stroke="#1e293b" strokeWidth="0.04" />

                {/* Phase 1 Wave: sin(x) (Brun) */}
                <path
                  d={Array.from({ length: 73 }, (_, i) => {
                    const deg = i * 5;
                    const rad = (deg * Math.PI) / 180;
                    const val = Math.sin(rad);
                    return `${i === 0 ? 'M' : 'L'} ${deg} ${-val}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="0.08"
                />

                {/* Phase 2 Wave */}
                <path
                  d={Array.from({ length: 73 }, (_, i) => {
                    const deg = i * 5;
                    const rad = (deg * Math.PI) / 180;
                    const shift = phaseOrder === 'direct' ? (2 * Math.PI) / 3 : (4 * Math.PI) / 3;
                    const val = Math.sin(rad - shift);
                    return `${i === 0 ? 'M' : 'L'} ${deg} ${-val}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="0.08"
                />

                {/* Phase 3 Wave */}
                <path
                  d={Array.from({ length: 73 }, (_, i) => {
                    const deg = i * 5;
                    const rad = (deg * Math.PI) / 180;
                    const shift = phaseOrder === 'direct' ? (4 * Math.PI) / 3 : (2 * Math.PI) / 3;
                    const val = Math.sin(rad - shift);
                    return `${i === 0 ? 'M' : 'L'} ${deg} ${-val}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="0.08"
                />

                {/* Animated Time Marker Vertical Line */}
                <line
                  x1={((timeAngleDeg % 360) + 360) % 360}
                  y1="-1.2"
                  x2={((timeAngleDeg % 360) + 360) % 360}
                  y2="1.2"
                  stroke="#f59e0b"
                  strokeWidth="0.08"
                />
                <circle
                  cx={((timeAngleDeg % 360) + 360) % 360}
                  cy={-phase1Val}
                  r="0.08"
                  fill="#d97706"
                />
              </svg>
            </div>

            {/* Instantaneous Values table */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block font-bold">Phase L1 (Brun)</span>
                <span className="text-white font-bold">{phase1Val > 0 ? '+' : ''}{(phase1Val * 325).toFixed(0)} V</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <span className="text-[10px] text-slate-300 block font-bold">
                  {phaseOrder === 'direct' ? 'Phase L2 (Noir)' : 'Phase L3 (Gris)'}
                </span>
                <span className="text-white font-bold">{phase2Val > 0 ? '+' : ''}{(phase2Val * 325).toFixed(0)} V</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">
                  {phaseOrder === 'direct' ? 'Phase L3 (Gris)' : 'Phase L2 (Noir)'}
                </span>
                <span className="text-white font-bold">{phase3Val > 0 ? '+' : ''}{(phase3Val * 325).toFixed(0)} V</span>
              </div>
            </div>
          </div>

          {/* Motor Specifications & Synchrone Speed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>TACHYMÈTRE &amp; CARACTÉRISTIQUES MOTEUR</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Fréquence réseau 50 Hz</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">Vitesse du Champ (Ns)</div>
                <div className="text-amber-400 text-lg font-black">{syncSpeed} tr/min</div>
                <div className="text-[10px] text-slate-500">Ns = (60 × f) / p</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">Vitesse Réelle du Rotor (N)</div>
                <div className="text-white text-lg font-black">
                  {phaseOrder === 'direct' ? '+' : '-'}{rotorSpeed} tr/min
                </div>
                <div className="text-[10px] text-slate-500">Glissement g ≈ 4%</div>
              </div>
            </div>

            {/* Ferraris Mathematical Proof Note */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Théorème de Ferraris (1888) :</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                B_résultant = (3/2) × B_max = Constante.<br />
                Le module du champ ne varie JAMAIS dans le temps. Seul son angle tourne à la vitesse pulsation ω = 2πf.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
