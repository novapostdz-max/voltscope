/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WIRE_A_TO_Z_COLORS, WireColorDef } from './constants/wireColors';
import { PdfPlanBackground, DrawnWire, Point, WireStyle } from './types/plan';
import { loadPdfPages, loadImageAsBlueprint, generateSamplePositionBlueprint } from './utils/pdfImporter';
import {
  ObstaclePoint,
  calculateObstacleFreeCurve,
  findMagneticSnap,
  generateWirePath,
  pointsToSmoothSvgPath,
  computeOptimalShortestPath,
  findShortestDaisyChainOrder,
  findShortestDaisyChainFromOrigin,
  DETECTION_RADIUS_1CM,
  DETECTION_DIAMETER_1CM,
} from './utils/wireRouter';
import {
  Upload,
  FileText,
  Workflow,
  Zap,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Hand,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Magnet,
  Crosshair,
  ArrowRight,
  Spline,
  Minus,
  CornerDownRight,
  RefreshCw,
  Pencil,
  Target,
  ListOrdered,
  Navigation,
  ArrowLeft,
  MoveHorizontal,
  Eye,
  X,
  MapPin,
  Search,
  Server,
} from 'lucide-react';

export interface SequenceGuideState {
  active: boolean;
  prefix: string; // e.g. "E", "A", "B"
  currentNum: number;
  nextNum: number;
  currentCode: string;
  nextCode: string;
  lastConnectedCode?: string;
}

export function parseAlphaNumericCode(labelOrId?: string): { prefix: string; num: number; fullCode: string } | null {
  if (!labelOrId) return null;
  const m = labelOrId.match(/\b([A-Za-z]{1,2})[-_\s]*(\d{1,2})\b/i);
  if (m) {
    const prefix = m[1].toUpperCase();
    const num = parseInt(m[2], 10);
    return { prefix, num, fullCode: `${prefix}${num}` };
  }
  return null;
}

const SAMPLE_SYMBOLS: ObstaclePoint[] = [
  // Lignes & Éclairages Circuit L (L1 à L5 - Rayon calibré 19px / Diamètre 1 cm)
  { id: 'L1', x: 380, y: 380, radius: DETECTION_RADIUS_1CM, label: 'Point L1 (Entrée)', type: 'light' },
  { id: 'L2', x: 620, y: 380, radius: DETECTION_RADIUS_1CM, label: 'Point L2 (Couloir)', type: 'light' },
  { id: 'L3', x: 920, y: 380, radius: DETECTION_RADIUS_1CM, label: 'Point L3 (Dégagement)', type: 'light' },
  { id: 'L4', x: 1180, y: 460, radius: DETECTION_RADIUS_1CM, label: 'Point L4 (Terrasse)', type: 'light' },
  { id: 'L5', x: 1360, y: 380, radius: DETECTION_RADIUS_1CM, label: 'Point L5 (Jardin)', type: 'light' },

  // Lignes Circuit K (K1 à K4 - Circuit Cuisine / Sèche-Linge)
  { id: 'K1', x: 260, y: 700, radius: DETECTION_RADIUS_1CM, label: 'Point K1 (Cuisine)', type: 'light' },
  { id: 'K2', x: 480, y: 700, radius: DETECTION_RADIUS_1CM, label: 'Point K2 (Plan de travail)', type: 'light' },
  { id: 'K3', x: 700, y: 700, radius: DETECTION_RADIUS_1CM, label: 'Point K3 (Four)', type: 'light' },
  { id: 'K4', x: 920, y: 700, radius: DETECTION_RADIUS_1CM, label: 'Point K4 (Buanderie)', type: 'light' },

  // Lights (Lampes Circuit A: A1 à A5)
  { id: 'A1', x: 440, y: 280, radius: DETECTION_RADIUS_1CM, label: 'Lampe A1 (Salon)', type: 'light' },
  { id: 'A2', x: 300, y: 660, radius: DETECTION_RADIUS_1CM, label: 'Lampe A2 (Cuisine)', type: 'light' },
  { id: 'A3', x: 1100, y: 300, radius: DETECTION_RADIUS_1CM, label: 'Lampe A3 (Chambre 1)', type: 'light' },
  { id: 'A4', x: 940, y: 660, radius: DETECTION_RADIUS_1CM, label: 'Lampe A4 (Bureau)', type: 'light' },
  { id: 'A5', x: 1300, y: 660, radius: DETECTION_RADIUS_1CM, label: 'Lampe A5 (Salle d’eau)', type: 'light' },
  // Switches (Interrupteurs commande Circuit A)
  { id: 'S1', x: 730, y: 260, radius: DETECTION_RADIUS_1CM, label: 'Interrupteur S1 / A1', type: 'switch' },
  { id: 'S2', x: 420, y: 520, radius: DETECTION_RADIUS_1CM, label: 'Interrupteur S2 / A2', type: 'switch' },
  { id: 'S3', x: 790, y: 260, radius: DETECTION_RADIUS_1CM, label: 'Interrupteur S3 / A3', type: 'switch' },
  { id: 'S4', x: 790, y: 540, radius: DETECTION_RADIUS_1CM, label: 'Interrupteur S4 / A4', type: 'switch' },
  { id: 'S5', x: 1140, y: 540, radius: DETECTION_RADIUS_1CM, label: 'Interrupteur S5 / A5', type: 'switch' },
  // Sockets (Prises Circuit E: E1 à E8 - Max 8 prises selon NF C 15-100 / RGIE)
  { id: 'E1', x: 180, y: 420, radius: DETECTION_RADIUS_1CM, label: 'Prise E1 (Séjour)', type: 'socket' },
  { id: 'E2', x: 680, y: 420, radius: DETECTION_RADIUS_1CM, label: 'Prise E2 (Séjour)', type: 'socket' },
  { id: 'E3', x: 180, y: 780, radius: DETECTION_RADIUS_1CM, label: 'Prise E3 (Cuisine)', type: 'socket' },
  { id: 'E4', x: 520, y: 780, radius: DETECTION_RADIUS_1CM, label: 'Prise E4 (Cuisine)', type: 'socket' },
  { id: 'E5', x: 840, y: 420, radius: DETECTION_RADIUS_1CM, label: 'Prise E5 (Chambre)', type: 'socket' },
  { id: 'E6', x: 1400, y: 420, radius: DETECTION_RADIUS_1CM, label: 'Prise E6 (Chambre)', type: 'socket' },
  { id: 'E7', x: 840, y: 800, radius: DETECTION_RADIUS_1CM, label: 'Prise E7 (Bureau)', type: 'socket' },
  { id: 'E8', x: 1400, y: 800, radius: DETECTION_RADIUS_1CM, label: 'Prise E8 (Salle d’eau)', type: 'socket' },
  // TGBT Main Panel
  { id: 'TGBT', x: 170, y: 190, radius: 28, label: 'Tableau TGBT', type: 'panel' },
];

export interface CircuitPointsDetail {
  code: string;
  total: number;
  sockets: number;
  switches: number;
  lights: number;
  customPoints: number;
  breakdownText: string;
  isMixed: boolean;
}

interface ElecPlanAppProps {
  onBackToVoltScope?: () => void;
}

