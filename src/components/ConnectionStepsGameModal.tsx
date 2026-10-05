/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  X,
  Shuffle,
  Timer,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  GripVertical,
  Check,
  RotateCcw,
  Flame,
  Award,
  ListOrdered,
  Printer,
} from 'lucide-react';

export interface ConnectionStep {
  id: number; // 0 to 11 (correct chronological index)
  title: string;
  category: 'preparation' | 'amont' | 'appareillage' | 'mesures' | 'client_cloture';
  categoryLabel: string;
  criticalSafety?: string;
  toolTip?: string;
}

export const OFFICIAL_CONNECTION_STEPS: ConnectionStep[] = [
  {
    id: 0,
    title: "Vérifier que l’embase est bien fixée.",
    category: 'preparation',
    categoryLabel: '1. Préparation & Fixation',
    criticalSafety: "Contrôler la solidité mécanique du support mural avant toute pose.",
    toolTip: "Assure l'alignement et la stabilité du coffret 25D60 et du compteur.",
  },
  {
    id: 1,
    title: "Dénuder les câbles d'alimentation 60 cm avec les gants de manutention, placer l'antipoussière, en ajoutant les bouchons isolés. Placer l’anti-traction sur le câble et fixer le câble.",
    category: 'preparation',
    categoryLabel: '1. Préparation & Fixation',
    criticalSafety: "Gants de manutention obligatoires + pose impérative de l'anti-traction et bouchons isolés.",
    toolTip: "Longueur de dénudage normalisée à 60 cm pour le cheminement amont.",
  },
  {
    id: 2,
    title: "Placer le sectionneur et vérifier la position 0, avec les EPI, raccorder les phases en commençant par le neutre et finaliser avec la clé dynamométrique, mettre la toile isolante.",
    category: 'amont',
    categoryLabel: '2. Raccordement Amont Réseau',
    criticalSafety: "Vérifier position 0 • EPI obligatoires • Raccorder impérativement en commençant par le neutre • Serrage au couple (clé dynamométrique) • Toile isolante.",
    toolTip: "Raccordement sous tension ou amont direct : respect strict de la procédure sécurité GRD.",
  },
  {
    id: 3,
    title: "Placer le coffret intermédiaire, placer le disjoncteur ; vérifier position zéro, et placer les câbles 60 cm. N'oublie pas de respecter la couleur des phases et neutre.",
    category: 'appareillage',
    categoryLabel: '3. Appareillage & Disjoncteur',
    criticalSafety: "Disjoncteur en position 0 (ouvert) • Respect scrupuleux des codes couleurs normalisés (Brun L1, Noir L2, Gris L3, Bleu N).",
    toolTip: "Câbles de liaison 60 cm entre sectionneur et disjoncteur.",
  },
  {
    id: 4,
    title: "Placer le plastron supérieur, placer le compteur et mettre les câbles 30 cm entre lui et le disjoncteur, en respectant les codages couleurs.",
    category: 'appareillage',
    categoryLabel: '3. Appareillage & Disjoncteur',
    criticalSafety: "Liaisons 30 cm compteur-disjoncteur avec respect strict du repérage des phases.",
    toolTip: "Le plastron supérieur sécurise l'enveloppe intermédiaire avant la pose du compteur.",
  },
  {
    id: 5,
    title: "Prendre la tension en dessous du sectionneur, fermer le disjoncteur.",
    category: 'mesures',
    categoryLabel: '4. Contrôles & Mesures Réseau',
    criticalSafety: "Contrôle VAT (Vérificateur d'Absence de Tension / Multimètre) en dessous du sectionneur avant enclenchement.",
    toolTip: "Validation de la présence de tension réseau avant d'alimenter l'étage suivant.",
  },
  {
    id: 6,
    title: "Prendre les tensions et le champ tournant en dessous sortie compteur.",
    category: 'mesures',
    categoryLabel: '4. Contrôles & Mesures Réseau',
    criticalSafety: "Vérification des tensions phase-phase / phase-neutre et du sens horaire du champ tournant (1-2-3). Remarque Importante : Le champ tournant en sortie doit impérativement être conservé à l’identique. Les câbles de sortie en tête de compteur doivent rester dans le même ordre que celui existant. Toute modification de cet ordre risque de modifier le champ tournant à l’arrivée du différentiel. Si l’ordre des fils de sortie doit être modifié, celui-ci doit obligatoirement être changé selon un ordre cyclique, afin de conserver le même sens du champ tournant à l’arrivée du différentiel.",
    toolTip: "Essentiel pour préserver le sens de rotation des moteurs triphasés et garantir la conformité à l'arrivée du différentiel.",
  },
  {
    id: 7,
    title: "Paramétrer le compteur.",
    category: 'mesures',
    categoryLabel: '4. Contrôles & Mesures Réseau',
    criticalSafety: "Configuration des tarifs, du breaker interne et activation de la communication e-MUCS / P1.",
    toolTip: "Appairage avec le système central GRD (AMR/AMI).",
  },
  {
    id: 8,
    title: "Ouvrir le disjoncteur après le sectionneur.",
    category: 'amont',
    categoryLabel: '5. Sécurisation Client',
    criticalSafety: "Ouverture obligatoire pour consigner le départ vers le client avant tout travail sur les bornes aval.",
    toolTip: "Garantit que le bornier client est hors tension pendant le câblage.",
  },
  {
    id: 9,
    title: "Mettre les câbles client.",
    category: 'client_cloture',
    categoryLabel: '5. Sécurisation Client',
    criticalSafety: "Raccordement des départs vers le tableau privatif résidentiel du client. Remarque Importante : Les câbles de sortie en tête de compteur doivent rester dans le même ordre que celui existant. Si l’ordre des fils de sortie doit être modifié, celui-ci doit obligatoirement être changé selon un ordre cyclique, afin de conserver le même sens du champ tournant à l’arrivée du différentiel.",
    toolTip: "Câblage sur les bornes aval du compteur ou du disjoncteur client en conservant scrupuleusement l'ordre cyclique des phases.",
  },
  {
    id: 10,
    title: "Placer le plastron du bas et fermer le sectionneur par la fenêtre prévue, refermer la fenêtre, et mettre le cache tête compteur.",
    category: 'client_cloture',
    categoryLabel: '6. Clôture & Plombage',
    criticalSafety: "Mise sous tension finale par manœuvre du sectionneur à travers la fenêtre dédiée • Fermeture et plombage du cache-bornes.",
    toolTip: "Verrouille l'accès aux parties actives non mesurées.",
  },
  {
    id: 11,
    title: "Mettre le QR code et appeler le client pour lui expliquer et surtout ne pas relever le disjoncteur. C’est au client de le faire.",
    category: 'client_cloture',
    categoryLabel: '6. Clôture & Plombage',
    criticalSafety: "RÈGLE RGIE STRICTE : L'électricien GRD NE RELEVE PAS le disjoncteur client. L'enclenchement final incombe exclusivement au client pour des raisons de sécurité de ses récepteurs intérieurs.",
    toolTip: "Pose de l'étiquette QR code de métrologie et transmission des consignes de sécurité à l'occupant.",
  },
];

