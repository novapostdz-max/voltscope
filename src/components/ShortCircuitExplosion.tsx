import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ShieldAlert, Zap, X, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface ShortCircuitExplosionProps {
  isOpen: boolean;
  onClose: () => void;
  onResetBreaker?: () => void;
  breakerRating?: number;
  upstreamRating?: number;
  iccValue?: number;
}

// Synthétiseur audio Web Audio API pour simuler l'arc électrique violent (4500A), la déflagration et le claquement sec
function playArcFlashSound(isMuted: boolean = false) {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;

    // 1. ZZZZT - Arc électrique 50Hz saturé avec harmoniques violentes
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const arcGain = ctx.createGain();
    const dist = ctx.createWaveShaper();

    // Courbe de distorsion pour simuler la saturation extrême de l'arc
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + 10) * x) / (Math.PI + 10 * Math.abs(x));
    }
    dist.curve = curve;

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(50, now);

    arcGain.gain.setValueAtTime(0.5, now);
    arcGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc1.connect(dist);
    osc2.connect(dist);
    dist.connect(arcGain);
    arcGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);

    // 2. BOOM - Explosion / onde de choc thermique (bruit blanc filtré passe-bas)
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 0.6);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.75);

    // 3. CLAC - Déclencheur magnétique amont (< 10ms coupure mécanique)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(2800, now + 0.04);
    clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.setValueAtTime(0.7, now + 0.04);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);

    clickOsc.start(now + 0.04);
    clickOsc.stop(now + 0.1);
  } catch (e) {
    console.warn('Audio non supporté pour arc flash:', e);
  }
}

