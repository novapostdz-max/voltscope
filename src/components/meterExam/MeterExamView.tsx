import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  Clock, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Award, 
  Flag, 
  Image as ImageIcon,
  BookOpen,
  Sparkles,
  Layers,
  Check,
  X,
  Maximize2,
  ArrowRight
} from 'lucide-react';
import { 
  EXAM_QUESTIONS, 
  EXAM_TITLE, 
  EXAM_DESCRIPTION, 
  TOTAL_EXAM_POINTS, 
  ExamQuestion 
} from '../../data/meterExamQuestions';

type ExamMode = 'training' | 'exam' | 'solutions';

interface UserAnswers {
  [questionId: string]: number[]; // indices of selected choices
}

export const MeterExamView: React.FC = () => {
  // State
  const [mode, setMode] = useState<ExamMode>('training');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyWithImages, setOnlyWithImages] = useState<boolean>(false);
  const [showGridNav, setShowGridNav] = useState<boolean>(false);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [jumpInput, setJumpInput] = useState<string>('');

  // Timer for exam mode
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (mode === 'exam' && !examSubmitted && isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, examSubmitted, isTimerRunning]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    EXAM_QUESTIONS.forEach((q) => set.add(q.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return EXAM_QUESTIONS.filter((q) => {
      if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
      if (onlyWithImages && !q.imageUrl) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(query);
        const inChoices = q.choices.some((c) => c.text.toLowerCase().includes(query));
        const inNum = String(q.number).includes(query);
        if (!inTitle && !inChoices && !inNum) return false;
      }
      return true;
    });
  }, [selectedCategory, onlyWithImages, searchQuery]);

  // Ensure currentIdx is within filtered range
  useEffect(() => {
    if (currentIdx >= filteredQuestions.length && filteredQuestions.length > 0) {
      setCurrentIdx(0);
    }
  }, [filteredQuestions.length, currentIdx]);

  const currentQ: ExamQuestion | undefined = filteredQuestions[currentIdx];

  // Toggle selection
  const handleSelectChoice = (questionId: string, choiceIdx: number, isMultiple: boolean) => {
    if (mode === 'solutions' || (mode === 'exam' && examSubmitted)) return;

    setUserAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        if (current.includes(choiceIdx)) {
          return { ...prev, [questionId]: current.filter((i) => i !== choiceIdx) };
        } else {
          return { ...prev, [questionId]: [...current, choiceIdx] };
        }
      } else {
        return { ...prev, [questionId]: [choiceIdx] };
      }
    });
  };

  // Toggle flag
  const toggleFlag = (id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset exam
  const handleReset = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser toutes vos réponses et recommencer ?')) {
      setUserAnswers({});
      setFlaggedIds(new Set());
      setExamSubmitted(false);
      setElapsedSeconds(0);
      setCurrentIdx(0);
    }
  };

  // Jump to specific question number (e.g. question 72)
  const handleJumpToQuestion = (targetNum?: number) => {
    const num = targetNum !== undefined ? targetNum : parseInt(jumpInput.trim(), 10);
    if (isNaN(num) || num < 1 || num > EXAM_QUESTIONS.length) {
      alert(`Veuillez entrer un numéro de question valide entre 1 et ${EXAM_QUESTIONS.length}.`);
      return;
    }

    // If current filter excludes this question, reset filter to 'all' so the question is directly visible and user can continue seamlessly
    const targetQ = EXAM_QUESTIONS.find((q) => q.number === num);
    if (targetQ) {
      let activeList = filteredQuestions;
      if (selectedCategory !== 'all' && targetQ.category !== selectedCategory) {
        setSelectedCategory('all');
        activeList = EXAM_QUESTIONS;
      }
      if (searchQuery.trim()) {
        setSearchQuery('');
        activeList = EXAM_QUESTIONS;
      }
      if (onlyWithImages && !targetQ.imageUrl) {
        setOnlyWithImages(false);
        activeList = EXAM_QUESTIONS;
      }

      const foundIdx = activeList.findIndex((q) => q.number === num);
      if (foundIdx !== -1) {
        setCurrentIdx(foundIdx);
      } else {
        // Fallback in full list
        const fallbackIdx = EXAM_QUESTIONS.findIndex((q) => q.number === num);
        if (fallbackIdx !== -1) setCurrentIdx(fallbackIdx);
      }
      setJumpInput('');
    }
  };

  // Calculate score
  const scoreStats = useMemo(() => {
    let earnedPoints = 0;
    let correctCount = 0;
    let answeredCount = 0;

    EXAM_QUESTIONS.forEach((q) => {
      const answers = userAnswers[q.id];
      if (answers && answers.length > 0) {
        answeredCount++;
        const correctIndices = q.choices
          .map((c, i) => (c.isCorrect ? i : -1))
          .filter((i) => i !== -1);

        const isFullyCorrect =
          answers.length === correctIndices.length &&
          answers.every((i) => correctIndices.includes(i));

        if (isFullyCorrect) {
          earnedPoints += q.points;
          correctCount++;
        }
      }
    });

    const percent = Math.round((earnedPoints / TOTAL_EXAM_POINTS) * 100);
    return { earnedPoints, correctCount, answeredCount, percent };
  }, [userAnswers]);

  // Format time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col gap-4 text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                ORES • Compteurs Communicants
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90">
                123 Questions • {TOTAL_EXAM_POINTS} Points
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                NewModupad
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Question Compteur Examen
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/80 max-w-2xl">
              Entraînement officiel pour la pose des compteurs communicants et intervention sur comptage existant avec corrigé complet et explications.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                setMode('training');
                setExamSubmitted(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'training'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Entraînement</span>
            </button>

            <button
              onClick={() => setMode('exam')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'exam'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Examen Réel</span>
            </button>

            <button
              onClick={() => {
                setMode('solutions');
                setExamSubmitted(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'solutions'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Toutes les Réponses (Corrigé)</span>
            </button>
          </div>
        </div>

        {/* Live Score & Timer Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-200">Score en direct :</span>
              <span className="font-black text-white text-sm bg-white/10 px-2 py-0.5 rounded-md">
                {scoreStats.earnedPoints} / {TOTAL_EXAM_POINTS} pts
              </span>
              <span className="text-emerald-300 font-bold">({scoreStats.percent}%)</span>
            </div>

            <div className="text-slate-300">
              Répondues : <span className="text-white font-bold">{scoreStats.answeredCount}</span> / 123
            </div>

            {flaggedIds.size > 0 && (
              <div className="flex items-center gap-1 text-amber-300">
                <Flag className="w-3.5 h-3.5 fill-amber-300" />
                <span>{flaggedIds.size} à revoir</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === 'exam' && (
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg text-emerald-200 font-mono text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-xs transition-colors cursor-pointer"
              title="Réinitialiser l'examen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recommencer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {categories.map((cat) => {
            const isSel = selectedCategory === cat;
            const count = cat === 'all' 
              ? EXAM_QUESTIONS.length 
              : EXAM_QUESTIONS.filter((q) => q.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentIdx(0);
                }}
                className={`px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Toutes les questions' : cat}
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher (ex: RTCC, 25S60, OBIS)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIdx(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => setOnlyWithImages((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
              onlyWithImages
                ? 'bg-teal-50 border-teal-300 text-teal-700 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Afficher uniquement les questions avec photos ou schémas"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Avec Schémas ({EXAM_QUESTIONS.filter((q) => q.imageUrl).length})</span>
          </button>

          <button
            onClick={() => setShowGridNav((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
              showGridNav
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grille (1-123)</span>
          </button>

          {/* Option: Commencer à partir de la question : */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJumpToQuestion();
            }}
            className="flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-300/80 rounded-xl px-2.5 py-1 text-xs text-emerald-950 shadow-2xs"
          >
            <label htmlFor="jump-question-input" className="font-bold text-[11px] text-emerald-900 whitespace-nowrap">
              Commencer à partir de la question :
            </label>
            <input
              id="jump-question-input"
              type="number"
              min={1}
              max={EXAM_QUESTIONS.length}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder="ex: 72"
              className="w-16 px-2 py-0.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-center text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-2.5 py-0.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Aller directement à cette question"
            >
              <span>Aller</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Quick Grid Navigator (Modal or Dropdown) */}
      <AnimatePresence>
        {showGridNav && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700">
                Navigation rapide parmi les {filteredQuestions.length} questions :
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Correcte
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Incorrecte
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Non répondue
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> À revoir 🚩
                </span>
              </div>
            </div>

            <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1.5 max-h-56 overflow-y-auto p-1">
              {filteredQuestions.map((q, idx) => {
                const ans = userAnswers[q.id];
                const isAnswered = ans && ans.length > 0;
                const isFlagged = flaggedIds.has(q.id);
                const isCurrent = idx === currentIdx;

                let statusColor = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (mode === 'solutions' || (mode === 'training' && isAnswered) || examSubmitted) {
                  const correctIndices = q.choices
                    .map((c, i) => (c.isCorrect ? i : -1))
                    .filter((i) => i !== -1);
                  const isCorrect =
                    isAnswered &&
                    ans.length === correctIndices.length &&
                    ans.every((i) => correctIndices.includes(i));

                  if (isCorrect) statusColor = 'bg-emerald-500 text-white border-emerald-600';
                  else if (isAnswered) statusColor = 'bg-rose-500 text-white border-rose-600';
                } else if (isAnswered) {
                  statusColor = 'bg-blue-600 text-white border-blue-700';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowGridNav(false);
                    }}
                    className={`relative h-7 text-[11px] font-bold rounded-lg border flex items-center justify-center transition-all cursor-pointer ${statusColor} ${
                      isCurrent ? 'ring-2 ring-slate-900 ring-offset-1 font-black scale-105' : ''
                    }`}
                  >
                    {q.number}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Question Display Card */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
          <HelpCircle className="w-12 h-12 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-700">Aucune question trouvée</h3>
          <p className="text-xs">Essayez de réinitialiser vos filtres ou votre recherche.</p>
        </div>
      ) : currentQ ? (
        <div className="bg-white rounded-3xl p-5 md:p-8 border border-slate-200 shadow-md space-y-6">
          {/* Question Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-black">
                Question {currentQ.number} / {EXAM_QUESTIONS.length}
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                {currentQ.category}
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">
                {currentQ.points} points
              </span>
              {currentQ.isMultiple && (
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                  Plusieurs réponses possibles
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  flaggedIds.has(currentQ.id)
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
                title="Marquer cette question pour y revenir plus tard"
              >
                <Flag className={`w-3.5 h-3.5 ${flaggedIds.has(currentQ.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{flaggedIds.has(currentQ.id) ? 'À revoir' : 'Marquer'}</span>
              </button>
            </div>
          </div>

          {/* Question Title & Subtitle */}
          <div className="space-y-2">
            <h2 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.title}
            </h2>
            {currentQ.subtitle && (
              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {currentQ.subtitle}
              </p>
            )}
          </div>

          {/* Question Illustration / Image if available */}
          {currentQ.imageUrl && (
            <div className="space-y-1.5">
              <div className="relative group inline-block max-w-full">
                <img
                  src={currentQ.imageUrl}
                  alt={`Illustration Question ${currentQ.number}`}
                  referrerPolicy="no-referrer"
                  className="rounded-2xl border border-slate-200 max-h-72 md:max-h-80 w-auto object-contain bg-slate-50 shadow-sm cursor-pointer group-hover:brightness-95 transition-all"
                  onClick={() => setZoomedImage(currentQ.imageUrl)}
                />
                <button
                  onClick={() => setZoomedImage(currentQ.imageUrl)}
                  className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 backdrop-blur-xs cursor-pointer shadow-xs"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Agrandir</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Cliquez sur l’image pour la voir en plein écran
              </p>
            </div>
          )}

          {/* Choices Options List */}
          <div className="space-y-2.5 pt-2">
            {currentQ.choices.map((choice, cIdx) => {
              const selectedChoices = userAnswers[currentQ.id] || [];
              const isSelected = selectedChoices.includes(cIdx);
              const isSolutionMode = mode === 'solutions' || (mode === 'training' && selectedChoices.length > 0) || examSubmitted;

              let choiceStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';
              let badgeColor = 'bg-slate-200 text-slate-700';

              if (isSolutionMode) {
                if (choice.isCorrect) {
                  choiceStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400/50';
                  badgeColor = 'bg-emerald-600 text-white';
                } else if (isSelected && !choice.isCorrect) {
                  choiceStyle = 'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-300';
                  badgeColor = 'bg-rose-600 text-white';
                }
              } else if (isSelected) {
                choiceStyle = 'bg-blue-50 border-blue-500 text-blue-950 font-semibold ring-2 ring-blue-500/20';
                badgeColor = 'bg-blue-600 text-white';
              }

              return (
                <button
                  key={cIdx}
                  onClick={() => handleSelectChoice(currentQ.id, cIdx, currentQ.isMultiple)}
                  disabled={mode === 'solutions' || (mode === 'exam' && examSubmitted)}
                  className={`w-full text-left p-3.5 md:p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${choiceStyle}`}
                >
                  {/* Choice Letter / Indicator */}
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${badgeColor}`}>
                    {isSolutionMode && choice.isCorrect ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isSolutionMode && isSelected && !choice.isCorrect ? (
                      <X className="w-4 h-4 stroke-[3]" />
                    ) : (
                      String.fromCharCode(65 + cIdx)
                    )}
                  </span>

                  {/* Choice Text */}
                  <div className="flex-1 text-xs md:text-sm pt-0.5 leading-relaxed">
                    {choice.text}
                  </div>

                  {/* Correct / Incorrect Badges */}
                  {isSolutionMode && choice.isCorrect && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shrink-0 self-center">
                      Bonne Réponse
                    </span>
                  )}
                  {isSolutionMode && isSelected && !choice.isCorrect && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shrink-0 self-center">
                      Erreur
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback Explanation in Training / Solution Mode */}
          {(mode === 'solutions' || (mode === 'training' && (userAnswers[currentQ.id] || []).length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs md:text-sm space-y-1"
            >
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Validation officielle ORES / NewModupad :</span>
              </div>
              <p className="text-emerald-900/90 text-xs">
                {currentQ.choices.filter((c) => c.isCorrect).length > 1
                  ? `Les bonnes réponses sont : ${currentQ.choices
                      .map((c, i) => (c.isCorrect ? `${String.fromCharCode(65 + i)}` : ''))
                      .filter(Boolean)
                      .join(' et ')}.`
                  : `La bonne réponse exacte est la lettre ${String.fromCharCode(
                      65 + currentQ.choices.findIndex((c) => c.isCorrect)
                    )}.`}
              </p>
            </motion.div>
          )}

          {/* Navigation Buttons (Prev / Next) */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Précédente</span>
            </button>

            <span className="text-xs text-slate-500 font-medium">
              {currentIdx + 1} sur {filteredQuestions.length}
            </span>

            {/* Quick jump input in bottom bar */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-600 font-medium">Commencer à partir de la question :</span>
              <input
                type="number"
                min={1}
                max={EXAM_QUESTIONS.length}
                placeholder="ex: 72"
                className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-bold text-center text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value, 10);
                    if (!isNaN(val)) handleJumpToQuestion(val);
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              {currentIdx < filteredQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => Math.min(filteredQuestions.length - 1, i + 1))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span>Suivante</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : mode === 'exam' && !examSubmitted ? (
                <button
                  onClick={() => {
                    if (window.confirm('Voulez-vous soumettre l’examen et découvrir votre note finale ?')) {
                      setExamSubmitted(true);
                      setIsTimerRunning(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all cursor-pointer shadow-md"
                >
                  <Award className="w-4 h-4" />
                  <span>Terminer et Corriger l'Examen</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(0)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Retour à la 1ère question</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 5. Exam Results Summary (Shown when exam is submitted) */}
      {examSubmitted && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Résultat Final de l'Examen
              </span>
              <h3 className="text-2xl font-black">
                {scoreStats.percent >= 70 ? '🎉 Félicitations, Examen Réussi !' : '⚠️ Entraînement recommandé'}
              </h3>
              <p className="text-xs text-slate-300">
                Seuil de réussite standard ORES / GRD : 70% (344 / 492 points).
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl md:text-4xl font-black text-emerald-400">
                {scoreStats.earnedPoints} <span className="text-lg text-slate-400">/ {TOTAL_EXAM_POINTS}</span>
              </div>
              <div className="text-xs font-bold text-slate-300">
                Taux de réussite : {scoreStats.percent}% • Temps : {formatTime(elapsedSeconds)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-slate-400">Questions Répondues</div>
              <div className="text-lg font-black text-white">{scoreStats.answeredCount} / 123</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-slate-400">Bonnes Réponses</div>
              <div className="text-lg font-black text-emerald-400">{scoreStats.correctCount}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-slate-400">Erreurs</div>
              <div className="text-lg font-black text-rose-400">
                {scoreStats.answeredCount - scoreStats.correctCount}
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-slate-400">Questions Non Répondues</div>
              <div className="text-lg font-black text-amber-400">{123 - scoreStats.answeredCount}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setMode('solutions');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
            >
              Consulter le corrigé détaillé question par question
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Recommencer l'examen
            </button>
          </div>
        </div>
      )}

      {/* 6. Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={zoomedImage}
                alt="Image agrandie"
                referrerPolicy="no-referrer"
                className="rounded-2xl max-h-[80vh] w-auto object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