// Palette de couleurs distinctives pour chaque numéro d'étape (0 à 11) - au lieu du fond noir
export const STEP_COLOR_PALETTE: Record<
  number,
  {
    name: string;
    text: string;
    border: string;
    bgLight: string;
    badgeBg: string;
    badgeText: string;
    dot: string;
    hex: string;
  }
> = {
  0: {
    name: 'Bleu Royal',
    text: 'text-blue-700',
    border: 'border-blue-400',
    bgLight: 'bg-blue-50',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    dot: 'bg-blue-600',
    hex: '#2563eb',
  },
  1: {
    name: 'Ambre Chaud',
    text: 'text-amber-800',
    border: 'border-amber-400',
    bgLight: 'bg-amber-50',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    dot: 'bg-amber-600',
    hex: '#d97706',
  },
  2: {
    name: 'Émeraude',
    text: 'text-emerald-700',
    border: 'border-emerald-400',
    bgLight: 'bg-emerald-50',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    dot: 'bg-emerald-600',
    hex: '#059669',
  },
  3: {
    name: 'Indigo',
    text: 'text-indigo-700',
    border: 'border-indigo-400',
    bgLight: 'bg-indigo-50',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    dot: 'bg-indigo-600',
    hex: '#4f46e5',
  },
  4: {
    name: 'Pourpre',
    text: 'text-purple-700',
    border: 'border-purple-400',
    bgLight: 'bg-purple-50',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    dot: 'bg-purple-600',
    hex: '#9333ea',
  },
  5: {
    name: 'Bleu Ciel',
    text: 'text-sky-700',
    border: 'border-sky-400',
    bgLight: 'bg-sky-50',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    dot: 'bg-sky-600',
    hex: '#0284c7',
  },
  6: {
    name: 'Turquoise Sarcelle',
    text: 'text-teal-700',
    border: 'border-teal-400',
    bgLight: 'bg-teal-50',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    dot: 'bg-teal-600',
    hex: '#0d9488',
  },
  7: {
    name: 'Rose Corail',
    text: 'text-rose-700',
    border: 'border-rose-400',
    bgLight: 'bg-rose-50',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    dot: 'bg-rose-600',
    hex: '#e11d48',
  },
  8: {
    name: 'Orange Vif',
    text: 'text-orange-700',
    border: 'border-orange-400',
    bgLight: 'bg-orange-50',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    dot: 'bg-orange-600',
    hex: '#ea580c',
  },
  9: {
    name: 'Violet Électrique',
    text: 'text-violet-700',
    border: 'border-violet-400',
    bgLight: 'bg-violet-50',
    badgeBg: 'bg-violet-600',
    badgeText: 'text-white',
    dot: 'bg-violet-600',
    hex: '#7c3aed',
  },
  10: {
    name: 'Fuchsia Magenta',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-400',
    bgLight: 'bg-fuchsia-50',
    badgeBg: 'bg-fuchsia-600',
    badgeText: 'text-white',
    dot: 'bg-fuchsia-600',
    hex: '#c026d3',
  },
  11: {
    name: 'Vert Lime',
    text: 'text-lime-800',
    border: 'border-lime-400',
    bgLight: 'bg-lime-50',
    badgeBg: 'bg-lime-600',
    badgeText: 'text-white',
    dot: 'bg-lime-600',
    hex: '#65a30d',
  },
};