export const ShortCircuitExplosion: React.FC<ShortCircuitExplosionProps> = ({
  isOpen,
  onClose,
  onResetBreaker,
  breakerRating = 40,
  upstreamRating = 63,
  iccValue = 4500,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [step, setStep] = useState<'blast' | 'fire' | 'smoke'>('blast');

  // Relancer l'effet sonore et l'animation lors de l'ouverture
  useEffect(() => {
    if (!isOpen) return;

    setStep('blast');
    playArcFlashSound(isMuted);

    const fireTimer = setTimeout(() => setStep('fire'), 300);
    const smokeTimer = setTimeout(() => setStep('smoke'), 1400);

    return () => {
      clearTimeout(fireTimer);
      clearTimeout(smokeTimer);
    };
  }, [isOpen, isMuted]);

  // Simulation particulaire Canvas (étincelles incandescentes, débris d'arc flash, flammes)
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const centerX = width / 2;
    const centerY = height * 0.45;

    // Génération des particules d'étincelles incandescentes (cuivre vaporisé & arc)
    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      life: number;
      maxLife: number;
      color: string;
      trail: { x: number; y: number }[];
    }

    interface FireParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      life: number;
      maxLife: number;
      color: string;
      alpha: number;
    }

    const sparks: Spark[] = [];
    const sparkColors = ['#FFFBEB', '#FDE047', '#F59E0B', '#EF4444', '#DC2626', '#38BDF8'];

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 3;
      sparks.push({
        x: centerX + (Math.random() - 0.5) * 20,
        y: centerY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        radius: Math.random() * 3 + 1.2,
        life: 0,
        maxLife: Math.random() * 50 + 35,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        trail: [],
      });
    }

    // Particules de feu et flammes montantes
    const fireParticles: FireParticle[] = [];
    const fireColors = ['#FEF08A', '#FBBF24', '#F97316', '#EA580C', '#DC2626', '#7F1D1D'];

    let frame = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      frame++;

      // Émission continue de particules de feu pendant les 120 premières frames
      if (frame < 140) {
        for (let i = 0; i < 5; i++) {
          const spreadX = (Math.random() - 0.5) * 70;
          fireParticles.push({
            x: centerX + spreadX,
            y: centerY + 20 + Math.random() * 10,
            vx: (Math.random() - 0.5) * 2.5,
            vy: -(Math.random() * 4 + 2),
            radius: Math.random() * 18 + 10,
            life: 0,
            maxLife: Math.random() * 40 + 25,
            color: fireColors[Math.floor(Math.random() * fireColors.length)],
            alpha: 0.9,
          });
        }
      }

      // Dessin et mise à jour des particules de feu
      for (let i = fireParticles.length - 1; i >= 0; i--) {
        const p = fireParticles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.radius *= 0.97;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.life >= p.maxLife || p.radius < 1) {
          fireParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Dessin des étincelles avec traînée balistique
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 5) s.trail.shift();

        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.35; // Gravité
        s.vx *= 0.98; // Frottement de l'air

        const progress = s.life / s.maxLife;
        const alpha = Math.max(0, 1 - progress);

        if (s.life >= s.maxLife) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // Traînée
        if (s.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(s.trail[0].x, s.trail[0].y);
          for (let j = 1; j < s.trail.length; j++) {
            ctx.lineTo(s.trail[j].x, s.trail[j].y);
          }
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.radius * 0.8;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Tête de l'étincelle
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      if (sparks.length > 0 || fireParticles.length > 0 || frame < 180) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none">
        {/* Arrière-plan assombri avec tremblement d'onde de choc (Screen Shake) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* 1. FLASH D'ARC ÉLECTRIQUE INSTANTANÉ (ARC FLASH 4500A) */}
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: [1, 0.8, 0], scale: [1, 1.05, 1.1] }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute inset-0 bg-gradient-to-r from-amber-100 via-white to-cyan-100 pointer-events-none mix-blend-overlay z-10"
        />

        {/* 2. EFFET TREMBLEMENT (SCREEN SHAKE WRAPPER) */}
        <motion.div
          initial={{ x: 0, y: 0 }}
          animate={{
            x: [0, -18, 16, -14, 12, -8, 6, -3, 0],
            y: [0, 14, -12, 10, -8, 6, -4, 2, 0],
          }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="relative z-20 w-full max-w-xl flex flex-col items-center pointer-events-auto"
        >
          {/* Canvas particulaire (étincelles, traînées, flammes en projection) */}
          <div className="absolute -inset-20 pointer-events-none z-30 overflow-visible">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          {/* ONDE DE CHOC RADIALE & BOULE DE FEU CENTRALE */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center pointer-events-none mb-3">
            {/* Onde de choc supersonique */}
            <motion.div
              initial={{ scale: 0.2, opacity: 1, borderWidth: 8 }}
              animate={{ scale: 2.4, opacity: 0, borderWidth: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute w-40 h-40 rounded-full border-amber-400/80 shadow-[0_0_50px_rgba(251,191,36,0.8)] pointer-events-none"
            />

            {/* Deuxième onde de choc (arc bleu électrique) */}
            <motion.div
              initial={{ scale: 0.1, opacity: 1 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
              className="absolute w-36 h-36 rounded-full border-2 border-cyan-300 shadow-[0_0_40px_rgba(56,189,248,0.9)] pointer-events-none"
            />

            {/* Boule de feu centrale (Fireball) avec dilatation et pulsation */}
            <motion.div
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{
                scale: [0.3, 1.4, 1.2, 0.9, 0],
                opacity: [1, 1, 0.9, 0.6, 0],
              }}
              transition={{ duration: 1.6, times: [0, 0.2, 0.4, 0.7, 1], ease: 'easeOut' }}
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-300 blur-md shadow-[0_0_80px_#f97316] pointer-events-none"
            />

            {/* Cœur incandescent blanc/jaune de l'arc électrique */}
            <motion.div
              initial={{ scale: 0.1, opacity: 1 }}
              animate={{ scale: [0.1, 1.2, 0.4, 0], opacity: [1, 1, 0.8, 0] }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute w-24 h-24 rounded-full bg-white blur-sm shadow-[0_0_60px_#ffffff] pointer-events-none"
            />

            {/* Flammes animées montantes (SVG stylisé) */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.8 }}
              animate={{
                opacity: [0, 1, 1, 0.7, 0],
                y: [15, -10, -25, -45, -60],
                scale: [0.8, 1.3, 1.4, 1.1, 0.7],
              }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              className="absolute flex items-center justify-center text-orange-500 pointer-events-none"
            >
              <div className="relative">
                <Flame className="w-24 h-24 sm:w-32 sm:h-32 text-amber-400 fill-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.9)] animate-pulse" />
                <Flame className="w-16 h-16 sm:w-20 sm:h-20 text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] absolute top-4 left-4" />
                <Flame className="w-10 h-10 text-yellow-200 fill-yellow-200 absolute top-8 left-8" />
              </div>
            </motion.div>

            {/* Volutes de fumée montant après l'explosion */}
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{
                opacity: [0, 0.3, 0.6, 0.4, 0],
                y: [0, -40, -80, -120],
                scale: [0.6, 1, 1.5, 2.2],
              }}
              transition={{ duration: 2.6, delay: 0.2, ease: 'easeOut' }}
              className="absolute w-32 h-32 rounded-full bg-slate-800/80 blur-xl pointer-events-none"
            />
          </div>

          {/* CARTE D'ALERTE DU COURT-CIRCUIT AVEC RAPPORT PÉDAGOGIQUE */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl shadow-2xl p-4 sm:p-5 text-white backdrop-blur-xl relative overflow-hidden"
          >
            {/* Lueur rouge/ambre d'arrière-plan */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" />

            {/* En-tête avec bouton mute & fermeture */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400 animate-bounce">
                  <Flame className="w-5 h-5 fill-rose-500 text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-rose-400 uppercase tracking-tight flex items-center gap-1.5">
                      💥 Court-Circuit Franc Détecté !
                    </h3>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Icc ≈ {iccValue.toLocaleString()} A
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Déflagration thermique & Arc Flash instantané neutralisés par le disjoncteur
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isMuted;
                    setIsMuted(next);
                    if (!next) playArcFlashSound(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Activer le son' : 'Couper le son'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grille de métriques physiques de la déflagration */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3.5">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Intensité Pic</span>
                <span className="font-mono text-base font-black text-rose-400">{iccValue} A</span>
                <span className="text-[8px] text-rose-300/80 block">Énergie thermique max</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Temps Coupure</span>
                <span className="font-mono text-base font-black text-amber-300">&lt; 8 ms</span>
                <span className="text-[8px] text-amber-200/80 block">Bobine magnétique</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Disjoncteur Amont</span>
                <span className="font-mono text-base font-black text-emerald-400">{upstreamRating} A</span>
                <span className="text-[8px] text-emerald-300/80 block">Pouvoir de coupure 10kA</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Tension Réseau</span>
                <span className="font-mono text-base font-black text-rose-500">0 V</span>
                <span className="text-[8px] text-slate-400 block">Compteur hors tension</span>
              </div>
            </div>

            {/* Explication technique de la sélectivité RGIE */}
            <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-3 text-[10.5px] leading-relaxed text-rose-200/90 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Pourquoi le Disjoncteur Amont a sauté et coupé l'explosion ?</span>
              </div>
              <p>
                Un court-circuit provoque une élévation brutale du courant jusqu'à <strong>{iccValue} A</strong>.
                À cette intensité colossale, la <strong>bobine magnétique</strong> du disjoncteur amont ({upstreamRating} A) attire son plongeur en moins de <strong>8 millisecondes</strong>, soufflant l'arc électrique dans la chambre d'extinction désionisante avant que les câbles ne prennent feu !
              </p>
              <div className="pt-1 flex items-center justify-between text-[9px] text-amber-300/90 font-mono">
                <span>• Breaker Interne : non sollicité (le magnétique amont a coupé le réseau en amont)</span>
                <span>• Pouvoir de coupure Icu : 10 000 A (10 kA)</span>
              </div>
            </div>

            {/* Actions de contrôle */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
              {onResetBreaker && (
                <button
                  type="button"
                  onClick={() => {
                    onResetBreaker();
                    onClose();
                  }}
                  className="w-full sm:flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white rounded-xl text-xs font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Réarmer le Disjoncteur Amont ({upstreamRating}A)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  playArcFlashSound(isMuted);
                  setStep('blast');
                }}
                className="w-full sm:w-auto py-2.5 px-4 bg-white/10 hover:bg-white/20 active:scale-95 text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Rejouer l'Arc Flash</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-4 bg-rose-900/40 hover:bg-rose-900/60 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-rose-800/40 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