export const ElecPlanApp: React.FC<ElecPlanAppProps> = ({ onBackToVoltScope }) => {
  // 1. PDF Blueprint State
  const [pdfBackground, setPdfBackground] = useState<PdfPlanBackground | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Active Tool & Wire Circuit State (A to Z)
  const [activeTool, setActiveTool] = useState<'wire' | 'eraser' | 'pan' | 'place_tgbt'>('wire');
  const [selectedWireColor, setSelectedWireColor] = useState<string>(WIRE_A_TO_Z_COLORS[0].hex);

  // Wire drawing style: 'auto', 'curve', 'straight', 'orthogonal', 'freehand'
  const [wireStyle, setWireStyle] = useState<WireStyle>('auto');
  const [invertCurve, setInvertCurve] = useState<boolean>(false);
  const [magneticSnapEnabled, setMagneticSnapEnabled] = useState(true);

  // 3. Custom Symbols per page
  const [symbolsByPage, setSymbolsByPage] = useState<Record<number, ObstaclePoint[]>>({});

  // 4. Drawn Wires & History per page (Multi-step Undo/Redo)
  const [wiresByPage, setWiresByPage] = useState<Record<number, DrawnWire[]>>({});
  const [historyByPage, setHistoryByPage] = useState<Record<number, DrawnWire[][]>>({});
  const [historyIndexByPage, setHistoryIndexByPage] = useState<Record<number, number>>({});

  // 5. Viewport & Pan/Zoom
  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<Point>({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // 6. In-Progress Wire Drawing Anchor
  const [wireStartPoint, setWireStartPoint] = useState<Point | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<Point[]>([]);
  const [rawCursorPos, setRawCursorPos] = useState<Point>({ x: 0, y: 0 });
  const [draggedCurveWireId, setDraggedCurveWireId] = useState<string | null>(null);

  // 6b. Intelligent Sequence Guide (inactif par défaut, aucun circuit E imposé)
  const [sequenceGuide, setSequenceGuide] = useState<SequenceGuideState>({
    active: false,
    prefix: 'A',
    currentNum: 1,
    nextNum: 2,
    currentCode: 'A1',
    nextCode: 'A2',
  });
  const [showSequenceSelector, setShowSequenceSelector] = useState(false);

  // 6c. TGBT (Tableau Général) Placement & Auto-Wire States
  const [showTgbtPlacementModal, setShowTgbtPlacementModal] = useState(false);
  const [alwaysUseCurrentTgbt, setAlwaysUseCurrentTgbt] = useState(false);
  const [pendingAutoWire, setPendingAutoWire] = useState<{
    filterPrefix?: string;
    mode: 'ordered' | 'shortest';
  } | null>(null);

  // Localiser circuit (Signaler tous les points ex: K1, K2... K8 en même temps)
  const [locateCircuitLetter, setLocateCircuitLetter] = useState<string | null>(null);
  const [showLocateCircuitModal, setShowLocateCircuitModal] = useState<boolean>(false);

  // Fullscreen Mode State & References
  const appRootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !isFullscreen) {
        if (appRootRef.current && appRootRef.current.requestFullscreen) {
          await appRootRef.current.requestFullscreen().catch(() => {});
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(prev => !prev);
    }
    setTimeout(() => {
      fitToScreen();
    }, 150);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNative = Boolean(document.fullscreenElement);
      setIsFullscreen(isNative);
      setTimeout(() => {
        fitToScreen();
      }, 150);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
        setTimeout(() => fitToScreen(), 150);
      }
      if ((e.key === 'f' || e.key === 'F') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // 7. Toast Feedback Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; isWarning?: boolean } | null>(null);
  const [showPageAlert, setShowPageAlert] = useState<boolean>(false);
  const pageAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPageSignal = () => {
    setShowPageAlert(true);
    if (pageAlertTimerRef.current) {
      clearTimeout(pageAlertTimerRef.current);
    }
    // Signal for exactly 5 seconds
    pageAlertTimerRef.current = setTimeout(() => {
      setShowPageAlert(false);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (pageAlertTimerRef.current) {
        clearTimeout(pageAlertTimerRef.current);
      }
    };
  }, []);

  const showToast = (text: string, isWarning = false) => {
    setToastMessage({ text, isWarning });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const colorScrollRef = useRef<HTMLDivElement>(null);

  // Current page number (1-indexed)
  const currentPage = pdfBackground?.currentPage || 1;
  const currentWires = wiresByPage[currentPage] || [];
  const currentHistory = historyByPage[currentPage] || [[]];
  const currentHistoryIndex = historyIndexByPage[currentPage] || 0;
  const currentSymbols = symbolsByPage[currentPage] || [];

  const activeColorDef = useMemo(() => {
    return WIRE_A_TO_Z_COLORS.find(c => c.hex === selectedWireColor) || WIRE_A_TO_Z_COLORS[0];
  }, [selectedWireColor]);

  // Count distinct points / terminals per circuit on the current page (Max 8 points per circuit)
  const circuitDetailsMap = useMemo<Record<string, CircuitPointsDetail>>(() => {
    const details: Record<string, CircuitPointsDetail> = {};

    WIRE_A_TO_Z_COLORS.forEach(c => {
      const circuitWires = currentWires.filter(w => w.circuitCode === c.code);
      if (circuitWires.length === 0) {
        details[c.code] = {
          code: c.code,
          total: 0,
          sockets: 0,
          switches: 0,
          lights: 0,
          customPoints: 0,
          breakdownText: '0 point',
          isMixed: false,
        };
        return;
      }

      const uniquePts: Point[] = [];
      circuitWires.forEach(w => {
        [w.p1, w.p2].forEach(p => {
          if (!uniquePts.some(u => Math.hypot(u.x - p.x, u.y - p.y) < 14)) {
            uniquePts.push(p);
          }
        });
      });

      let sockets = 0;
      let switches = 0;
      let lights = 0;
      let customPoints = 0;

      uniquePts.forEach(pt => {
        const matchedSym = currentSymbols.find(
          s => Math.hypot(s.x - pt.x, s.y - pt.y) < (s.radius + 12)
        );

        if (matchedSym) {
          if (matchedSym.type === 'panel') {
            return;
          } else if (matchedSym.type === 'socket') {
            sockets++;
          } else if (matchedSym.type === 'switch') {
            switches++;
          } else if (matchedSym.type === 'light') {
            lights++;
          } else {
            customPoints++;
          }
        } else {
          customPoints++;
        }
      });

      const total = sockets + switches + lights + customPoints;
      const categoriesCount =
        (sockets > 0 ? 1 : 0) +
        (switches > 0 ? 1 : 0) +
        (lights > 0 ? 1 : 0) +
        (customPoints > 0 ? 1 : 0);
      const isMixed = categoriesCount > 1;

      let breakdownText = '';
      if (total === 0) {
        breakdownText = '0 point';
      } else if (sockets === total) {
        breakdownText = `${sockets} prise${sockets > 1 ? 's' : ''}`;
      } else if (switches === total) {
        breakdownText = `${switches} interrupteur${switches > 1 ? 's' : ''}`;
      } else if (lights === total) {
        breakdownText = `${lights} lampe${lights > 1 ? 's' : ''}`;
      } else if (customPoints === total) {
        breakdownText = `${customPoints} point${customPoints > 1 ? 's' : ''}`;
      } else {
        const parts: string[] = [];
        if (sockets > 0) parts.push(`${sockets} prise${sockets > 1 ? 's' : ''}`);
        if (switches > 0) parts.push(`${switches} interrupteur${switches > 1 ? 's' : ''}`);
        if (lights > 0) parts.push(`${lights} lampe${lights > 1 ? 's' : ''}`);
        if (customPoints > 0) parts.push(`${customPoints} point${customPoints > 1 ? 's' : ''}`);
        breakdownText = `Mélange (${parts.join(', ')})`;
      }

      details[c.code] = {
        code: c.code,
        total,
        sockets,
        switches,
        lights,
        customPoints,
        breakdownText,
        isMixed,
      };
    });

    return details;
  }, [currentWires, currentSymbols]);

  const activeCircuitDetail = circuitDetailsMap[activeColorDef.code] || {
    code: activeColorDef.code,
    total: 0,
    sockets: 0,
    switches: 0,
    lights: 0,
    customPoints: 0,
    breakdownText: '0 point',
    isMixed: false,
  };
  const activeCircuitPoints = activeCircuitDetail.total;
  const isCircuitOverLimit = activeCircuitPoints >= 8;

  const nextAvailableCircuit = useMemo(() => {
    const activeIdx = WIRE_A_TO_Z_COLORS.findIndex(c => c.code === activeColorDef.code);
    for (let i = 1; i < WIRE_A_TO_Z_COLORS.length; i++) {
      const nextDef = WIRE_A_TO_Z_COLORS[(activeIdx + i) % WIRE_A_TO_Z_COLORS.length];
      if ((circuitDetailsMap[nextDef.code]?.total || 0) < 8) {
        return nextDef;
      }
    }
    return WIRE_A_TO_Z_COLORS[(activeIdx + 1) % WIRE_A_TO_Z_COLORS.length];
  }, [activeColorDef, circuitDetailsMap]);

  const currentTgbt = useMemo(() => {
    return (
      currentSymbols.find(
        s => s.type === 'panel' || s.id === 'TGBT' || (s.label && s.label.toUpperCase().includes('TGBT'))
      ) || null
    );
  }, [currentSymbols]);

  const allObstacles = useMemo<ObstaclePoint[]>(() => {
    const terminals: ObstaclePoint[] = [];
    currentWires.forEach(w => {
      terminals.push({
        id: `${w.id}_p1`,
        x: w.p1.x,
        y: w.p1.y,
        radius: 14,
        label: `Borne Circuit ${w.circuitCode}`,
        type: 'terminal',
      });
      terminals.push({
        id: `${w.id}_p2`,
        x: w.p2.x,
        y: w.p2.y,
        radius: 14,
        label: `Borne Circuit ${w.circuitCode}`,
        type: 'terminal',
      });
    });
    return [...currentSymbols, ...terminals];
  }, [currentSymbols, currentWires]);

  const nextTargetSymbol = useMemo(() => {
    if (!sequenceGuide.active || !sequenceGuide.nextCode) return null;
    const targetCode = sequenceGuide.nextCode.toUpperCase();
    return (
      currentSymbols.find(s => {
        const code = parseAlphaNumericCode(s.label || s.id);
        return code && code.prefix === sequenceGuide.prefix && code.num === sequenceGuide.nextNum;
      }) ||
      currentSymbols.find(s => {
        return (
          (s.id && s.id.toUpperCase() === targetCode) ||
          (s.label && s.label.toUpperCase().includes(targetCode))
        );
      }) ||
      null
    );
  }, [sequenceGuide, currentSymbols]);

  // Point de départ 1 (ex: A1, B1, L1...) pour toute lettre de l'alphabet avant de tracer
  const currentStartSymbol = useMemo(() => {
    if (!sequenceGuide.active || wireStartPoint) return null;
    const prefixWires = currentWires.filter(w => w.circuitCode === sequenceGuide.prefix);
    const startNum = prefixWires.length === 0 ? 1 : Math.min(8, prefixWires.length + 1);
    const targetCode = `${sequenceGuide.prefix}${startNum}`.toUpperCase();
    return (
      currentSymbols.find(s => {
        const code = parseAlphaNumericCode(s.label || s.id);
        return code && code.prefix === sequenceGuide.prefix && code.num === startNum;
      }) ||
      currentSymbols.find(s => {
        return (
          (s.id && s.id.toUpperCase() === targetCode) ||
          (s.label && s.label.toUpperCase().includes(targetCode))
        );
      }) ||
      null
    );
  }, [sequenceGuide, currentSymbols, wireStartPoint, currentWires]);

  // Tous les points d'un circuit localisé (ex: K1, K2, K3, K4... K8) pour les signaler en même temps
  const locatedCircuitPoints = useMemo(() => {
    if (!locateCircuitLetter) return [];
    const targetLetter = locateCircuitLetter.toUpperCase();

    const foundMap = new Map<string, { x: number; y: number; code: string; num: number }>();

    // 1. Depuis les symboles du schéma / texte extrait du PDF
    currentSymbols.forEach(s => {
      const parsed = parseAlphaNumericCode(s.label || s.id);
      if (parsed && parsed.prefix === targetLetter) {
        foundMap.set(parsed.fullCode, {
          x: s.x,
          y: s.y,
          code: parsed.fullCode,
          num: parsed.num,
        });
      }
    });

    // 2. Depuis les liaisons déjà tracées pour cette lettre
    currentWires.forEach((w, wIdx) => {
      if (w.circuitCode === targetLetter) {
        const c1 = `${targetLetter}${wIdx * 2 + 1}`;
        const c2 = `${targetLetter}${wIdx * 2 + 2}`;
        if (!foundMap.has(c1)) {
          foundMap.set(c1, { x: w.p1.x, y: w.p1.y, code: c1, num: wIdx * 2 + 1 });
        }
        if (!foundMap.has(c2)) {
          foundMap.set(c2, { x: w.p2.x, y: w.p2.y, code: c2, num: wIdx * 2 + 2 });
        }
      }
    });

    return Array.from(foundMap.values()).sort((a, b) => a.num - b.num);
  }, [locateCircuitLetter, currentSymbols, currentWires]);

  const centerOnCircuit = (letter: string) => {
    const targetLetter = letter.toUpperCase();
    const pts = currentSymbols
      .map(s => ({ s, p: parseAlphaNumericCode(s.label || s.id) }))
      .filter(item => item.p && item.p.prefix === targetLetter)
      .map(item => ({ x: item.s.x, y: item.s.y }));

    if (pts.length === 0 || !containerRef.current) return;
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scale = zoom / 100;
    setPan({
      x: Math.round(cw / 2 - midX * scale),
      y: Math.round(ch / 2 - midY * scale),
    });
  };

  // Current Page Aspect Ratio calculation & Position Plan Sheet boundaries
  const currentAspectRatio = useMemo(() => {
    if (!pdfBackground) return 1400 / 960;
    const pageAr = pdfBackground.pageAspectRatios?.[currentPage - 1];
    if (pageAr && pageAr > 0.1 && pageAr < 10) return pageAr;
    return pdfBackground.aspectRatio || (1400 / 960);
  }, [pdfBackground, currentPage]);

  const baseWidth = 1400;
  const baseHeight = baseWidth / currentAspectRatio;
  const scaleFactor = zoom / 100;
  const sheetWidth = baseWidth * scaleFactor;
  const sheetHeight = baseHeight * scaleFactor;

  // Strict boundary check: wires and cursor interactions are strictly inside the position plan sheet
  const isPointInsidePlan = (pt: Point): boolean => {
    if (!pdfBackground) return false;
    return pt.x >= 0 && pt.x <= baseWidth && pt.y >= 0 && pt.y <= baseHeight;
  };

  const isCursorInsidePlan = useMemo(() => {
    if (!pdfBackground) return false;
    return rawCursorPos.x >= 0 && rawCursorPos.x <= baseWidth && rawCursorPos.y >= 0 && rawCursorPos.y <= baseHeight;
  }, [pdfBackground, rawCursorPos, baseWidth, baseHeight]);

  const magneticResult = useMemo(() => {
    if (!magneticSnapEnabled) {
      return { point: rawCursorPos, target: null, isSnapped: false };
    }
    // Only snap if cursor is actually inside the position plan sheet
    if (!isCursorInsidePlan) {
      return { point: rawCursorPos, target: null, isSnapped: false };
    }
    if (nextTargetSymbol) {
      const d = Math.hypot(rawCursorPos.x - nextTargetSymbol.x, rawCursorPos.y - nextTargetSymbol.y);
      if (d <= DETECTION_RADIUS_1CM) {
        return { point: { x: nextTargetSymbol.x, y: nextTargetSymbol.y }, target: nextTargetSymbol, isSnapped: true };
      }
    }
    return findMagneticSnap(rawCursorPos, allObstacles, DETECTION_RADIUS_1CM);
  }, [magneticSnapEnabled, rawCursorPos, allObstacles, nextTargetSymbol, isCursorInsidePlan]);

  const activeCursor = magneticResult.point;
  const activeSnapTarget = magneticResult.target;

  const livePreviewCurve = useMemo(() => {
    if (activeTool !== 'wire' || !wireStartPoint || !pdfBackground) return null;
    // Les lignes de relié ne fonctionnent QUE dans le plan de position !
    if (!isCursorInsidePlan) return null;
    return generateWirePath(wireStartPoint, activeCursor, wireStyle, invertCurve, allObstacles, rawCursorPos);
  }, [activeTool, wireStartPoint, pdfBackground, isCursorInsidePlan, activeCursor, wireStyle, invertCurve, allObstacles, rawCursorPos]);

  const updateWires = (newWires: DrawnWire[], recordHistory = true) => {
    setWiresByPage(prev => ({
      ...prev,
      [currentPage]: newWires,
    }));

    if (recordHistory) {
      setHistoryByPage(prev => {
        const pageHist = prev[currentPage] || [[]];
        const nextSlice = pageHist.slice(0, currentHistoryIndex + 1);
        const updated = [...nextSlice, newWires];
        if (updated.length > 50) updated.shift();
        return {
          ...prev,
          [currentPage]: updated,
        };
      });
      setHistoryIndexByPage(prev => ({
        ...prev,
        [currentPage]: Math.min((prev[currentPage] || 0) + 1, 49),
      }));
    }
  };

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      const nextIdx = currentHistoryIndex - 1;
      setHistoryIndexByPage(prev => ({
        ...prev,
        [currentPage]: nextIdx,
      }));
      setWiresByPage(prev => ({
        ...prev,
        [currentPage]: currentHistory[nextIdx] || [],
      }));
      setWireStartPoint(null);
      showToast('↩️ Dernier fil tracé supprimé (Reculé en arrière)');
    } else if (currentWires.length > 0) {
      const popped = currentWires.slice(0, -1);
      updateWires(popped, false);
      showToast('↩️ Dernier fil tracé supprimé');
    }
  };

  const handleRedo = () => {
    if (currentHistoryIndex < currentHistory.length - 1) {
      const nextIdx = currentHistoryIndex + 1;
      setHistoryIndexByPage(prev => ({
        ...prev,
        [currentPage]: nextIdx,
      }));
      setWiresByPage(prev => ({
        ...prev,
        [currentPage]: currentHistory[nextIdx] || [],
      }));
      setWireStartPoint(null);
      showToast('↪️ Fil rétabli');
    }
  };

  const handleClearAllWires = () => {
    if (currentWires.length > 0) {
      updateWires([]);
      setWireStartPoint(null);
      showToast('🗑️ Toutes les lignes tracées sur cette page ont été effacées');
    }
  };

  /**
   * Exécution du câblage automatique démarrant OBLIGATOIREMENT du Tableau TGBT :
   * - Chaque circuit (A, B, C...) tire son alimentation principale depuis le TGBT.
   * - Mode 1 ('ordered') : Départ TGBT ➔ A1 ➔ A2 ➔ A3... (dans l'ordre strict de numérotation).
   * - Mode 2 ('shortest') : Départ TGBT ➔ chemin le plus court global pour relier tous les points du circuit (Éco-Câble).
   * - Relie chaque interrupteur à la lampe associée.
   * - Remplace proprement les liaisons existantes des circuits ciblés.
   */
  const executeAutoWire = (
    tgbtSymbol: ObstaclePoint,
    filterPrefix?: string,
    mode: 'ordered' | 'shortest' = 'ordered'
  ) => {
    if (!pdfBackground || currentSymbols.length === 0) {
      showToast('⚠️ Aucun plan ou symbole détecté sur cette page.', true);
      return;
    }

    // 1. Regrouper les symboles par préfixe de circuit (en excluant le TGBT des points terminaux)
    const circuitPointsMap = new Map<string, { num: number; sym: ObstaclePoint; code: string }[]>();
    const switchControlPairs: { switchSym: ObstaclePoint; lampSym: ObstaclePoint; circuitCode: string }[] = [];

    currentSymbols.forEach(sym => {
      if (sym.type === 'panel' || sym.id === tgbtSymbol.id) return;

      const fullText = `${sym.label || ''} ${sym.id || ''}`;
      const allMatches = Array.from(fullText.matchAll(/\b([A-Za-z]{1,2})[-_\s]*(\d{1,2})\b/gi));

      const isSwitch = sym.type === 'switch' || fullText.toLowerCase().includes('interrupteur');

      if (allMatches.length === 0) {
        const parsed = parseAlphaNumericCode(sym.label || sym.id);
        if (parsed) {
          allMatches.push([parsed.fullCode, parsed.prefix, String(parsed.num)] as any);
        }
      }

      allMatches.forEach(m => {
        const prefix = m[1].toUpperCase();
        const num = parseInt(m[2], 10);
        const fullCode = `${prefix}${num}`;

        // Si interrupteur de type "Interrupteur S1 / A1", lier à la lampe A1
        if (isSwitch && prefix === 'S') {
          const otherMatch = allMatches.find(om => om[1].toUpperCase() !== 'S');
          if (otherMatch) {
            const targetPrefix = otherMatch[1].toUpperCase();
            const targetNum = parseInt(otherMatch[2], 10);
            const targetLamp = currentSymbols.find(s => {
              const code = parseAlphaNumericCode(s.label || s.id);
              return code && code.prefix === targetPrefix && code.num === targetNum && s.id !== sym.id;
            });
            if (targetLamp) {
              switchControlPairs.push({
                switchSym: sym,
                lampSym: targetLamp,
                circuitCode: targetPrefix,
              });
            }
          }
          return;
        }

        if (!circuitPointsMap.has(prefix)) {
          circuitPointsMap.set(prefix, []);
        }
        const list = circuitPointsMap.get(prefix)!;
        if (!list.some(item => item.sym.id === sym.id)) {
          list.push({ num, sym, code: fullCode });
        }
      });
    });

    const targetPrefixes = filterPrefix
      ? [filterPrefix.toUpperCase()]
      : Array.from(circuitPointsMap.keys()).sort();

    if (targetPrefixes.length === 0) {
      showToast('⚠️ Aucun symbole avec indicatif de circuit (ex: A1, E2...) trouvé.', true);
      return;
    }

    const createdWires: DrawnWire[] = [];
    const wiredCircuitsSet = new Set<string>();

    // Préserver les câbles des autres circuits, et remplacer proprement les câbles des circuits ciblés
    const baseWires = currentWires.filter(w => !targetPrefixes.includes(w.circuitCode));

    targetPrefixes.forEach(prefix => {
      const points = circuitPointsMap.get(prefix);
      if (!points || points.length === 0) return;

      const circuitDef = WIRE_A_TO_Z_COLORS.find(c => c.code === prefix) || {
        id: `circ_${prefix}`,
        code: prefix,
        name: `Circuit ${prefix}`,
        hex: '#2563eb',
      };

      // 1. Relier les interrupteurs à leur lampe associée (au chemin le plus court)
      switchControlPairs
        .filter(pair => pair.circuitCode === prefix)
        .forEach(pair => {
          const p1 = { x: pair.switchSym.x, y: pair.switchSym.y };
          const p2 = { x: pair.lampSym.x, y: pair.lampSym.y };

          const alreadyConnected = [...baseWires, ...createdWires].some(
            w =>
              (Math.hypot(w.p1.x - p1.x, w.p1.y - p1.y) < 14 && Math.hypot(w.p2.x - p2.x, w.p2.y - p2.y) < 14) ||
              (Math.hypot(w.p2.x - p1.x, w.p2.y - p1.y) < 14 && Math.hypot(w.p1.x - p2.x, w.p1.y - p2.y) < 14)
          );

          if (!alreadyConnected) {
            const optimal = computeOptimalShortestPath(p1, p2, allObstacles);
            createdWires.push({
              id: `wire_auto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              pageNumber: currentPage,
              p1,
              p2,
              color: circuitDef.hex,
              circuitCode: circuitDef.code,
              circuitName: circuitDef.name,
              wireStyle: optimal.chosenStyle,
              invertCurve: optimal.chosenInvert,
              curvature: optimal.curvature,
              controlPoint: optimal.controlPoint,
              pathD: optimal.pathD,
            });
            wiredCircuitsSet.add(prefix);
          }
        });

      // 2. Détermination de la séquence avec DÉPART OBLIGATOIRE DEPUIS LE TGBT :
      let sequencePoints: ObstaclePoint[] = [];

      if (mode === 'shortest') {
        // Mode 2 : Départ TGBT ➔ chaîne la plus courte pour minimiser le câble total consommé
        const rawPoints = points.map(p => p.sym);
        const optimalOrder = findShortestDaisyChainFromOrigin(tgbtSymbol, rawPoints);
        sequencePoints = [tgbtSymbol, ...optimalOrder];
      } else {
        // Mode 1 : Départ TGBT ➔ A1 ➔ A2 ➔ A3... (dans l'ordre strict de numérotation croissante)
        const sorted = [...points].sort((a, b) => a.num - b.num);
        sequencePoints = [tgbtSymbol, ...sorted.map(p => p.sym)];
      }

      for (let i = 0; i < sequencePoints.length - 1; i++) {
        const ptA = sequencePoints[i];
        const ptB = sequencePoints[i + 1];

        // Ignorer les points physiquement superposés
        if (Math.hypot(ptA.x - ptB.x, ptA.y - ptB.y) < 10) continue;

        const p1 = { x: ptA.x, y: ptA.y };
        const p2 = { x: ptB.x, y: ptB.y };

        const alreadyConnected = createdWires.some(
          w =>
            (Math.hypot(w.p1.x - p1.x, w.p1.y - p1.y) < 14 && Math.hypot(w.p2.x - p2.x, w.p2.y - p2.y) < 14) ||
            (Math.hypot(w.p2.x - p1.x, w.p2.y - p1.y) < 14 && Math.hypot(w.p1.x - p2.x, w.p1.y - p2.y) < 14)
        );

        if (!alreadyConnected) {
          const optimal = computeOptimalShortestPath(p1, p2, allObstacles);
          createdWires.push({
            id: `wire_auto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            pageNumber: currentPage,
            p1,
            p2,
            color: circuitDef.hex,
            circuitCode: circuitDef.code,
            circuitName: circuitDef.name,
            wireStyle: optimal.chosenStyle,
            invertCurve: optimal.chosenInvert,
            curvature: optimal.curvature,
            controlPoint: optimal.controlPoint,
            pathD: optimal.pathD,
          });
          wiredCircuitsSet.add(prefix);
        }
      }
    });

    if (createdWires.length === 0) {
      showToast('✅ Tous les circuits sont déjà entièrement reliés selon ce mode !');
      return;
    }

    updateWires([...baseWires, ...createdWires], true);

    const circuitCount = wiredCircuitsSet.size;
    const totalPixels = createdWires.reduce((acc, w) => acc + Math.hypot(w.p2.x - w.p1.x, w.p2.y - w.p1.y), 0);
    const estMeters = (totalPixels / 45).toFixed(1);

    const overLimitCircuits = targetPrefixes.filter(p => (circuitPointsMap.get(p)?.length || 0) > 8);
    const rgieWarning = overLimitCircuits.length > 0 ? ` (⚠️ Attention norme RGIE : Circuit ${overLimitCircuits.join(', ')} dépasse 8 points)` : '';

    if (mode === 'shortest') {
      showToast(
        `🌿 Mode 2 (Au + court / Éco-Câble) : ${createdWires.length} liaisons créées (${circuitCount} circuits) avec départ depuis le TGBT au plus court chemin (~${estMeters} m de câble) !${rgieWarning}`
      );
    } else {
      showToast(
        `🔢 Mode 1 (Dans l'ordre) : ${createdWires.length} liaisons créées (${circuitCount} circuits) avec départ TGBT ➔ 1➔2➔3... (~${estMeters} m de câble) !${rgieWarning}`
      );
    }
  };

  /**
   * Déclencheur du câblage automatique en 1 clic :
   * Demande et vérifie l'emplacement du TGBT (Tableau Général) avant de démarrer.
   */
  const autoWireAllCircuits = (filterPrefix?: string, mode: 'ordered' | 'shortest' = 'ordered') => {
    if (!pdfBackground || currentSymbols.length === 0) {
      showToast('⚠️ Aucun plan ou symbole détecté sur cette page.', true);
      return;
    }

    if (!currentTgbt) {
      setPendingAutoWire({ filterPrefix, mode });
      setShowTgbtPlacementModal(true);
      return;
    }

    if (alwaysUseCurrentTgbt) {
      executeAutoWire(currentTgbt, filterPrefix, mode);
      return;
    }

    setPendingAutoWire({ filterPrefix, mode });
    setShowTgbtPlacementModal(true);
  };

  const handleCycleWireStyle = (wireId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = currentWires.find(w => w.id === wireId);
    if (!target) return;

    let nextStyle: WireStyle = 'curve';
    let nextInvert = false;

    const curStyle = target.wireStyle || 'curve';
    const curInvert = !!target.invertCurve;

    if (curStyle === 'curve' && !curInvert) {
      nextStyle = 'curve';
      nextInvert = true;
    } else if (curStyle === 'curve' && curInvert) {
      nextStyle = 'straight';
      nextInvert = false;
    } else if (curStyle === 'straight') {
      nextStyle = 'orthogonal';
      nextInvert = false;
    } else if (curStyle === 'orthogonal' && !curInvert) {
      nextStyle = 'orthogonal';
      nextInvert = true;
    } else if (curStyle === 'orthogonal' && curInvert) {
      nextStyle = 'freehand';
      nextInvert = false;
    } else {
      nextStyle = 'curve';
      nextInvert = false;
    }

    const newPath = generateWirePath(target.p1, target.p2, nextStyle, nextInvert, allObstacles, undefined, undefined, target.points);
    const updated = currentWires.map(w => {
      if (w.id === wireId) {
        return {
          ...w,
          wireStyle: nextStyle,
          invertCurve: nextInvert,
          controlPoint: newPath.controlPoint,
          curvature: newPath.curvature,
          pathD: newPath.pathD,
        };
      }
      return w;
    });

    updateWires(updated);
    const labels: Record<string, string> = {
      'curve_false': 'Courbe naturelle',
      'curve_true': 'Courbe inversée',
      'straight_false': 'Rectiligne direct',
      'orthogonal_false': 'Angle droit 90°',
      'orthogonal_true': 'Angle 90° inversé',
      'freehand_false': 'Liaison libre',
    };
    showToast(`🔄 Type changé : ${labels[`${nextStyle}_${nextInvert}`] || nextStyle}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setWireStartPoint(null);
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      if (!e.ctrlKey && !e.metaKey && (e.key === '0' || e.key.toLowerCase() === 'i')) {
        if (activeTool === 'wire') {
          e.preventDefault();
          setInvertCurve(prev => !prev);
          showToast(!invertCurve ? '⇄ Sens inversé (Touche 0)' : '⇄ Sens normal (Touche 0)');
          return;
        }
      }

      if (!e.ctrlKey && !e.metaKey && activeTool === 'wire') {
        if (e.key.toLowerCase() === 'a') {
          setWireStyle('auto');
          showToast('✨ Mode Intelligent : Courbe et type choisis selon le lieu (Touche A)');
        } else if (e.key === '1') {
          setWireStyle('curve');
          showToast('Style : Courbe / Parabole (Touche 1)');
        } else if (e.key === '2') {
          setWireStyle('straight');
          showToast('Style : Rectiligne / Droit (Touche 2)');
        } else if (e.key === '3') {
          setWireStyle('orthogonal');
          showToast('Style : Angle droit 90° (Touche 3)');
        } else if (e.key === '4') {
          setWireStyle('freehand');
          showToast('Style : Liaison libre (Touche 4)');
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentHistoryIndex, currentHistory, currentWires, currentPage, activeTool, invertCurve]);



  const fitToScreen = (overrideAspectRatio?: number) => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth || 1000;
    const ch = containerRef.current.clientHeight || 650;
    const ar = overrideAspectRatio || currentAspectRatio;

    const bWidth = 1400;
    const bHeight = bWidth / ar;

    // Margin around document so 100% of the plan is fully visible without touching borders
    const marginX = Math.min(32, Math.max(16, cw * 0.03));
    const marginY = Math.min(32, Math.max(16, ch * 0.03));
    const availW = Math.max(100, cw - marginX * 2);
    const availH = Math.max(100, ch - marginY * 2);

    const scale = Math.min(availW / bWidth, availH / bHeight);
    const targetZoom = Math.max(15, Math.min(250, Math.round(scale * 100)));
    const actualScale = targetZoom / 100;

    const renderedW = bWidth * actualScale;
    const renderedH = bHeight * actualScale;

    const targetPanX = Math.round((cw - renderedW) / 2);
    const targetPanY = Math.round((ch - renderedH) / 2);

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
    setWireStartPoint(null);
    showToast(`⛶ Plan ajusté à l'écran (${targetZoom}%)`);
  };

  const fitWidth = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth || 1000;
    const margin = 24;
    const availW = Math.max(100, cw - margin * 2);
    const scale = availW / 1400;
    const targetZoom = Math.max(15, Math.min(250, Math.round(scale * 100)));
    const renderedW = 1400 * (targetZoom / 100);
    const targetPanX = Math.round((cw - renderedW) / 2);
    setZoom(targetZoom);
    setPan(prev => ({ x: targetPanX, y: 24 }));
    setWireStartPoint(null);
    showToast(`↔ Ajusté à la largeur (${targetZoom}%)`);
  };

  // Auto-fit on initial render or page switch
  useEffect(() => {
    if (pdfBackground && containerRef.current) {
      fitToScreen();
    }
  }, [currentPage]);

  // Handle PDF file upload
  const handleProcessFile = async (file: File) => {
    setIsLoadingPdf(true);
    setPdfError(null);
    try {
      let result;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        result = await loadPdfPages(file);
      } else if (file.type.startsWith('image/')) {
        result = await loadImageAsBlueprint(file);
      } else {
        throw new Error('Veuillez sélectionner un fichier PDF ou une image (PNG, JPG).');
      }

      if (result.pageImages.length === 0) {
        throw new Error('Aucune page n’a pu être extraite du fichier.');
      }

      setPdfBackground({
        fileName: result.fileName,
        currentPage: 1,
        totalPages: result.totalPages,
        pageImages: result.pageImages,
        opacity: 0.85,
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        visible: true,
        aspectRatio: result.aspectRatio,
        pageAspectRatios: result.pageAspectRatios,
      });

      setWiresByPage({ 1: [] });
      setHistoryByPage({ 1: [[]] });
      setHistoryIndexByPage({ 1: 0 });
      if (result.detectedSymbolsByPage && Object.keys(result.detectedSymbolsByPage).length > 0) {
        setSymbolsByPage(result.detectedSymbolsByPage);
      } else {
        setSymbolsByPage({ 1: [] });
      }
      setWireStartPoint(null);
      setLocateCircuitLetter(null);
      setSequenceGuide({
        active: false,
        prefix: 'A',
        currentNum: 1,
        nextNum: 2,
        currentCode: 'A1',
        nextCode: 'A2',
      });

      // Auto fit the PDF immediately so 100% of the sheet is visible!
      setTimeout(() => {
        fitToScreen(result.aspectRatio);
      }, 60);

      setIsLoadingPdf(false);
      setShowFullscreenPrompt(true);
      setTimeout(() => setShowFullscreenPrompt(false), 9000);
      if (result.totalPages > 1) {
        triggerPageSignal();
        showToast(`📄 Document de ${result.totalPages} pages chargé ! (Signal actif pendant 5s sur la case [1/${result.totalPages}])`, true);
      } else {
        setShowPageAlert(false);
        showToast(`📄 PDF "${result.fileName}" chargé avec succès !`);
      }
    } catch (err: any) {
      console.error(err);
      setPdfError(err.message || 'Erreur lors de la lecture du fichier.');
      setIsLoadingPdf(false);
    }
  };

  const handleLoadSampleBlueprint = () => {
    setIsLoadingPdf(true);
    setTimeout(() => {
      const sample = generateSamplePositionBlueprint();
      setPdfBackground({
        fileName: sample.fileName,
        currentPage: 1,
        totalPages: sample.totalPages,
        pageImages: sample.pageImages,
        opacity: 0.88,
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        visible: true,
        aspectRatio: sample.aspectRatio,
        pageAspectRatios: [sample.aspectRatio],
      });
      setWiresByPage({ 1: [] });
      setHistoryByPage({ 1: [[]] });
      setHistoryIndexByPage({ 1: 0 });
      setSymbolsByPage({ 1: SAMPLE_SYMBOLS });
      setWireStartPoint(null);
      setLocateCircuitLetter(null);
      setSequenceGuide({
        active: false,
        prefix: 'A',
        currentNum: 1,
        nextNum: 2,
        currentCode: 'A1',
        nextCode: 'A2',
      });

      // Auto fit to screen
      setTimeout(() => {
        fitToScreen(sample.aspectRatio);
      }, 60);

      setIsLoadingPdf(false);
      setShowFullscreenPrompt(true);
      setTimeout(() => setShowFullscreenPrompt(false), 9000);
      if (sample.totalPages > 1) {
        triggerPageSignal();
      }
      showToast('✨ Schéma exemple chargé ! Les fils s’aimantent et évitent les obstacles.');
    }, 200);
  };

  const screenToSheet = (clientX: number, clientY: number): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const sx = clientX - rect.left - pan.x;
    const sy = clientY - rect.top - pan.y;
    const scaleFactor = zoom / 100;
    return {
      x: sx / scaleFactor,
      y: sy / scaleFactor,
    };
  };

  const distToSegment = (p: Point, v: Point, w: Point): number => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    return Math.hypot(p.x - proj.x, p.y - proj.y);
  };

  const handleCenterOnPoint = (pt: Point, targetLabel?: string) => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scale = zoom / 100;
    setPan({
      x: Math.round(cw / 2 - pt.x * scale),
      y: Math.round(ch / 2 - pt.y * scale),
    });
    showToast(`🎯 Centré sur ${targetLabel || pt.label || 'le point'}`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || activeTool === 'pan' || e.altKey || isSpacePressed) {
      if (wireStartPoint) {
        setWireStartPoint(null);
        return;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const clickedPoint = activeCursor;

    // TGBT Placement Tool (Pointer l'emplacement du tableau électrique sur le plan)
    if (activeTool === 'place_tgbt') {
      if (!isPointInsidePlan(clickedPoint)) {
        showToast('⚠️ Cliquez à l’intérieur du plan pour positionner le Tableau TGBT.', true);
        return;
      }

      const newTgbt: ObstaclePoint = {
        id: 'TGBT',
        x: Math.round(clickedPoint.x),
        y: Math.round(clickedPoint.y),
        radius: 28,
        label: 'Tableau TGBT',
        type: 'panel',
      };

      const existingTgbt = currentSymbols.find(
        s => s.type === 'panel' || s.id === 'TGBT' || (s.label && s.label.toUpperCase().includes('TGBT'))
      );

      const updatedSymbols = existingTgbt
        ? currentSymbols.map(s => s.id === existingTgbt.id ? newTgbt : s)
        : [...currentSymbols, newTgbt];

      setSymbolsByPage(prev => ({
        ...prev,
        [currentPage]: updatedSymbols,
      }));

      setActiveTool('wire');
      showToast(`📍 Tableau TGBT positionné à (${newTgbt.x}, ${newTgbt.y}) !`);

      // Déclencher le câblage automatique immédiatement si une demande était en attente
      if (pendingAutoWire) {
        const target = pendingAutoWire;
        setPendingAutoWire(null);
        setTimeout(() => {
          executeAutoWire(newTgbt, target.filterPrefix, target.mode);
        }, 100);
      }
      return;
    }

    // Eraser Tool
    if (activeTool === 'eraser') {
      const clickedWire = currentWires.find(w => distToSegment(clickedPoint, w.p1, w.p2) < 22);
      if (clickedWire) {
        const remaining = currentWires.filter(w => w.id !== clickedWire.id);
        updateWires(remaining);
        showToast('Ligne effacée');
        return;
      }
      const clickedSym = currentSymbols.find(s => Math.hypot(clickedPoint.x - s.x, clickedPoint.y - s.y) < s.radius);
      if (clickedSym) {
        setSymbolsByPage(prev => ({
          ...prev,
          [currentPage]: currentSymbols.filter(s => s.id !== clickedSym.id),
        }));
        showToast('Symbole retiré');
        return;
      }
      return;
    }

    // Wire / Liaison Tool
    if (activeTool === 'wire') {
      if (!pdfBackground) return;

      // Les lignes de relié ne fonctionnent QUE dans le plan de position !
      if (!isPointInsidePlan(clickedPoint)) {
        if (!wireStartPoint) {
          showToast('⚠️ Les lignes de liaison ne fonctionnent qu’à l’intérieur du plan de position.');
        } else {
          showToast('⚠️ Le point d’arrivée doit être situé à l’intérieur du plan de position.');
        }
        return;
      }

      if (!wireStartPoint) {
        setWireStartPoint(clickedPoint);

        // Cercle de détection calibré à exactement 1 cm de diamètre (rayon 19px à 96 DPI)
        const sortedSymbols = [...currentSymbols]
          .map(s => ({ s, d: Math.hypot(s.x - clickedPoint.x, s.y - clickedPoint.y) }))
          .filter(item => item.d <= DETECTION_RADIUS_1CM)
          .sort((a, b) => a.d - b.d);
        const nearSymbol = sortedSymbols[0]?.s;
        const detected = nearSymbol ? parseAlphaNumericCode(nearSymbol.label || nearSymbol.id) : null;
        if (detected) {
          const matchingColor = WIRE_A_TO_Z_COLORS.find(c => c.code === detected.prefix);
          if (matchingColor && selectedWireColor !== matchingColor.hex) {
            setSelectedWireColor(matchingColor.hex);
          }
          const nextTargetNum = detected.num + 1;
          const nextTargetCode = `${detected.prefix}${nextTargetNum}`;
          setSequenceGuide({
            active: true,
            prefix: detected.prefix,
            currentNum: detected.num,
            nextNum: nextTargetNum,
            currentCode: detected.fullCode,
            nextCode: nextTargetCode,
          });

          // Check if target symbol (e.g. L2) exists on current plan
          const nextSym = currentSymbols.find(s => {
            const c = parseAlphaNumericCode(s.label || s.id);
            return c && c.prefix === detected.prefix && c.num === nextTargetNum;
          });

          if (nextSym) {
            showToast(`🎯 Départ ${detected.fullCode} ! ➔ ${nextTargetCode} détecté et signalé par le laser doré sur le plan !`);
          } else {
            showToast(`🎯 Départ ${detected.fullCode} ! ➔ Reliez vers ${nextTargetCode}`);
          }
        } else if (sequenceGuide.active) {
          showToast(`🎯 Séquence active ${sequenceGuide.prefix} : Reliez vers ${sequenceGuide.nextCode}`);
        }
      } else {
        const dist = Math.hypot(clickedPoint.x - wireStartPoint.x, clickedPoint.y - wireStartPoint.y);
        if (dist > 15) {
          const curve = generateWirePath(wireStartPoint, clickedPoint, wireStyle, invertCurve, allObstacles, rawCursorPos);
          const resolvedStyle = (wireStyle === 'auto' ? curve.chosenStyle : wireStyle) || 'curve';
          const resolvedInvert = (wireStyle === 'auto' ? curve.chosenInvert : invertCurve) ?? false;

          let finalPathD = curve.pathD;
          let finalPoints: Point[] | undefined = undefined;

          if (wireStyle === 'freehand') {
            const allPts = [wireStartPoint, ...freehandPoints, clickedPoint];
            finalPoints = allPts;
            finalPathD = pointsToSmoothSvgPath(allPts);
          }

          const newWire: DrawnWire = {
            id: `wire_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            pageNumber: currentPage,
            p1: wireStartPoint,
            p2: clickedPoint,
            color: selectedWireColor,
            circuitCode: activeColorDef.code,
            circuitName: activeColorDef.name,
            wireStyle: resolvedStyle,
            invertCurve: resolvedInvert,
            curvature: curve.curvature,
            controlPoint: finalPoints ? (finalPoints[Math.floor(finalPoints.length / 2)] || curve.controlPoint) : curve.controlPoint,
            pathD: finalPathD,
            points: finalPoints,
          };
          updateWires([...currentWires, newWire]);
          setFreehandPoints([]);

          // Cercle de détection calibré à exactement 1 cm de diamètre (rayon 19px)
          const endSorted = [...currentSymbols]
            .map(s => ({ s, d: Math.hypot(s.x - clickedPoint.x, s.y - clickedPoint.y) }))
            .filter(item => item.d <= DETECTION_RADIUS_1CM)
            .sort((a, b) => a.d - b.d);
          const endSymbol = endSorted[0]?.s;
          const endCode = endSymbol ? parseAlphaNumericCode(endSymbol.label || endSymbol.id) : null;

          if (sequenceGuide.active) {
            const reachedNum = (endCode && endCode.prefix === sequenceGuide.prefix) ? endCode.num : sequenceGuide.nextNum;
            const nextNum = reachedNum + 1;
            const reachedCode = `${sequenceGuide.prefix}${reachedNum}`;
            const nextCode = `${sequenceGuide.prefix}${nextNum}`;

            setSequenceGuide(prev => ({
              ...prev,
              active: true,
              prefix: prev.prefix,
              currentNum: reachedNum,
              nextNum: nextNum,
              currentCode: reachedCode,
              nextCode: nextCode,
              lastConnectedCode: reachedCode,
            }));

            // Check if nextCode exists on the plan to announce it (e.g. L3, L4...)
            const upcomingSymbol = currentSymbols.find(s => {
              const code = parseAlphaNumericCode(s.label || s.id);
              return code && code.prefix === sequenceGuide.prefix && code.num === nextNum;
            });

            if (reachedNum >= 8) {
              showToast(`🏆 ${reachedCode} relié ! Le circuit ${sequenceGuide.prefix} a atteint ses 8 points (Norme NF C 15-100 / RGIE).`, true);
            } else if (upcomingSymbol) {
              showToast(`✅ ${reachedCode} relié ! ➔ ${nextCode} repéré et signalé automatiquement sur le plan !`);
            } else {
              showToast(`✅ ${reachedCode} relié avec succès ! ➔ Prochain : ${nextCode}`);
            }
          } else {
            const activeDetail = circuitDetailsMap[activeColorDef.code];
            const newPtsCount = (activeDetail?.total || 0) + 1;
            if (newPtsCount >= 8) {
              showToast(
                `⚠️ ALERTE : Le Circuit ${activeColorDef.code} a atteint la limite de 8 points ! Veuillez changer de circuit.`,
                true
              );
            } else {
              showToast(`⚡ Fil Circuit ${activeColorDef.code} tracé (${newPtsCount}/8 points)`);
            }
          }
        }
        setWireStartPoint(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    const pt = screenToSheet(e.clientX, e.clientY);
    setRawCursorPos(pt);

    if (activeTool === 'wire' && wireStartPoint && wireStyle === 'freehand') {
      if (isPointInsidePlan(pt)) {
        setFreehandPoints(prev => {
          const lastPt = prev.length > 0 ? prev[prev.length - 1] : wireStartPoint;
          const d = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y);
          if (d >= 3) {
            return [...prev, pt];
          }
          return prev;
        });
      }
    }

    if (draggedCurveWireId) {
      setWiresByPage(prev => {
        const pageWires = prev[currentPage] || [];
        return {
          ...prev,
          [currentPage]: pageWires.map(w => {
            if (w.id === draggedCurveWireId) {
              const dx = w.p2.x - w.p1.x;
              const dy = w.p2.y - w.p1.y;
              const dist = Math.hypot(dx, dy) || 1;
              const nx = -dy / dist;
              const ny = dx / dist;
              const midX = (w.p1.x + w.p2.x) / 2;
              const midY = (w.p1.y + w.p2.y) / 2;
              const curvature = (pt.x - midX) * nx + (pt.y - midY) * ny;

              return {
                ...w,
                controlPoint: pt,
                curvature,
                pathD: `M ${w.p1.x} ${w.p1.y} Q ${pt.x} ${pt.y} ${w.p2.x} ${w.p2.y}`,
              };
            }
            return w;
          }),
        };
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (draggedCurveWireId) {
      const updatedWires = wiresByPage[currentPage] || [];
      updateWires(updatedWires);
      setDraggedCurveWireId(null);
      showToast('Courbure de la parabole enregistrée');
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 8 : -8;
    const newZoom = Math.max(15, Math.min(300, zoom + delta));
    if (newZoom === zoom) return;

    const oldScale = zoom / 100;
    const newScale = newZoom / 100;

    // Anchor zoom smoothly to where the cursor is pointing
    const newPanX = mouseX - (mouseX - pan.x) * (newScale / oldScale);
    const newPanY = mouseY - (mouseY - pan.y) * (newScale / oldScale);

    setZoom(newZoom);
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };



  const redCrosshairCursorSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="3.5" fill="%23dc2626" stroke="%23ffffff" stroke-width="1.5"/><line x1="16" y1="2" x2="16" y2="10" stroke="%23dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="22" x2="16" y2="30" stroke="%23dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="2" y1="16" x2="10" y2="16" stroke="%23dc2626" stroke-width="2.5" stroke-linecap="round"/><line x1="22" y1="16" x2="30" y2="16" stroke="%23dc2626" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="16" r="8" fill="none" stroke="%23dc2626" stroke-width="1" stroke-dasharray="2,2"/></svg>`;

  const handleExportAnnotatedPlan = () => {
    if (!pdfBackground || !pdfBackground.pageImages[currentPage - 1]) return;
    const canvas = document.createElement('canvas');
    canvas.width = baseWidth * 2;
    canvas.height = baseHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.globalAlpha = pdfBackground.opacity || 0.85;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      currentSymbols.forEach(sym => {
        const sx = sym.x * 2;
        const sy = sym.y * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(sx, sy, sym.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sym.label || '', sx, sy + 30);
      });

      currentWires.forEach(w => {
        const x1 = w.p1.x * 2;
        const y1 = w.p1.y * 2;
        const x2 = w.p2.x * 2;
        const y2 = w.p2.y * 2;
        const style = w.wireStyle || 'curve';
        const cp = w.controlPoint
          ? { x: w.controlPoint.x * 2, y: w.controlPoint.y * 2 }
          : { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };

        ctx.strokeStyle = w.color;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([8, 5]);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        if (style === 'freehand' && w.points && w.points.length >= 2) {
          for (let i = 1; i < w.points.length; i++) {
            ctx.lineTo(w.points[i].x * 2, w.points[i].y * 2);
          }
        } else if (style === 'straight') {
          ctx.lineTo(x2, y2);
        } else if (style === 'orthogonal') {
          ctx.lineTo(cp.x, cp.y);
          ctx.lineTo(x2, y2);
        } else {
          ctx.quadraticCurveTo(cp.x, cp.y, x2, y2);
        }
        ctx.stroke();

        ctx.fillStyle = w.color;
        ctx.beginPath();
        ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
        ctx.arc(x2, y2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(30, canvas.height - 60, 560, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`ÉlecPlan - Schéma de Position Annoté (Page ${currentPage}/${pdfBackground.totalPages})`, 50, canvas.height - 33);

      const downloadUrl = canvas.toDataURL('image/png', 0.95);
      const link = document.createElement('a');
      link.download = `${pdfBackground.fileName.replace(/\.[^/.]+$/, '')}_page${currentPage}_annote.png`;
      link.href = downloadUrl;
      link.click();
      showToast('💾 Schéma annoté téléchargé avec succès !');
    };
    img.src = pdfBackground.pageImages[currentPage - 1];
  };

  return (
    <div
      ref={appRootRef}
      className={`w-full flex flex-col bg-slate-900 transition-all duration-300 text-slate-100 ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] w-screen h-screen min-h-screen rounded-none border-none shadow-none'
          : 'h-full min-h-[750px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800'
      }`}
    >
      {/* 1. TOP HEADER & MAIN CONTROLS */}
      <header className="w-full bg-slate-900 border-b border-slate-700 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md z-30 shrink-0">
        <div className="flex items-center gap-3">
          {onBackToVoltScope && (
            <button
              onClick={onBackToVoltScope}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer font-bold shadow-xs active:scale-95"
              title="Retourner aux 19 fenêtres de VoltScope"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Retour à VoltScope</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-bold leading-tight text-white flex items-center gap-1.5">
                <span>ÉlecPlan · Schéma de Position PDF</span>
                <span className="text-[10px] bg-red-600/30 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-normal flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-red-400" />
                  Circuits A-Z &amp; Aimant
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 leading-tight">
                Téléchargez votre PDF et dessinez vos liaisons avec alerte Max 8 points
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          {/* Import / Replace PDF button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
            accept=".pdf,application/pdf,image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingPdf}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              pdfBackground
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                : 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400/40'
            }`}
            title="Importer un fichier PDF ou une image de plan"
          >
            <Upload className="w-3.5 h-3.5 text-red-400" />
            <span>{pdfBackground ? 'Changer de PDF' : 'Ajouter un fichier PDF'}</span>
          </button>

          {/* Page navigation & info */}
          {pdfBackground && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-[11px] text-slate-400 max-w-[130px] truncate" title={pdfBackground.fileName}>
                {pdfBackground.fileName}
              </span>

              {/* Page navigation & info with High-Visibility Multi-Page Signaling (5 secondes) */}
              {pdfBackground.totalPages > 1 && (
                <div className="relative ml-1">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all duration-300 ${
                      showPageAlert
                        ? 'bg-gradient-to-r from-amber-950/95 via-slate-900 to-amber-950/95 border-amber-400 ring-2 ring-amber-400 shadow-[0_0_22px_rgba(245,158,11,0.7)] animate-pulse'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    {/* Blinking signal beacon (actif 5 secondes) */}
                    {showPageAlert && (
                      <span className="relative flex h-2.5 w-2.5 mr-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                      </span>
                    )}

                    <button
                      disabled={currentPage <= 1}
                      onClick={() => {
                        setPdfBackground({ ...pdfBackground, currentPage: currentPage - 1 });
                        setWireStartPoint(null);
                      }}
                      className="p-1 hover:text-white text-slate-400 disabled:opacity-20 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Page précédente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col items-center">
                      <span
                        className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                          showPageAlert
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-inner'
                            : 'text-red-400'
                        }`}
                      >
                        {currentPage}/{pdfBackground.totalPages}
                      </span>
                    </div>

                    <button
                      disabled={currentPage >= pdfBackground.totalPages}
                      onClick={() => {
                        setPdfBackground({ ...pdfBackground, currentPage: currentPage + 1 });
                        setWireStartPoint(null);
                        setShowPageAlert(false);
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        showPageAlert
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/50 animate-bounce font-black active:scale-95'
                          : 'p-1 hover:text-white text-slate-400 disabled:opacity-20 rounded hover:bg-slate-800'
                      }`}
                      title={`Aller à la page suivante (${currentPage + 1}/${pdfBackground.totalPages})`}
                    >
                      {showPageAlert && (
                        <span className="text-[10px] uppercase font-black tracking-wider hidden sm:inline">Page suiv.</span>
                      )}
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Pulsating Callout Tooltip banner pointing right at the 1/4 box (actif 5 secondes) */}
                  {showPageAlert && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-[11px] rounded-xl shadow-xl shadow-amber-950/60 border border-amber-300 flex items-center gap-2 whitespace-nowrap z-50 animate-bounce">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">👆</span>
                        <span>{pdfBackground.totalPages} pages dans ce plan ! Cliquez ici pour changer de page ({currentPage}/{pdfBackground.totalPages})</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPageAlert(false);
                        }}
                        className="ml-1 p-0.5 hover:bg-black/20 rounded text-slate-950 hover:text-black cursor-pointer"
                        title="Masquer le message"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Opacity slider */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                <span className="text-[10px] text-slate-400">Opacité :</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={Math.round((pdfBackground.opacity || 0.85) * 100)}
                  onChange={e => {
                    setPdfBackground({ ...pdfBackground, opacity: parseInt(e.target.value) / 100 });
                  }}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <span className="text-[10px] font-mono text-slate-300 w-6">
                  {Math.round((pdfBackground.opacity || 0.85) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Tools (Lier, Styles, Aimant, Séquence, Gomme, Pan) */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => {
              setActiveTool('wire');
              setWireStartPoint(null);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTool === 'wire'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Outil Lier : Cliquez sur 2 points pour tracer la liaison"
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Lier</span>
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/60 ml-0.5"
              style={{ backgroundColor: selectedWireColor }}
            />
          </button>

          {activeTool === 'wire' && (
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 ml-0.5">
              <button
                onClick={() => {
                  setWireStyle('auto');
                  showToast('✨ Mode Intelligent : Courbe et type choisis selon le lieu');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  wireStyle === 'auto'
                    ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-300'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Mode Intelligent (Touche A)"
              >
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>Auto</span>
              </button>

              <button
                onClick={() => {
                  setWireStyle('curve');
                  showToast('Tracé : Parabole / Courbe');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  wireStyle === 'curve'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Style Courbe (Touche 1)"
              >
                <Spline className="w-3 h-3 text-amber-300" />
                <span>Courbe</span>
              </button>

              <button
                onClick={() => {
                  setWireStyle('straight');
                  showToast('Tracé : Rectiligne (Droit)');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  wireStyle === 'straight'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Style Rectiligne (Touche 2)"
              >
                <Minus className="w-3 h-3 text-cyan-300" />
                <span>Droit</span>
              </button>

              <button
                onClick={() => {
                  setWireStyle('orthogonal');
                  showToast('Tracé : Angle droit 90° (Équerre)');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  wireStyle === 'orthogonal'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Style Angle 90° (Touche 3)"
              >
                <CornerDownRight className="w-3 h-3 text-emerald-300" />
                <span>90°</span>
              </button>

              <button
                onClick={() => {
                  setWireStyle('freehand');
                  showToast('Tracé : Liaison libre (comme à la main)');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  wireStyle === 'freehand'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Style Libre à la main (Touche 4)"
              >
                <Pencil className="w-3 h-3 text-fuchsia-300" />
                <span>Main</span>
              </button>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

              <button
                onClick={() => {
                  setInvertCurve(prev => !prev);
                  showToast(!invertCurve ? '⇄ Sens inversé (Touche 0)' : '⇄ Sens normal (Touche 0)');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                  invertCurve
                    ? 'bg-amber-600/30 text-amber-200 border-amber-500/60 ring-1 ring-amber-400/40'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Inverser le sens (Touche 0)"
              >
                <RefreshCw className={`w-3 h-3 ${invertCurve ? 'text-amber-400 rotate-180 transition-transform' : 'text-slate-400'}`} />
                <span>Inverser 0</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setMagneticSnapEnabled(!magneticSnapEnabled)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              magneticSnapEnabled
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Activer/Désactiver l'aimantation automatique"
          >
            <Magnet className={`w-3.5 h-3.5 ${magneticSnapEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Aimant {magneticSnapEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              const nextActive = !sequenceGuide.active;
              if (!nextActive) {
                setSequenceGuide(prev => ({ ...prev, active: false }));
                showToast('Guidage masqué');
              } else {
                const circuitCode = activeColorDef.code || 'A';
                const prefixWires = currentWires.filter(w => w.circuitCode === circuitCode);
                const startNum = prefixWires.length === 0 ? 1 : Math.min(8, prefixWires.length + 1);
                const nextNum = Math.min(8, startNum + 1);
                setSequenceGuide({
                  active: true,
                  prefix: circuitCode,
                  currentNum: startNum,
                  nextNum: nextNum,
                  currentCode: `${circuitCode}${startNum}`,
                  nextCode: `${circuitCode}${nextNum}`,
                });
                showToast(`🎯 Guidage actif sur Circuit ${circuitCode} (${circuitCode}${startNum} ➔ ${circuitCode}${nextNum})`);
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              sequenceGuide.active
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-400/40 shadow-xs'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Guidage séquentiel automatique"
          >
            <Target className={`w-3.5 h-3.5 ${sequenceGuide.active ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Séquence {sequenceGuide.active ? `${sequenceGuide.prefix}1➔${sequenceGuide.prefix}2` : 'Off'}</span>
          </button>

          {/* Option: Localiser circuit (Tous les points K1, K2... K8 signalés en même temps) */}
          <button
            onClick={() => setShowLocateCircuitModal(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              locateCircuitLetter
                ? 'bg-amber-500/25 text-amber-300 border-amber-400 ring-2 ring-amber-400/50 shadow-md font-bold animate-pulse'
                : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Localiser circuit : affiche tous les points d'un circuit (ex: K1, K2... K8) simultanément sur le plan"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Localiser circuit {locateCircuitLetter ? `[${locateCircuitLetter}]` : ''}</span>
          </button>

          {/* Bouton Placer / Déplacer TGBT */}
          <button
            onClick={() => {
              if (activeTool === 'place_tgbt') {
                setActiveTool('wire');
                showToast('Mode placement TGBT désactivé');
              } else {
                setActiveTool('place_tgbt');
                showToast('📍 Cliquez sur le plan pour définir l’emplacement du Tableau TGBT');
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeTool === 'place_tgbt'
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-md animate-pulse'
                : currentTgbt
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:text-white hover:bg-amber-500/25'
                : 'border-amber-400 bg-amber-500/25 text-amber-200 animate-pulse'
            }`}
            title="Définir ou déplacer l'emplacement du Tableau Général TGBT d'où démarrent tous les circuits"
          >
            <Server className="w-3.5 h-3.5" />
            <span>{currentTgbt ? '📍 Déplacer TGBT' : '📍 Placer TGBT'}</span>
          </button>

          {/* Les 2 modes de relié automatique : Dans l'ordre (1➔2➔3) vs Au plus court (Éco-Câble) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/90 rounded-lg p-0.5 shadow-sm">
            <span className="px-2 text-[10px] uppercase font-extrabold text-slate-400 hidden xl:inline tracking-wider">
              Relier 1 Clic :
            </span>
            <button
              onClick={() => autoWireAllCircuits(undefined, 'ordered')}
              className="px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-amber-300 hover:text-white hover:bg-slate-800"
              title="Mode 1 : Relier tous les circuits en 1 clic dans l'ordre strict de numérotation (A1 ➔ A2 ➔ A3...) au chemin le plus court"
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Dans l'ordre (1➔2➔3)</span>
            </button>

            <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

            <button
              onClick={() => autoWireAllCircuits(undefined, 'shortest')}
              className="px-2.5 py-1 rounded text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-emerald-500/25 to-teal-500/25 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-300 border border-emerald-400/60 shadow-xs"
              title="Mode 2 : Relier tous les circuits en 1 clic au chemin le plus court sans contrainte d'ordre pour économiser le maximum de câble (Éco-Câble)"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>2. Au + court (Éco-Câble)</span>
            </button>
          </div>

          <button
            onClick={() => {
              setActiveTool('eraser');
              setWireStartPoint(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Gomme : Cliquez sur une ligne pour l'effacer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Gomme</span>
          </button>

          <button
            onClick={() => {
              setActiveTool('pan');
              setWireStartPoint(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              activeTool === 'pan'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Déplacer (Pan)"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Step Back (Undo/Reculer) & Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={currentWires.length === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              currentWires.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400/40'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
            title="Reculer en arrière pour supprimer la dernière ligne tracée (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Reculer</span>
            {currentWires.length > 0 && (
              <span className="bg-amber-800/80 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {currentWires.length}
              </span>
            )}
          </button>

          <button
            onClick={handleRedo}
            disabled={currentHistoryIndex >= currentHistory.length - 1}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {currentWires.length > 0 && (
            <button
              onClick={handleClearAllWires}
              className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 rounded-xl border border-rose-800/40 transition-colors cursor-pointer"
              title="Supprimer toutes les lignes de cette page"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {pdfBackground && (
            <>
              {/* Fullscreen Mode Button */}
              <button
                onClick={toggleFullscreen}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isFullscreen
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white ring-2 ring-cyan-300 shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700'
                }`}
                title={isFullscreen ? 'Quitter le mode plein écran (Échap)' : 'Afficher le plan en plein écran'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Quitter plein écran</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Plein écran</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportAnnotatedPlan}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ml-1"
                title="Télécharger le schéma annoté en PNG haute résolution"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger le plan</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2a. TGBT PLACEMENT ACTIVE GUIDANCE BANNER */}
      {activeTool === 'place_tgbt' && (
        <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-bold shadow-lg z-30 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow">
              <Server className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div>
              <span className="font-black uppercase tracking-wide text-slate-950">
                📍 Mode Placement TGBT : Cliquez sur le plan pour poser le Tableau Général
              </span>
              <p className="text-[11px] text-slate-900/90 font-medium">
                Tous les câbles d’alimentation (Circuit A, B, C...) partiront de cet emplacement.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTool('wire');
              setPendingAutoWire(null);
              showToast('Mode placement TGBT désactivé');
            }}
            className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 rounded-xl text-xs font-black cursor-pointer transition-transform active:scale-95 shadow-md flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </button>
        </div>
      )}

      {/* 2. WARNING BANNER: IF CURRENT CIRCUIT >= 8 POINTS */}
      {isCircuitOverLimit && (
        <div className="w-full bg-red-950 border-b-2 border-red-600 px-4 py-2 flex items-center justify-between text-xs text-red-200 gap-3 animate-pulse shadow-inner z-20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="font-bold text-white uppercase tracking-wide">
                ⚠️ Alerte RGIE / NF C 15-100 : Circuit {activeColorDef.code} ({activeColorDef.name}) a atteint la limite de 8 points ({activeCircuitDetail.breakdownText}) !
              </span>
              <p className="text-[11px] text-red-300">
                Chaque circuit est réglementairement limité à <strong>8 points maximum</strong> (prises, interrupteurs ou mélange). Veuillez sélectionner une autre lettre de circuit.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedWireColor(nextAvailableCircuit.hex);
              showToast(`Circuit changé vers ${nextAvailableCircuit.code} - ${nextAvailableCircuit.name}`);
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer shrink-0 transition-transform active:scale-95"
          >
            <span>Passer au Circuit {nextAvailableCircuit.code}</span>
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white"
              style={{ backgroundColor: nextAvailableCircuit.hex }}
            />
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. THE 26 DISTINCT COLORS BAR (CIRCUITS DE A JUSQU'À Z) */}
      <div className="w-full bg-slate-950 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs gap-2 shrink-0 z-20 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Circuits (A à Z) :
          </span>

          <button
            onClick={() => setShowLocateCircuitModal(true)}
            className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
            title="Localiser tous les points d'un circuit en même temps"
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Localiser</span>
          </button>

          <button
            onClick={() => autoWireAllCircuits(undefined, 'ordered')}
            className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
            title="Relier tous les circuits en 1 clic dans l'ordre strict de numérotation (A1➔A2➔A3...) au plus court chemin"
          >
            <ListOrdered className="w-3 h-3 text-amber-400" />
            <span>1 Clic : Ordre (1➔2➔3)</span>
          </button>

          <button
            onClick={() => autoWireAllCircuits(undefined, 'shortest')}
            className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-emerald-500/25 to-teal-500/25 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-300 border border-emerald-400/60 text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0 transition-all shadow-xs"
            title="Relier tous les circuits en 1 clic au plus court chemin sans contrainte d'ordre (Éco-Câble)"
          >
            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            <span>1 Clic : Au + court (Éco)</span>
          </button>

          <div
            ref={colorScrollRef}
            className="flex items-center gap-1 overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-slate-700 flex-1"
          >
            {WIRE_A_TO_Z_COLORS.map(c => {
              const isSelected = selectedWireColor === c.hex;
              const detail = circuitDetailsMap[c.code] || {
                total: 0,
                breakdownText: '0 point',
                isMixed: false,
              };
              const points = detail.total;
              const isOver8 = points >= 8;

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    const prefixWires = currentWires.filter(w => w.circuitCode === c.code);
                    const currentPts = prefixWires.length;
                    const startNum = currentPts === 0 ? 1 : Math.min(8, currentPts + 1);
                    const nextNum = Math.min(8, startNum + 1);

                    setSelectedWireColor(c.hex);
                    if (activeTool !== 'wire') setActiveTool('wire');
                    setWireStartPoint(null);
                    setSequenceGuide({
                      active: true,
                      prefix: c.code,
                      currentNum: startNum,
                      nextNum: nextNum,
                      currentCode: `${c.code}${startNum}`,
                      nextCode: `${c.code}${nextNum}`,
                    });
                    showToast(`🎯 Circuit ${c.code} activé ! Démarrez au point ${c.code}${startNum} (max 8 points).`);
                    if (isOver8) {
                      showToast(`⚠️ Circuit ${c.code} a atteint la limite de 8 points (${detail.breakdownText}) !`, true);
                    }
                  }}
                  className={`h-7 px-2.5 rounded-lg font-mono text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 relative ${
                    isOver8
                      ? 'ring-2 ring-red-500 animate-pulse text-white shadow-md'
                      : isSelected
                      ? 'ring-2 ring-white scale-105 shadow-md text-white'
                      : 'opacity-80 hover:opacity-100 hover:scale-102 text-white/90'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`${c.code} - ${c.name} : ${points}/8 points (${detail.breakdownText})`}
                >
                  <span className="font-extrabold">{c.code}</span>
                  {points > 0 && (
                    <span className={`text-[9px] px-1 rounded-full font-sans ${isOver8 ? 'bg-red-950 text-red-200 font-extrabold' : 'bg-black/30 text-white'}`}>
                      {points}/8
                    </span>
                  )}
                  {isOver8 && (
                    <span className="text-[9px] bg-red-600 text-white px-1 rounded-full font-bold">
                      MAX
                    </span>
                  )}
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px]">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedWireColor }}
            />
            <span className="font-bold text-white">Circuit {activeColorDef.code}</span>
            <span className="text-slate-300 font-mono font-bold">
              ({activeCircuitPoints}/8 pts)
            </span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">
              [{activeCircuitDetail.breakdownText}]
            </span>
            {isCircuitOverLimit && (
              <span className="text-red-400 font-bold text-[10px] bg-red-950 px-1.5 py-0.5 rounded border border-red-800 animate-pulse">
                ⚠️ PLEIN (MAX 8)
              </span>
            )}
          </div>

          {/* Zoom & Fit controls */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => fitToScreen()}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Ajuster la page entière à l'écran (100% visible)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Ajuster</span>
            </button>

            <button
              onClick={() => fitWidth()}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Ajuster à la largeur de l'écran"
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Largeur</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <button
              onClick={() => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = rect.width / 2;
                const mouseY = rect.height / 2;
                const newZoom = Math.max(15, zoom - 15);
                const oldScale = zoom / 100;
                const newScale = newZoom / 100;
                const newPanX = mouseX - (mouseX - pan.x) * (newScale / oldScale);
                const newPanY = mouseY - (mouseY - pan.y) * (newScale / oldScale);
                setZoom(newZoom);
                setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
              }}
              className="p-1 hover:text-white text-slate-400 cursor-pointer"
              title="Zoom arrière (-)"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setZoom(100);
                fitToScreen();
              }}
              className="font-mono text-[10px] text-slate-300 hover:text-cyan-300 w-9 text-center font-bold cursor-pointer"
              title="Réinitialiser zoom"
            >
              {zoom}%
            </button>
            <button
              onClick={() => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = rect.width / 2;
                const mouseY = rect.height / 2;
                const newZoom = Math.min(300, zoom + 15);
                const oldScale = zoom / 100;
                const newScale = newZoom / 100;
                const newPanX = mouseX - (mouseX - pan.x) * (newScale / oldScale);
                const newPanY = mouseY - (mouseY - pan.y) * (newScale / oldScale);
                setZoom(newZoom);
                setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
              }}
              className="p-1 hover:text-white text-slate-400 cursor-pointer"
              title="Zoom avant (+)"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE / CANVAS AREA (AVEC CURSEUR ROUGE ET TRACÉ SUR PLAN) */}
      <main
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
        onMouseLeave={() => {
          setIsPanning(false);
          setDraggedCurveWireId(null);
        }}
        style={{
          cursor:
            isPanning
              ? 'grabbing'
              : isSpacePressed || activeTool === 'pan'
              ? 'grab'
              : activeTool === 'eraser'
              ? (isCursorInsidePlan ? 'not-allowed' : 'default')
              : activeTool === 'place_tgbt'
              ? (isCursorInsidePlan ? 'crosshair' : 'default')
              : isCursorInsidePlan && activeTool === 'wire'
              ? `url("${redCrosshairCursorSvg}") 16 16, crosshair`
              : 'default',
        }}
        className="flex-1 w-full h-full relative overflow-hidden bg-[#1e293b] select-none"
      >
        {/* Quick Fullscreen invitation banner after file upload */}
        {showFullscreenPrompt && !isFullscreen && pdfBackground && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-400/80 px-4 py-2.5 rounded-2xl shadow-2xl text-xs animate-bounce">
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100">Fichier chargé ! Activer le mode plein écran ?</span>
            <button
              onClick={() => {
                toggleFullscreen();
                setShowFullscreenPrompt(false);
              }}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl cursor-pointer shadow-md transition-transform active:scale-95 ml-1"
            >
              Plein écran
            </button>
            <button
              onClick={() => setShowFullscreenPrompt(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
              title="Masquer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Localiser circuit HUD banner (quand un circuit comme K est localisé) */}
        {locateCircuitLetter && pdfBackground && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border-2 border-amber-400 px-4 py-1.5 rounded-full shadow-2xl text-xs">
              <span className="flex items-center gap-1.5 font-black text-amber-400">
                <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Circuit {locateCircuitLetter} :</span>
              </span>

              <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-amber-400/60">
                {locatedCircuitPoints.length} point{locatedCircuitPoints.length > 1 ? 's' : ''} signalés en même temps
              </span>

              {locatedCircuitPoints.length > 0 && (
                <span className="font-mono text-slate-300 hidden md:inline text-[11px]">
                  [{locatedCircuitPoints.map(p => p.code).join(', ')}]
                </span>
              )}

              <button
                onClick={() => {
                  const matchingColor = WIRE_A_TO_Z_COLORS.find(c => c.code === locateCircuitLetter);
                  if (matchingColor) setSelectedWireColor(matchingColor.hex);
                  if (activeTool !== 'wire') setActiveTool('wire');
                  setWireStartPoint(null);
                  setSequenceGuide({
                    active: true,
                    prefix: locateCircuitLetter,
                    currentNum: 1,
                    nextNum: 2,
                    currentCode: `${locateCircuitLetter}1`,
                    nextCode: `${locateCircuitLetter}2`,
                  });
                  showToast(`⚡ Prêt à relier le Circuit ${locateCircuitLetter} !`);
                }}
                className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/50 font-bold rounded-lg cursor-pointer transition-transform active:scale-95 shadow-xs"
              >
                Guider {locateCircuitLetter}
              </button>

              <button
                onClick={() => autoWireAllCircuits(locateCircuitLetter, 'ordered')}
                className="px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-lg cursor-pointer transition-transform active:scale-95 shadow-xs flex items-center gap-1"
                title={`Relier automatiquement tous les points du Circuit ${locateCircuitLetter} en 1 clic dans l'ordre 1➔2➔3... au chemin le plus court`}
              >
                <ListOrdered className="w-3 h-3 text-slate-950" />
                <span>Câbler {locateCircuitLetter} : Dans l'ordre</span>
              </button>

              <button
                onClick={() => autoWireAllCircuits(locateCircuitLetter, 'shortest')}
                className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black rounded-lg cursor-pointer transition-transform active:scale-95 shadow-xs flex items-center gap-1"
                title={`Relier automatiquement tous les points du Circuit ${locateCircuitLetter} en 1 clic au chemin le plus court (Éco-Câble)`}
              >
                <Zap className="w-3 h-3 fill-slate-950 text-slate-950" />
                <span>Câbler {locateCircuitLetter} : Au + court</span>
              </button>

              <button
                onClick={() => centerOnCircuit(locateCircuitLetter)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
                title="Recentrer la vue sur tous les points"
              >
                Recentrer
              </button>

              <button
                onClick={() => setShowLocateCircuitModal(true)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg cursor-pointer"
              >
                Changer ▾
              </button>

              <button
                onClick={() => setLocateCircuitLetter(null)}
                className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer ml-1"
                title="Fermer la localisation"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Sequence guidance HUD bar */}
        {sequenceGuide.active && pdfBackground && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-amber-500/70 px-3.5 py-1.5 rounded-full shadow-2xl text-xs">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Target className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Circuit {sequenceGuide.prefix} :</span>
              </span>

              {!wireStartPoint && currentStartSymbol ? (
                <span className="bg-emerald-600/40 text-emerald-300 px-2.5 py-0.5 rounded font-mono font-bold border border-emerald-400/80 ring-2 ring-emerald-400/30 animate-pulse flex items-center gap-1">
                  ⭐ Départ : {sequenceGuide.prefix}1 (1/8)
                </span>
              ) : (
                <span className="bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/50">
                  {sequenceGuide.currentCode} ✓
                </span>
              )}

              <ArrowRight className="w-3 h-3 text-slate-400" />

              <span className="bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded font-mono font-bold border border-amber-400/80 ring-2 ring-amber-400/40 animate-pulse flex items-center gap-1">
                ⭐ Cible : {sequenceGuide.nextCode} ({sequenceGuide.nextNum}/8)
              </span>

              {(nextTargetSymbol || currentStartSymbol) && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const target = (!wireStartPoint && currentStartSymbol) ? currentStartSymbol : nextTargetSymbol;
                    if (target) {
                      handleCenterOnPoint(target, (!wireStartPoint && currentStartSymbol) ? `${sequenceGuide.prefix}1` : sequenceGuide.nextCode);
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1"
                  title={`Centrer la vue`}
                >
                  <Navigation className="w-3 h-3" />
                  <span>Viser {(!wireStartPoint && currentStartSymbol) ? `${sequenceGuide.prefix}1` : sequenceGuide.nextCode}</span>
                </button>
              )}

              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowSequenceSelector(prev => !prev);
                }}
                className="text-slate-300 hover:text-white px-1.5 py-0.5 hover:bg-slate-800 rounded text-[11px] font-medium cursor-pointer"
              >
                Changer ▾
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  setSequenceGuide(prev => ({ ...prev, active: false }));
                  showToast('Guidage séquentiel masqué');
                }}
                className="text-slate-400 hover:text-rose-300 text-xs px-1 hover:bg-slate-800 rounded cursor-pointer ml-1"
              >
                ✕
              </button>
            </div>

            {showSequenceSelector && (
              <div
                onClick={e => e.stopPropagation()}
                className="mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md w-72 text-slate-200"
              >
                <div className="text-[11px] font-bold text-amber-300 mb-2 flex items-center gap-1">
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Choisir le Circuit à séquencer (A à Z) :</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto mb-2.5 p-1 bg-slate-950/60 rounded">
                  {WIRE_A_TO_Z_COLORS.map(c => (
                    <button
                      key={c.code}
                      onClick={() => {
                        const newPrefix = c.code;
                        setSelectedWireColor(c.hex);
                        setSequenceGuide({
                          active: true,
                          prefix: newPrefix,
                          currentNum: 1,
                          nextNum: 2,
                          currentCode: `${newPrefix}1`,
                          nextCode: `${newPrefix}2`,
                        });
                        setShowSequenceSelector(false);
                        showToast(`🎯 Séquence active sur Circuit ${newPrefix} (${newPrefix}1 ➔ ${newPrefix}2)`);
                      }}
                      className={`h-7 rounded font-bold text-xs flex items-center justify-center cursor-pointer transition-all ${
                        sequenceGuide.prefix === c.code
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-white shadow-xs'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dropzone panel if no PDF is loaded */}
        {!pdfBackground && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
            <div
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) handleProcessFile(e.dataTransfer.files[0]);
              }}
              onDragOver={e => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              className={`max-w-lg w-full bg-slate-800/90 border-2 border-dashed rounded-3xl p-8 text-center backdrop-blur-md shadow-2xl transition-all ${
                isDragOver ? 'border-red-500 bg-red-950/40 scale-[1.02]' : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-4 shadow-inner">
                {isLoadingPdf ? (
                  <div className="w-8 h-8 border-3 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                {isLoadingPdf ? 'Chargement du fichier PDF...' : 'Téléchargez votre Schéma de Position PDF'}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Importez votre plan PDF pour tracer les liaisons des circuits (A à Z), aimanter automatiquement les points et vérifier la règle des 8 points maximum.
              </p>

              {pdfError && (
                <div className="p-3 mb-4 bg-rose-950/60 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{pdfError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Sélectionner mon PDF</span>
                </button>

                <button
                  onClick={handleLoadSampleBlueprint}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold border border-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tester avec le plan exemple</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SVG Drawing Layer over PDF */}
        <svg
          className="w-full h-full overflow-visible pointer-events-auto"
          style={{ overflow: 'visible', width: '100%', height: '100%' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y})`}>
            {/* Blueprint sheet background */}
          {pdfBackground && (
            <g>
              <rect
                x={0}
                y={0}
                width={sheetWidth}
                height={sheetHeight}
                fill="#ffffff"
                stroke="#64748b"
                strokeWidth="1.5"
                rx="4"
              />

              {pdfBackground.pageImages[currentPage - 1] && (
                <image
                  href={pdfBackground.pageImages[currentPage - 1]}
                  x={0}
                  y={0}
                  width={sheetWidth}
                  height={sheetHeight}
                  opacity={pdfBackground.opacity || 0.85}
                  preserveAspectRatio="xMidYMid meet"
                />
              )}
            </g>
          )}

          {/* Render Symbols on Plan */}
          {currentSymbols.map(sym => {
            const sx = sym.x * scaleFactor;
            const sy = sym.y * scaleFactor;
            const isTargeted = activeSnapTarget?.id === sym.id;
            const isTgbt =
              sym.type === 'panel' ||
              sym.id === 'TGBT' ||
              (sym.label && sym.label.toUpperCase().includes('TGBT'));

            if (isTgbt) {
              return (
                <g
                  key={sym.id}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast(`📍 Tableau Général TGBT positionné à (X: ${Math.round(sym.x)}, Y: ${Math.round(sym.y)}). Cliquez sur 'Placer TGBT' pour le déplacer.`);
                  }}
                >
                  {/* Glowing halo */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={36 * scaleFactor}
                    fill="rgba(245, 158, 11, 0.15)"
                    stroke="rgba(245, 158, 11, 0.5)"
                    strokeWidth={2 * scaleFactor}
                    strokeDasharray="4,4"
                    className="animate-pulse"
                  />

                  {/* Main Electrical Enclosure Box */}
                  <rect
                    x={sx - 30 * scaleFactor}
                    y={sy - 20 * scaleFactor}
                    width={60 * scaleFactor}
                    height={40 * scaleFactor}
                    rx={6 * scaleFactor}
                    fill="#0f172a"
                    stroke="#f59e0b"
                    strokeWidth={2.5 * scaleFactor}
                  />

                  {/* Top Bar Header */}
                  <rect
                    x={sx - 30 * scaleFactor}
                    y={sy - 20 * scaleFactor}
                    width={60 * scaleFactor}
                    height={13 * scaleFactor}
                    rx={4 * scaleFactor}
                    fill="#f59e0b"
                  />

                  {/* Header Title */}
                  <text
                    x={sx}
                    y={sy - 10 * scaleFactor}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize={9 * scaleFactor}
                    fontWeight="900"
                    fontFamily="sans-serif"
                    letterSpacing="1"
                  >
                    ⚡ TGBT
                  </text>

                  {/* Lightning symbol in middle */}
                  <path
                    d={`M ${sx - 3 * scaleFactor} ${sy + 2 * scaleFactor} L ${sx + 2 * scaleFactor} ${sy - 5 * scaleFactor} L ${sx} ${sy + 2 * scaleFactor} L ${sx + 4 * scaleFactor} ${sy + 2 * scaleFactor} L ${sx - 1 * scaleFactor} ${sy + 10 * scaleFactor} L ${sx + 1 * scaleFactor} ${sy + 4 * scaleFactor} Z`}
                    fill="#f59e0b"
                  />

                  {/* Subtext label */}
                  <text
                    x={sx}
                    y={sy + 31 * scaleFactor}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize={8.5 * scaleFactor}
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    Départ Général
                  </text>
                </g>
              );
            }

            return (
              <g key={sym.id} className="cursor-pointer">
                {isTargeted && (
                  <circle
                    cx={sx}
                    cy={sy}
                    r={(sym.radius + 8) * scaleFactor}
                    fill="rgba(16, 185, 129, 0.15)"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4,3"
                    className="animate-spin"
                  />
                )}

                {/* Transparent hit area for magnetic snap & clicking - no black circle, no inverted T */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={(sym.radius || 20) * scaleFactor}
                  fill="transparent"
                  stroke="none"
                />
              </g>
            );
          })}

          {/* TGBT Placement Ghost / Live Target Preview */}
          {activeTool === 'place_tgbt' && isCursorInsidePlan && (
            <g transform={`translate(${activeCursor.x * scaleFactor}, ${activeCursor.y * scaleFactor})`} className="pointer-events-none">
              <circle r={36 * scaleFactor} fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4,3" className="animate-spin" />
              <rect x={-30 * scaleFactor} y={-20 * scaleFactor} width={60 * scaleFactor} height={40 * scaleFactor} rx={6 * scaleFactor} fill="rgba(15, 23, 42, 0.9)" stroke="#f59e0b" strokeWidth={2.5 * scaleFactor} />
              <rect x={-30 * scaleFactor} y={-20 * scaleFactor} width={60 * scaleFactor} height={13 * scaleFactor} rx={4 * scaleFactor} fill="#f59e0b" />
              <text x={0} y={-10 * scaleFactor} textAnchor="middle" fill="#0f172a" fontSize={9 * scaleFactor} fontWeight="900" fontFamily="sans-serif">⚡ TGBT</text>
              <text x={0} y={32 * scaleFactor} textAnchor="middle" fill="#fbbf24" fontSize={9 * scaleFactor} fontWeight="bold" fontFamily="sans-serif">Cliquez pour poser</text>
            </g>
          )}

          {/* Render Drawn Wires */}
          {currentWires.map((wire, idx) => {
            const x1 = wire.p1.x * scaleFactor;
            const y1 = wire.p1.y * scaleFactor;
            const x2 = wire.p2.x * scaleFactor;
            const y2 = wire.p2.y * scaleFactor;

            const style = wire.wireStyle || 'curve';
            const cp = wire.controlPoint || generateWirePath(wire.p1, wire.p2, style, wire.invertCurve, allObstacles).controlPoint;
            const cx = cp.x * scaleFactor;
            const cy = cp.y * scaleFactor;

            let pathD = '';
            if (style === 'freehand' && wire.points && wire.points.length >= 2) {
              pathD = pointsToSmoothSvgPath(wire.points.map(p => ({ x: p.x * scaleFactor, y: p.y * scaleFactor })));
            } else if (style === 'straight') {
              pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
            } else if (style === 'orthogonal') {
              pathD = `M ${x1} ${y1} L ${cx} ${cy} L ${x2} ${y2}`;
            } else {
              pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
            }

            return (
              <g key={wire.id || idx} className="group cursor-pointer">
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                  onClick={e => {
                    e.stopPropagation();
                    if (activeTool === 'eraser') {
                      updateWires(currentWires.filter(w => w.id !== wire.id));
                      showToast('Ligne effacée');
                    } else if (!wireStartPoint) {
                      handleCycleWireStyle(wire.id, e);
                    }
                  }}
                />

                <path
                  d={pathD}
                  fill="none"
                  stroke={wire.color}
                  strokeWidth="1.5"
                  strokeDasharray="5,3"
                  strokeLinecap="round"
                  className="transition-opacity group-hover:opacity-100"
                  opacity="0.95"
                />

                <circle cx={x1} cy={y1} r="2" fill={wire.color} />
                <circle cx={x2} cy={y2} r="2" fill={wire.color} />

                <circle
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  fill="#ffffff"
                  stroke={wire.color}
                  strokeWidth="2"
                  className={`${draggedCurveWireId === wire.id ? 'opacity-100 scale-125 ring-2 ring-red-400' : 'opacity-0 group-hover:opacity-100'} transition-all cursor-pointer`}
                  onMouseDown={e => {
                    e.stopPropagation();
                    setDraggedCurveWireId(wire.id);
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    handleCycleWireStyle(wire.id, e);
                  }}
                >
                  <title>Cliquez pour changer le type de tracé (Courbe / Droit / Angle 90°) ou glissez pour ajuster la courbure</title>
                </circle>
              </g>
            );
          })}

          {/* Live Preview Wire - UNIQUEMENT DANS LE PLAN */}
          {activeTool === 'wire' && wireStartPoint && livePreviewCurve && isCursorInsidePlan && (() => {
            const x1 = wireStartPoint.x * scaleFactor;
            const y1 = wireStartPoint.y * scaleFactor;
            const x2 = activeCursor.x * scaleFactor;
            const y2 = activeCursor.y * scaleFactor;
            const cx = livePreviewCurve.controlPoint.x * scaleFactor;
            const cy = livePreviewCurve.controlPoint.y * scaleFactor;

            const effectiveStyle = (wireStyle === 'auto' ? livePreviewCurve.chosenStyle : wireStyle) || 'curve';
            let pathD = '';
            if (wireStyle === 'freehand') {
              const livePts = [wireStartPoint, ...freehandPoints, activeCursor];
              pathD = pointsToSmoothSvgPath(livePts.map(p => ({ x: p.x * scaleFactor, y: p.y * scaleFactor })));
            } else if (effectiveStyle === 'straight') {
              pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
            } else if (effectiveStyle === 'orthogonal') {
              pathD = `M ${x1} ${y1} L ${cx} ${cy} L ${x2} ${y2}`;
            } else {
              pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
            }

            return (
              <g className="pointer-events-none">
                <circle
                  cx={x1}
                  cy={y1}
                  r="7"
                  fill="none"
                  stroke={selectedWireColor}
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.75"
                />
                <circle cx={x1} cy={y1} r="2" fill={selectedWireColor} />

                <path
                  d={pathD}
                  fill="none"
                  stroke={selectedWireColor}
                  strokeWidth="1.5"
                  strokeDasharray="5,3"
                  strokeLinecap="round"
                  opacity="0.95"
                />

                <circle cx={x2} cy={y2} r="2" fill={selectedWireColor} />

                {activeSnapTarget && (
                  <g>
                    <circle
                      cx={x2}
                      cy={y2}
                      r="12"
                      fill="#10b981"
                      fillOpacity="0.12"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="3,2"
                    />
                    <circle cx={x2} cy={y2} r="2" fill="#10b981" />
                    <g transform={`translate(${x2}, ${y2 - 20})`}>
                      <rect
                        x="-55"
                        y="-9"
                        width="110"
                        height="18"
                        rx="4"
                        fill="#064e3b"
                        stroke="#34d399"
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        🧲 Aimanté : {activeSnapTarget.label || 'Borne'}
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })()}

          {/* Simultaneous Signaling for "Localiser circuit" (ex: K1, K2, K3... K8 signalés en même temps) */}
          {locateCircuitLetter && locatedCircuitPoints.length > 0 && (() => {
            const matchingColor = WIRE_A_TO_Z_COLORS.find(c => c.code === locateCircuitLetter);
            const hexColor = matchingColor ? matchingColor.hex : '#f59e0b';

            const polylinePoints = locatedCircuitPoints
              .map(p => `${p.x * scaleFactor},${p.y * scaleFactor}`)
              .join(' ');

            return (
              <g className="pointer-events-none">
                {/* Constellation line connecting K1 -> K2 -> K3 -> K4... in sequence */}
                {locatedCircuitPoints.length >= 2 && (
                  <g>
                    <polyline
                      points={polylinePoints}
                      fill="none"
                      stroke={hexColor}
                      strokeWidth="6"
                      strokeOpacity="0.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={polylinePoints}
                      fill="none"
                      stroke={hexColor}
                      strokeWidth="2.5"
                      strokeDasharray="8,6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-pulse"
                    />
                  </g>
                )}

                {/* Simultaneous beacon and radar pulse for EVERY point of the circuit */}
                {locatedCircuitPoints.map((pt, pIdx) => {
                  const sx = pt.x * scaleFactor;
                  const sy = pt.y * scaleFactor;
                  const rad = DETECTION_RADIUS_1CM * scaleFactor;

                  return (
                    <g key={`locate_${pt.code}_${pIdx}`}>
                      {/* Outer spinning radar circle */}
                      <circle
                        cx={sx}
                        cy={sy}
                        r={rad + 26}
                        fill="none"
                        stroke={hexColor}
                        strokeWidth="2"
                        strokeDasharray="5,4"
                        className="animate-spin"
                        style={{ animationDuration: '4s', transformOrigin: `${sx}px ${sy}px` }}
                      />
                      {/* Expanding pulse wave */}
                      <circle
                        cx={sx}
                        cy={sy}
                        r={rad + 16}
                        fill={hexColor}
                        fillOpacity="0.2"
                        stroke={hexColor}
                        strokeWidth="2.5"
                        className="animate-ping"
                        style={{ animationDuration: '1.6s', transformOrigin: `${sx}px ${sy}px` }}
                      />
                      {/* Solid focus ring */}
                      <circle
                        cx={sx}
                        cy={sy}
                        r={rad + 6}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                      {/* Center dot */}
                      <circle
                        cx={sx}
                        cy={sy}
                        r={4}
                        fill={hexColor}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />

                      {/* Prominent floating badge on each point: ⭐ K1, ⭐ K2... */}
                      <g transform={`translate(${sx}, ${sy - rad - 22})`}>
                        <rect
                          x="-42"
                          y="-13"
                          width="84"
                          height="26"
                          rx="13"
                          fill="#090d16"
                          stroke={hexColor}
                          strokeWidth="2"
                          filter="drop-shadow(0 4px 10px rgba(0,0,0,0.7))"
                        />
                        <circle cx="-28" cy="0" r="3.5" fill="#10b981" className="animate-ping" />
                        <circle cx="-28" cy="0" r="3" fill="#10b981" />
                        <text
                          x="6"
                          y="4"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="900"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          ⭐ {pt.code}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* Signal for Starting Point 1 (e.g. L1, A1, B1...) when wire has not yet started */}
          {sequenceGuide.active && !wireStartPoint && currentStartSymbol && (() => {
            const sx = currentStartSymbol.x * scaleFactor;
            const sy = currentStartSymbol.y * scaleFactor;
            const rad = (currentStartSymbol.radius || 20) * scaleFactor;

            return (
              <g className="pointer-events-none">
                <circle
                  cx={sx}
                  cy={sy}
                  r={rad + 32}
                  fill="rgba(16, 185, 129, 0.15)"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  className="animate-spin"
                  style={{ animationDuration: '4s', transformOrigin: `${sx}px ${sy}px` }}
                />
                <circle
                  cx={sx}
                  cy={sy}
                  r={rad + 18}
                  fill="rgba(16, 185, 129, 0.2)"
                  stroke="#10b981"
                  strokeWidth="3"
                  className="animate-ping"
                  style={{ animationDuration: '1.5s', transformOrigin: `${sx}px ${sy}px` }}
                />
                <circle
                  cx={sx}
                  cy={sy}
                  r={rad + 8}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="3"
                  className="animate-pulse"
                />

                <g transform={`translate(${sx}, ${sy - rad - 26})`}>
                  <rect
                    x="-92"
                    y="-14"
                    width="184"
                    height="28"
                    rx="14"
                    fill="#090d16"
                    stroke="#10b981"
                    strokeWidth="2"
                    filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))"
                  />
                  <circle cx="-74" cy="0" r="4.5" fill="#10b981" className="animate-ping" />
                  <circle cx="-74" cy="0" r="3.5" fill="#10b981" />
                  <text
                    x="8"
                    y="4"
                    fill="#a7f3d0"
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    letterSpacing="0.5"
                  >
                    ⭐ DÉPART : {sequenceGuide.prefix}1 (1/8) ➔
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Sequence beacon & Directional Laser Tracer to Next Point (L1 -> L2 -> L3...) */}
          {sequenceGuide.active && nextTargetSymbol && (() => {
            const sx = nextTargetSymbol.x * scaleFactor;
            const sy = nextTargetSymbol.y * scaleFactor;
            const rad = (nextTargetSymbol.radius || 20) * scaleFactor;

            return (
              <g className="pointer-events-none">
                {/* 1. Directional Laser Guiding Beam from start point directly to target point */}
                {wireStartPoint && (
                  <g>
                    {/* Ambient laser glow */}
                    <line
                      x1={wireStartPoint.x * scaleFactor}
                      y1={wireStartPoint.y * scaleFactor}
                      x2={sx}
                      y2={sy}
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeOpacity="0.25"
                      strokeLinecap="round"
                    />
                    {/* Pulsing dashed guiding laser line */}
                    <line
                      x1={wireStartPoint.x * scaleFactor}
                      y1={wireStartPoint.y * scaleFactor}
                      x2={sx}
                      y2={sy}
                      stroke="#fbbf24"
                      strokeWidth="3"
                      strokeDasharray="8,6"
                      strokeLinecap="round"
                      className="animate-pulse"
                    />
                    {/* Midpoint directional badge */}
                    {(() => {
                      const midX = ((wireStartPoint.x * scaleFactor) + sx) / 2;
                      const midY = ((wireStartPoint.y * scaleFactor) + sy) / 2;
                      return (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-65"
                            y="-11"
                            width="130"
                            height="22"
                            rx="11"
                            fill="#0f172a"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                          />
                          <text
                            x="0"
                            y="4"
                            fill="#fef08a"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ➔ Relier vers {sequenceGuide.nextCode}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* 2. Rotating outer radar wave on target symbol */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={rad + 34}
                  fill="rgba(245, 158, 11, 0.12)"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  className="animate-spin"
                  style={{ animationDuration: '4s', transformOrigin: `${sx}px ${sy}px` }}
                />
                {/* 3. Expanding ping wave */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={rad + 20}
                  fill="rgba(16, 185, 129, 0.18)"
                  stroke="#10b981"
                  strokeWidth="3"
                  className="animate-ping"
                  style={{ animationDuration: '1.5s', transformOrigin: `${sx}px ${sy}px` }}
                />
                {/* 4. Solid target lock ring */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={rad + 8}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  className="animate-pulse"
                />

                {/* 5. Ultra-visible Floating Badge: ⭐ L2 EST ICI ➔ */}
                <g transform={`translate(${sx}, ${sy - rad - 26})`}>
                  <rect
                    x="-82"
                    y="-14"
                    width="164"
                    height="28"
                    rx="14"
                    fill="#090d16"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))"
                  />
                  <circle cx="-64" cy="0" r="4.5" fill="#10b981" className="animate-ping" />
                  <circle cx="-64" cy="0" r="3.5" fill="#10b981" />
                  <text
                    x="6"
                    y="4"
                    fill="#fef08a"
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    letterSpacing="0.5"
                  >
                    ⭐ {sequenceGuide.nextCode} EST ICI ➔
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Real-time high-visibility red crosshair cursor avec cercle de détection de 1 cm - UNIQUEMENT DANS LE PLAN */}
          {pdfBackground && isCursorInsidePlan && activeTool === 'wire' && (
            <g
              className="pointer-events-none"
              transform={`translate(${activeCursor.x * scaleFactor}, ${activeCursor.y * scaleFactor})`}
            >
              {/* Visual 1 cm diameter detection circle (radius 19px) */}
              <circle
                cx="0"
                cy="0"
                r={DETECTION_RADIUS_1CM * scaleFactor}
                fill="rgba(220, 38, 38, 0.05)"
                stroke="#dc2626"
                strokeWidth="1"
                strokeDasharray="3,2"
                strokeOpacity="0.4"
              />

              <line x1="-14" y1="0" x2="-4" y2="0" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <line x1="4" y1="0" x2="14" y2="0" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <line x1="0" y1="-14" x2="0" y2="-4" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <line x1="0" y1="4" x2="0" y2="14" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

              <line x1="-14" y1="0" x2="-4" y2="0" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="4" y1="0" x2="14" y2="0" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="0" y1="-14" x2="0" y2="-4" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="0" y1="4" x2="0" y2="14" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />

              <circle cx="0" cy="0" r="2" fill="#dc2626" stroke="#ffffff" strokeWidth="0.8" />
            </g>
          )}

          {/* Magnetic target hover ring calibré à 1 cm de diamètre */}
          {activeTool === 'wire' && !wireStartPoint && activeSnapTarget && isCursorInsidePlan && (
            <g className="pointer-events-none">
              <circle
                cx={activeCursor.x * scaleFactor}
                cy={activeCursor.y * scaleFactor}
                r={DETECTION_RADIUS_1CM * scaleFactor}
                fill="#10b981"
                fillOpacity="0.15"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3,2"
              />
              <circle cx={activeCursor.x * scaleFactor} cy={activeCursor.y * scaleFactor} r="2" fill="#10b981" />
              <g transform={`translate(${activeCursor.x * scaleFactor}, ${activeCursor.y * scaleFactor - 20})`}>
                <rect x="-50" y="-8" width="100" height="16" rx="3" fill="#064e3b" stroke="#34d399" strokeWidth="0.8" />
                <text x="0" y="3" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                  🧲 {activeSnapTarget.label}
                </text>
              </g>
            </g>
          )}
          </g>
        </svg>

        {/* Floating Canvas Navigation & Zoom Bar */}
        {pdfBackground && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs">
            <button
              onClick={() => fitToScreen()}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/50 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Ajuster la page entière pour voir 100% du plan sans coupure"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ajuster</span>
            </button>

            {/* Toggle Fullscreen in floating controls */}
            <button
              onClick={toggleFullscreen}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isFullscreen
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 ring-2 ring-cyan-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
              }`}
              title={isFullscreen ? 'Quitter le mode plein écran (Échap)' : 'Passer en plein écran'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Quitter plein écran</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Plein écran</span>
                </>
              )}
            </button>

            <button
              onClick={() => fitWidth()}
              className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Ajuster à la largeur de l'écran"
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pleine Largeur</span>
            </button>

            <div className="h-5 w-px bg-slate-700 mx-0.5" />

            <button
              onClick={() => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = rect.width / 2;
                const mouseY = rect.height / 2;
                const newZoom = Math.max(15, zoom - 15);
                const oldScale = zoom / 100;
                const newScale = newZoom / 100;
                const newPanX = mouseX - (mouseX - pan.x) * (newScale / oldScale);
                const newPanY = mouseY - (mouseY - pan.y) * (newScale / oldScale);
                setZoom(newZoom);
                setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
              }}
              className="p-1.5 hover:text-white text-slate-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              title="Zoom arrière (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setZoom(100);
                fitToScreen();
              }}
              className="px-2 py-1 rounded-lg font-mono text-[11px] font-bold text-slate-200 hover:text-cyan-300 cursor-pointer"
              title="Réinitialiser le zoom"
            >
              {zoom}%
            </button>

            <button
              onClick={() => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = rect.width / 2;
                const mouseY = rect.height / 2;
                const newZoom = Math.min(300, zoom + 15);
                const oldScale = zoom / 100;
                const newScale = newZoom / 100;
                const newPanX = mouseX - (mouseX - pan.x) * (newScale / oldScale);
                const newPanY = mouseY - (mouseY - pan.y) * (newScale / oldScale);
                setZoom(newZoom);
                setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
              }}
              className="p-1.5 hover:text-white text-slate-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              title="Zoom avant (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-700 mx-0.5" />

            <button
              onClick={() => {
                setActiveTool(prev => prev === 'pan' ? 'wire' : 'pan');
                setWireStartPoint(null);
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'pan'
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-white/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Déplacer le plan (Main / Pan)"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{activeTool === 'pan' ? 'Déplacement' : 'Déplacer'}</span>
            </button>
          </div>
        )}

        {/* Floating Page Navigation Bar on Canvas for multi-page documents */}
        {pdfBackground && pdfBackground.totalPages > 1 && (
          <div className={`absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 backdrop-blur-md rounded-2xl px-4 py-2 text-xs transition-all duration-300 ${
            showPageAlert
              ? 'bg-slate-950/95 border-2 border-amber-400 shadow-2xl shadow-amber-500/30 text-amber-200 ring-2 ring-amber-400/50 animate-pulse'
              : 'bg-slate-900/90 border border-slate-700 shadow-xl text-slate-300'
          }`}>
            {showPageAlert && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
              </span>
            )}

            <span className="font-bold text-xs hidden sm:inline">Pages du Plan :</span>

            <button
              disabled={currentPage <= 1}
              onClick={() => {
                setPdfBackground({ ...pdfBackground, currentPage: currentPage - 1 });
                setWireStartPoint(null);
              }}
              className="p-1 hover:text-white text-slate-400 disabled:opacity-25 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg border ${
              showPageAlert 
                ? 'text-amber-300 bg-amber-950/80 border-amber-500/50 shadow-inner'
                : 'text-slate-200 bg-slate-800 border-slate-700'
            }`}>
              Page {currentPage} / {pdfBackground.totalPages}
            </span>

            <button
              disabled={currentPage >= pdfBackground.totalPages}
              onClick={() => {
                setPdfBackground({ ...pdfBackground, currentPage: currentPage + 1 });
                setWireStartPoint(null);
                setShowPageAlert(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                showPageAlert && currentPage < pdfBackground.totalPages
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/50 animate-bounce font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white disabled:opacity-25'
              }`}
              title="Page suivante (Cliquez ici pour changer de page)"
            >
              <span>Page suivante</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Floating status bar at the bottom */}
        {pdfBackground && (
          <div className="absolute bottom-3 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-slate-300 shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedWireColor }} />
              <span>Circuit {activeColorDef.code} : {activeColorDef.name}</span>
            </div>

            <span className="text-slate-600">|</span>

            <span>
              Points sur ce circuit :{' '}
              <strong className={`font-mono font-bold ${isCircuitOverLimit ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {activeCircuitPoints}/8 points {isCircuitOverLimit && '⚠️ (MAX 8 ATTEINT)'}
              </strong>
              <span className="ml-1.5 text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {activeCircuitDetail.breakdownText} (Max 8 points)
              </span>
            </span>

            <span className="text-slate-600">|</span>

            <span>
              Total fils : <strong className="text-amber-400 font-mono font-bold">{currentWires.length}</strong>
            </span>

            <span className="text-slate-600">|</span>

            <span className="flex items-center gap-1">
              <span className="text-slate-400">Liaison :</span>{' '}
              <strong className="text-amber-300 font-semibold">
                {wireStyle === 'auto'
                  ? '✨ Auto'
                  : wireStyle === 'freehand'
                  ? '✏️ Libre (main)'
                  : wireStyle === 'curve'
                  ? invertCurve ? 'Courbe inversée' : 'Courbe / Parabole'
                  : wireStyle === 'straight'
                  ? 'Rectiligne'
                  : 'Angle 90°'}
              </strong>
            </span>

            <span className="text-slate-600">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-extrabold text-[10px] uppercase">Relier 1 Clic :</span>
              <button
                onClick={() => autoWireAllCircuits(undefined, 'ordered')}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                title="Relier tous les circuits en 1 clic dans l'ordre (A1➔A2➔A3...)"
              >
                <ListOrdered className="w-3 h-3 text-amber-400" />
                <span>Dans l'ordre</span>
              </button>
              <button
                onClick={() => autoWireAllCircuits(undefined, 'shortest')}
                className="px-2 py-0.5 bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/50 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                title="Relier tous les circuits en 1 clic au plus court chemin sans contrainte d'ordre (Éco-Câble)"
              >
                <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                <span>Au + court</span>
              </button>
            </div>

            <span className="text-slate-600">|</span>

            <span className="text-[11px] text-slate-400 italic">
              💡 Clic sur un fil pour changer son type
            </span>

            {currentWires.length > 0 && (
              <>
                <span className="text-slate-600">|</span>
                <button
                  onClick={handleUndo}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  title="Supprimer la dernière ligne dessinée (Ctrl+Z)"
                >
                  ↩ Reculer (Ctrl+Z)
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* MODAL: LOCALISER CIRCUIT (A à Z) */}
      {showLocateCircuitModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowLocateCircuitModal(false)}
        >
          <div
            className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 shadow-2xl max-w-lg w-full text-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Localiser un circuit</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                      Signaler tous les points
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sélectionnez une lettre (A à Z) : tous ses points (ex: K1, K2... K8) seront signalés en même temps sur le plan.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLocateCircuitModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Circuit Letters Grid A to Z */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[340px] overflow-y-auto p-1">
              {WIRE_A_TO_Z_COLORS.map(c => {
                const count = currentSymbols.filter(s => {
                  const parsed = parseAlphaNumericCode(s.label || s.id);
                  return parsed && parsed.prefix === c.code;
                }).length + currentWires.filter(w => w.circuitCode === c.code).length * 2;

                const isCurrent = locateCircuitLetter === c.code;

                return (
                  <button
                    key={c.code}
                    onClick={() => {
                      setLocateCircuitLetter(c.code);
                      setShowLocateCircuitModal(false);
                      showToast(`📍 Circuit ${c.code} localisé ! Tous ses points sont signalés en même temps.`);
                      setTimeout(() => centerOnCircuit(c.code), 100);
                    }}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative border ${
                      isCurrent
                        ? 'ring-2 ring-amber-400 border-amber-300 scale-105 shadow-xl text-white bg-slate-800'
                        : 'border-slate-700/80 hover:border-slate-500 hover:scale-102 bg-slate-800/80 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-xs"
                      style={{ backgroundColor: c.hex }}
                    >
                      {c.code}
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-[65px]" title={c.name}>
                      {c.code}
                    </span>
                    {count > 0 ? (
                      <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-400/40">
                        {count} pt{count > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-500">0 pt</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Auto-wire actions in modal */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setShowLocateCircuitModal(false);
                    autoWireAllCircuits(undefined, 'ordered');
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl cursor-pointer transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
                  title="Mode 1 : Relier TOUS les circuits dans l'ordre strict de numérotation (A1➔A2➔A3...) au chemin le plus court"
                >
                  <ListOrdered className="w-4 h-4 text-slate-950" />
                  <span>⚡ Relier TOUT : Dans l'ordre (1➔2➔3)</span>
                </button>

                <button
                  onClick={() => {
                    setShowLocateCircuitModal(false);
                    autoWireAllCircuits(undefined, 'shortest');
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl cursor-pointer transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
                  title="Mode 2 : Relier TOUS les circuits au plus court chemin absolu sans contrainte d'ordre (Éco-Câble)"
                >
                  <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>🌿 Relier TOUT : Au + court (Éco)</span>
                </button>
              </div>

              {locateCircuitLetter ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const letter = locateCircuitLetter;
                      setShowLocateCircuitModal(false);
                      autoWireAllCircuits(letter, 'ordered');
                    }}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-400/50 font-bold cursor-pointer transition-colors flex items-center gap-1"
                    title={`Relier tous les points du Circuit ${locateCircuitLetter} dans l'ordre numérique`}
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
                    <span>Câbler {locateCircuitLetter} (Ordre)</span>
                  </button>

                  <button
                    onClick={() => {
                      const letter = locateCircuitLetter;
                      setShowLocateCircuitModal(false);
                      autoWireAllCircuits(letter, 'shortest');
                    }}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-400/50 font-bold cursor-pointer transition-colors flex items-center gap-1"
                    title={`Relier tous les points du Circuit ${locateCircuitLetter} au plus court chemin (Éco-Câble)`}
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>Câbler {locateCircuitLetter} (Éco)</span>
                  </button>

                  <button
                    onClick={() => {
                      setLocateCircuitLetter(null);
                      setShowLocateCircuitModal(false);
                      showToast('Localisation désactivée');
                    }}
                    className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-xl border border-rose-800/50 font-semibold cursor-pointer"
                  >
                    Désactiver
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMPLACEMENT DU TABLEAU TGBT (Départ des circuits) */}
      {showTgbtPlacementModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => {
            setShowTgbtPlacementModal(false);
            setPendingAutoWire(null);
          }}
        >
          <div
            className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <Server className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-1.5">
                    <span>Départ des circuits : Tableau TGBT</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chaque circuit est alimenté depuis le tableau général
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTgbtPlacementModal(false);
                  setPendingAutoWire(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
              <p className="leading-relaxed">
                Dans la réalité d’une installation électrique, tous les câbles d’alimentation (Circuit A, B, C...) <strong>partent obligatoirement du Tableau Général (TGBT)</strong> pour desservir les prises et lampes.
              </p>

              {currentTgbt ? (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">⚡</span>
                    <div>
                      <span className="font-bold text-amber-300 block">TGBT actuel identifié</span>
                      <span className="text-[11px] font-mono text-slate-300">
                        Position X: {Math.round(currentTgbt.x)}, Y: {Math.round(currentTgbt.y)}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                    ✓ Détecté
                  </span>
                </div>
              ) : (
                <div className="mt-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200">
                  <strong className="block text-red-300 font-bold">⚠️ Aucun Tableau TGBT sur ce plan</strong>
                  <p className="text-[11px] text-red-200/90 mt-1">
                    Veuillez désigner l’emplacement exact de votre tableau en cliquant sur le plan.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              {currentTgbt && (
                <button
                  onClick={() => {
                    setShowTgbtPlacementModal(false);
                    const target = pendingAutoWire || { mode: 'ordered' as const };
                    setPendingAutoWire(null);
                    executeAutoWire(currentTgbt, target.filterPrefix, target.mode);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>
                    ⚡ Démarrer depuis ce TGBT ({pendingAutoWire?.mode === 'shortest' ? 'Au + court / Éco' : 'Dans l’ordre 1➔2➔3'})
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowTgbtPlacementModal(false);
                  setActiveTool('place_tgbt');
                  showToast('📍 Cliquez sur le plan pour poser le Tableau TGBT');
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all ${
                  !currentTgbt
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {currentTgbt ? '📍 Déplacer / Pointer un nouvel endroit sur le plan' : '📍 Pointer l’emplacement du TGBT sur le plan'}
                </span>
              </button>

              {currentTgbt && (
                <label className="flex items-center gap-2 pt-2 text-[11px] text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={alwaysUseCurrentTgbt}
                    onChange={e => setAlwaysUseCurrentTgbt(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Mémoriser cette position (ne plus demander à chaque clic)</span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating toast notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.isWarning
              ? 'bg-red-950/95 border-2 border-red-500 text-red-100 ring-2 ring-red-400/40'
              : 'bg-slate-900/95 border border-emerald-500/60'
          }`}
        >
          {toastMessage.isWarning ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-semibold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};