// Helper to shuffle an array avoiding identity permutation
function shuffleSteps(steps: ConnectionStep[]): ConnectionStep[] {
  const arr = [...steps];
  let isSorted = true;
  while (isSorted) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // ensure not identical to 0..11
    isSorted = arr.every((item, idx) => item.id === idx);
  }
  return arr;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionStepsGameModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [userSteps, setUserSteps] = useState<ConnectionStep[]>(() =>
    shuffleSteps(OFFICIAL_CONNECTION_STEPS)
  );
  const [hasChecked, setHasChecked] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Select a step for a given position (swap with wherever it currently is)
  const handleSelectStepForPosition = (targetPos: number, selectedStepId: number) => {
    setUserSteps((prev) => {
      const currentPos = prev.findIndex((s) => s.id === selectedStepId);
      if (currentPos === -1 || currentPos === targetPos) {
        return prev;
      }
      const copy = [...prev];
      const temp = copy[targetPos];
      copy[targetPos] = copy[currentPos];
      copy[currentPos] = temp;
      return copy;
    });
    setMoveCount((c) => c + 1);
    setHasChecked(false);
    setPickerTargetIndex(null);
  };

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isOpen && isTimerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning]);

  // Restart / Reset game
  const handleRestart = () => {
    setUserSteps(shuffleSteps(OFFICIAL_CONNECTION_STEPS));
    setHasChecked(false);
    setShowSolution(false);
    setMoveCount(0);
    setSeconds(0);
    setIsTimerRunning(true);
  };

  // Move step up or down
  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= userSteps.length) return;

    setUserSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    setMoveCount((c) => c + 1);
    setHasChecked(false);
  };

  // HTML5 Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    setUserSteps((prev) => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(draggedIndex, 1);
      copy.splice(dropIndex, 0, draggedItem);
      return copy;
    });

    setMoveCount((c) => c + 1);
    setDraggedIndex(null);
    setHasChecked(false);
  };

  // Calculate score
  const correctPositions = useMemo(() => {
    return userSteps.map((step, currentIdx) => step.id === currentIdx);
  }, [userSteps]);

  const score = useMemo(() => {
    return correctPositions.filter(Boolean).length;
  }, [correctPositions]);

  const isCompleteVictory = score === OFFICIAL_CONNECTION_STEPS.length;

  // Format timer
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        >
          {/* HEADER MODAL */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-b border-white/10 shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-inner">
                <ListOrdered className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                    Défi Raccordement Compteur
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    12 Étapes
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Classez chronologiquement les 12 étapes de raccordement du compteur intelligent (0 à 11).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BARRE D'OUTILS DU JEU : SCORE, CHRONO, ACTIONS */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
              {/* Chronomètre */}
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                <Timer className="w-3.5 h-3.5 text-teal-600" />
                <span>{formatTime(seconds)}</span>
              </div>

              {/* Compteur de déplacements */}
              <div className="flex items-center gap-1.5 font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400">Mouvements :</span>
                <span className="font-mono font-black text-slate-900">{moveCount}</span>
              </div>

              {/* Score si vérifié */}
              {hasChecked && (
                <div
                  className={`flex items-center gap-1.5 font-black px-2.5 py-1 rounded-xl border shadow-2xs ${
                    isCompleteVictory
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Score : {score} / {OFFICIAL_CONNECTION_STEPS.length} exactes
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Bouton Mélanger */}
              <button
                type="button"
                onClick={handleRestart}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Mélanger à nouveau les étapes"
              >
                <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                <span>Mélanger</span>
              </button>

              {/* Bouton Indices */}
              <button
                type="button"
                onClick={() => setShowHints((h) => !h)}
                className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  showHints
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Afficher/masquer les consignes clés de sécurité"
              >
                <Flame className={`w-3.5 h-3.5 ${showHints ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{showHints ? 'Masquer Indices' : 'Indices Sécurité'}</span>
              </button>

              {/* Bouton Solution / Abandon */}
              <button
                type="button"
                onClick={() => {
                  if (!showSolution) {
                    setUserSteps([...OFFICIAL_CONNECTION_STEPS]);
                    setShowSolution(true);
                    setHasChecked(true);
                  } else {
                    handleRestart();
                  }
                }}
                className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  showSolution
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-purple-600" />
                <span>{showSolution ? 'Rejouer' : 'Solution'}</span>
              </button>

              {/* Bouton Vérifier Ordre */}
              <button
                type="button"
                onClick={() => setHasChecked(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />
                <span>Vérifier mon Ordre</span>
              </button>
            </div>
          </div>

          {/* BANNIÈRE DE VICTOIRE */}
          {hasChecked && isCompleteVictory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white shrink-0 flex items-center justify-between px-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                    Félicitations ! Ordre 100% Conforme aux Règles GRD (Synergrid)
                  </div>
                  <p className="text-xs text-emerald-100">
                    Vous avez parfaitement ordonné les 12 étapes en {formatTime(seconds)} ({moveCount} actions).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRestart}
                className="px-3 py-1 bg-white text-emerald-900 rounded-lg text-xs font-black hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Recommencer le défi
              </button>
            </motion.div>
          )}

          {/* LISTE DES CARTES DU JEU */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar bg-slate-100/70">
            <div className="text-[11px] text-slate-500 font-medium mb-1 px-1 flex items-center justify-between">
              <span>
                Faites glisser les cartes ou utilisez les boutons flèches <span className="font-bold">↑</span> / <span className="font-bold">↓</span> pour réorganiser de l'étape 0 à 11 :
              </span>
              <span className="font-mono text-[10px] text-slate-400">Total : 12 cartes</span>
            </div>

            {/* REMARQUE IMPORTANTE - CHAMP TOURNANT EN SORTIE & ARRIVÉE DIFFÉRENTIEL */}
            <div className="p-3 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 rounded-2xl border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-2xs">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-800 border border-amber-400/40 shrink-0 mt-0.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                    Remarque Importante
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                    Sortie Compteur &amp; Arrivée Différentiel (Étapes 6 &amp; 9)
                  </span>
                </div>
                <p className="text-[11.5px] text-amber-950 font-semibold leading-relaxed">
                  Le champ tournant en sortie doit impérativement être conservé à l’identique. Les câbles de sortie en tête de compteur doivent rester dans le même ordre que celui existant. Toute modification de cet ordre risque de modifier le champ tournant à l’arrivée du différentiel.
                </p>
                <p className="text-[10.5px] text-amber-900 font-mono leading-relaxed bg-amber-200/50 p-1.5 rounded-lg border border-amber-300/60">
                  ⚡ <strong>Règle cyclique :</strong> Si l’ordre des fils de sortie doit être modifié, celui-ci doit <strong>obligatoirement</strong> être changé selon un <strong>ordre cyclique</strong>, afin de conserver le même sens du champ tournant à l’arrivée du différentiel.
                </p>
              </div>
            </div>

            {userSteps.map((step, index) => {
              const isCorrectPosition = step.id === index;
              const isDragged = draggedIndex === index;

              return (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  className={`group relative rounded-2xl border p-3 transition-all duration-200 select-none ${
                    isDragged
                      ? 'opacity-40 border-dashed border-teal-500 bg-teal-50'
                      : hasChecked
                      ? isCorrectPosition
                        ? 'bg-white border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white/95 border-rose-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    {/* POIGNÉE DE GLISSEMENT + NUMÉRO DE POSITION ACTUELLE */}
                    <div className="flex flex-col items-center justify-center shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setPickerTargetIndex(index)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-mono text-xs sm:text-sm font-black flex items-center justify-center border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs ${
                          hasChecked
                            ? isCorrectPosition
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-slate-900 text-white border-slate-900 hover:bg-teal-700 hover:border-teal-700'
                        }`}
                        title={`Position #${index} : Cliquer pour choisir dans toute la liste`}
                      >
                        {index}
                      </button>

                      <div className="mt-1.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>

                    {/* CONTENU TEXTE DE L'ÉTAPE */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {step.categoryLabel}
                          </span>

                          {hasChecked && (
                            <span
                              className={`text-[9.5px] font-black flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                isCorrectPosition
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isCorrectPosition ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Position Exacte (#{index})
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 text-rose-600" />
                                  Mal placée (Étape #{step.id})
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Indication d'aide si vérifié et erroné */}
                        {hasChecked && !isCorrectPosition && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            {step.id < index ? '↑ Doit être plus haut' : '↓ Doit être plus bas'}
                          </span>
                        )}
                      </div>

                      {/* Texte officiel de l'étape */}
                      <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium">
                        {step.title}
                      </p>

                      {/* INDICES & CONSIGNES CRITIQUES DE SÉCURITÉ */}
                      {(showHints || showSolution) && step.criticalSafety && (
                        <div className="mt-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[10px] text-amber-950 flex items-start gap-1.5 leading-snug">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-amber-900">Règle de Sécurité : </strong>
                            <span>{step.criticalSafety}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACTIONS SUR LA LIGNE : BOUTON FLÈCHE DÉROULANTE (TOUTE LA LISTE) + FLÈCHES NUDGE */}
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <button
                        type="button"
                        onClick={() => setPickerTargetIndex(index)}
                        className="h-8 px-2.5 sm:px-3 rounded-xl bg-teal-50 hover:bg-teal-100 active:scale-95 text-teal-800 border border-teal-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
                        title="Cliquer sur la flèche pour ouvrir toute la liste des 12 étapes et choisir"
                      >
                        <span className="text-[11px] font-bold">Choisir</span>
                        <ChevronDown className="w-4 h-4 text-teal-600 group-hover:translate-y-0.5 transition-transform shrink-0" />
                      </button>

                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, -1)}
                          className={`w-6 h-3.5 rounded border flex items-center justify-center transition-all ${
                            index === 0
                              ? 'opacity-20 cursor-not-allowed bg-slate-50 text-slate-300 border-slate-200'
                              : 'bg-white hover:bg-slate-100 active:scale-90 text-slate-700 border-slate-200 cursor-pointer shadow-2xs'
                          }`}
                          title="Monter d'un cran"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === userSteps.length - 1}
                          onClick={() => handleMove(index, 1)}
                          className={`w-6 h-3.5 rounded border flex items-center justify-center transition-all ${
                            index === userSteps.length - 1
                              ? 'opacity-20 cursor-not-allowed bg-slate-50 text-slate-300 border-slate-200'
                              : 'bg-white hover:bg-slate-100 active:scale-90 text-slate-700 border-slate-200 cursor-pointer shadow-2xs'
                          }`}
                          title="Descendre d'un cran"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER DU MODAL */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-500 font-medium">
              💡 Astuce : Placez les étapes amont (sectionneur, disjoncteur) avant les mesures et le raccordement client.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => setHasChecked(true)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Vérifier mon Classement
              </button>
            </div>
          </div>

          {/* SÉLECTEUR AU CLIC SUR LA FLÈCHE : TOUTE LA LISTE S'AFFICHE POUR CHOISIR */}
          {pickerTargetIndex !== null && (
            <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
                {/* Header du sélecteur */}
                <div className="p-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-b border-white/10 shrink-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-mono font-black text-sm shadow-inner shrink-0">
                      #{pickerTargetIndex}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                        <span>Position #{pickerTargetIndex} : Choisir dans toute la liste</span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        Cliquez sur l'étape de votre choix ci-dessous pour la placer à la position #{pickerTargetIndex}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pickerTargetIndex === 0}
                      onClick={() =>
                        setPickerTargetIndex((idx) => (idx !== null && idx > 0 ? idx - 1 : idx))
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all text-white flex items-center gap-1 cursor-pointer"
                      title="Position précédente"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Préc.</span>
                    </button>
                    <button
                      type="button"
                      disabled={pickerTargetIndex === 11}
                      onClick={() =>
                        setPickerTargetIndex((idx) => (idx !== null && idx < 11 ? idx + 1 : idx))
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all text-white flex items-center gap-1 cursor-pointer"
                      title="Position suivante"
                    >
                      <span className="hidden sm:inline">Suiv.</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTargetIndex(null)}
                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
                      title="Fermer la liste"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sélecteur de position rapide */}
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                    Ligne :
                  </span>
                  {Array.from({ length: 12 }).map((_, pIdx) => {
                    const isCurrent = pIdx === pickerTargetIndex;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setPickerTargetIndex(pIdx)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-teal-700 text-white shadow-xs scale-105 ring-2 ring-teal-500/30'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        #{pIdx}
                      </button>
                    );
                  })}
                </div>

                {/* Toute la liste des 12 étapes au choix */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar bg-slate-100/60">
                  {OFFICIAL_CONNECTION_STEPS.map((step) => {
                    const currentSlot = userSteps.findIndex((s) => s.id === step.id);
                    const isAssignedHere = currentSlot === pickerTargetIndex;

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => handleSelectStepForPosition(pickerTargetIndex, step.id)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3 select-none ${
                          isAssignedHere
                            ? 'bg-teal-50 border-teal-500 shadow-xs ring-2 ring-teal-500/20'
                            : 'bg-white border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 hover:shadow-xs'
                        }`}
                      >
                        {/* Numéro actuel du slot */}
                        <div className="shrink-0 pt-0.5">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center border transition-colors ${
                              isAssignedHere
                                ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                : 'bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600'
                            }`}
                          >
                            {isAssignedHere ? <Check className="w-4 h-4" /> : `#${currentSlot}`}
                          </div>
                        </div>

                        {/* Contenu de l'étape */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {step.categoryLabel}
                            </span>

                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                                isAssignedHere
                                  ? 'bg-teal-200/80 text-teal-900'
                                  : 'bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-800'
                              }`}
                            >
                              {isAssignedHere
                                ? '✓ Actuellement sélectionnée pour cette ligne'
                                : `Actuellement sur la ligne #${currentSlot}`}
                            </span>
                          </div>

                          <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium group-hover:text-slate-950">
                            {step.title}
                          </p>

                          {(showHints || showSolution) && step.criticalSafety && (
                            <div className="mt-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{step.criticalSafety}</span>
                            </div>
                          )}
                        </div>

                        {/* Bouton d'action au survol */}
                        <div className="shrink-0 self-center hidden sm:block">
                          <div
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                              isAssignedHere
                                ? 'bg-teal-700 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-teal-600 group-hover:text-white'
                            }`}
                          >
                            {isAssignedHere ? 'Sélectionné' : 'Placer ici'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer du sélecteur */}
                <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[11px] text-slate-500">
                    💡 Cliquez sur une étape pour l'assigner à la position #{pickerTargetIndex} (échange automatique avec sa place actuelle).
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerTargetIndex(null)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
