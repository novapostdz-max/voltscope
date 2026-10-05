/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, WireStyle } from '../types/plan';

export interface ObstaclePoint {
  id: string;
  x: number;
  y: number;
  radius: number;
  label?: string;
  type?: 'light' | 'switch' | 'socket' | 'panel' | 'terminal' | string;
}

export interface GeneratedWirePath {
  chosenStyle: WireStyle;
  chosenInvert: boolean;
  controlPoint: Point;
  curvature: number;
  pathD: string;
  explanation?: string;
}

/**
 * Calibrated 1 cm diameter detection circle (radius = 19px at standard 96 DPI screen resolution)
 */
export const DETECTION_RADIUS_1CM = 19;
export const DETECTION_DIAMETER_1CM = 38;

/**
 * Finds the nearest obstacle or symbol within calibrated 1 cm diameter detection zone
 */
export function findMagneticSnap(
  cursor: Point,
  obstacles: ObstaclePoint[],
  threshold = DETECTION_RADIUS_1CM
): { point: Point; target: ObstaclePoint | null; isSnapped: boolean } {
  let nearestTarget: ObstaclePoint | null = null;
  let minDistance = threshold;

  for (const obs of obstacles) {
    const d = Math.hypot(cursor.x - obs.x, cursor.y - obs.y);
    if (d <= threshold && d < minDistance) {
      minDistance = d;
      nearestTarget = obs;
    }
  }

  if (nearestTarget) {
    return {
      point: { x: nearestTarget.x, y: nearestTarget.y },
      target: nearestTarget,
      isSnapped: true,
    };
  }

  return {
    point: cursor,
    target: null,
    isSnapped: false,
  };
}

/**
 * Distance between a point and a line segment
 */
function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}

/**
 * Converts an array of freehand points to a smooth cubic/quadratic SVG path
 */
export function pointsToSmoothSvgPath(points: Point[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    const midX = (pCurrent.x + pNext.x) / 2;
    const midY = (pCurrent.y + pNext.y) / 2;
    d += ` Q ${pCurrent.x} ${pCurrent.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Calculates a clean obstacle-free curve between p1 and p2 avoiding obstacles in between
 */
export function calculateObstacleFreeCurve(
  p1: Point,
  p2: Point,
  obstacles: ObstaclePoint[] = [],
  preferredSide: 'auto' | 'left' | 'right' = 'auto',
  forceInvert = false
): { controlPoint: Point; curvature: number; pathD: string } {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 1;

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // Normal unit vector perpendicular to line
  let nx = -dy / dist;
  let ny = dx / dist;

  // Check obstacles between p1 and p2
  let leftConflict = 0;
  let rightConflict = 0;

  obstacles.forEach(obs => {
    // Ignore start and end points themselves
    if (Math.hypot(obs.x - p1.x, obs.y - p1.y) < (obs.radius + 12)) return;
    if (Math.hypot(obs.x - p2.x, obs.y - p2.y) < (obs.radius + 12)) return;

    const d = distToSegment(obs, p1, p2);
    if (d < (obs.radius + 30)) {
      // Determine which side of vector p1->p2 this obstacle lies on
      const cross = dx * (obs.y - p1.y) - dy * (obs.x - p1.x);
      if (cross > 0) {
        leftConflict += (obs.radius + 30) - d;
      } else {
        rightConflict += (obs.radius + 30) - d;
      }
    }
  });

  // Base curvature magnitude proportional to span distance
  let curveAmount = Math.min(65, Math.max(16, dist * 0.16));

  if (leftConflict > rightConflict) {
    // Obstacles are on the left, curve towards the right
    curveAmount = -curveAmount;
  } else if (rightConflict > leftConflict) {
    curveAmount = Math.abs(curveAmount);
  }

  if (forceInvert) {
    curveAmount = -curveAmount;
  }

  const cp = {
    x: midX + nx * curveAmount,
    y: midY + ny * curveAmount,
  };

  return {
    controlPoint: cp,
    curvature: curveAmount,
    pathD: `M ${p1.x} ${p1.y} Q ${cp.x} ${cp.y} ${p2.x} ${p2.y}`,
  };
}

/**
 * Generates the full wire path based on selected WireStyle
 */
export function generateWirePath(
  p1: Point,
  p2: Point,
  style: WireStyle = 'auto',
  invert = false,
  obstacles: ObstaclePoint[] = [],
  cursorHint?: Point,
  _unused?: any,
  existingPoints?: Point[]
): GeneratedWirePath {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 1;
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // 1. AUTO STYLE
  if (style === 'auto') {
    // Check if directly horizontal or vertical within tolerance
    const isNearlyHorizontal = Math.abs(dy) < 14;
    const isNearlyVertical = Math.abs(dx) < 14;

    if ((isNearlyHorizontal || isNearlyVertical) && dist < 180) {
      return {
        chosenStyle: 'straight',
        chosenInvert: false,
        controlPoint: { x: midX, y: midY },
        curvature: 0,
        pathD: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
        explanation: 'Alignement rectiligne direct',
      };
    }

    const naturalCurve = calculateObstacleFreeCurve(p1, p2, obstacles, 'auto', invert);
    return {
      chosenStyle: 'curve',
      chosenInvert: invert,
      controlPoint: naturalCurve.controlPoint,
      curvature: naturalCurve.curvature,
      pathD: naturalCurve.pathD,
      explanation: 'Courbe d’évitement naturel',
    };
  }

  // 2. STRAIGHT
  if (style === 'straight') {
    return {
      chosenStyle: 'straight',
      chosenInvert: false,
      controlPoint: { x: midX, y: midY },
      curvature: 0,
      pathD: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
    };
  }

  // 3. ORTHOGONAL (90° Corner)
  if (style === 'orthogonal') {
    let corner: Point;
    if (!invert) {
      corner = { x: p2.x, y: p1.y };
    } else {
      corner = { x: p1.x, y: p2.y };
    }
    return {
      chosenStyle: 'orthogonal',
      chosenInvert: invert,
      controlPoint: corner,
      curvature: 0,
      pathD: `M ${p1.x} ${p1.y} L ${corner.x} ${corner.y} L ${p2.x} ${p2.y}`,
    };
  }

  // 4. FREEHAND
  if (style === 'freehand') {
    if (existingPoints && existingPoints.length >= 2) {
      return {
        chosenStyle: 'freehand',
        chosenInvert: false,
        controlPoint: existingPoints[Math.floor(existingPoints.length / 2)] || { x: midX, y: midY },
        curvature: 0,
        pathD: pointsToSmoothSvgPath(existingPoints),
      };
    }
    return {
      chosenStyle: 'freehand',
      chosenInvert: false,
      controlPoint: { x: midX, y: midY },
      curvature: 0,
      pathD: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
    };
  }

  // 5. CURVE (Parabola)
  const curve = calculateObstacleFreeCurve(p1, p2, obstacles, 'auto', invert);
  return {
    chosenStyle: 'curve',
    chosenInvert: invert,
    controlPoint: curve.controlPoint,
    curvature: curve.curvature,
    pathD: curve.pathD,
  };
}

/**
 * Calculates the optimal shortest path between p1 and p2, minimizing cable length
 * while avoiding obstacles.
 * Favors a straight line (absolute shortest Euclidean distance) if no obstacle intersects.
 * If obstacles intersect, compares both curve directions and picks the one with minimum cable length and clearance.
 */
export function computeOptimalShortestPath(
  p1: Point,
  p2: Point,
  obstacles: ObstaclePoint[] = []
): GeneratedWirePath {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 1;
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // 1. Test straight line: check if any intermediate obstacle intersects the line segment
  let straightBlocked = false;
  for (const obs of obstacles) {
    // Ignore the endpoints themselves
    if (Math.hypot(obs.x - p1.x, obs.y - p1.y) < (obs.radius + 14)) continue;
    if (Math.hypot(obs.x - p2.x, obs.y - p2.y) < (obs.radius + 14)) continue;

    const d = distToSegment(obs, p1, p2);
    if (d < (obs.radius + 16)) {
      straightBlocked = true;
      break;
    }
  }

  // If the direct straight segment is completely clear, it is the shortest possible path (0 excess cable)
  if (!straightBlocked) {
    return {
      chosenStyle: 'straight',
      chosenInvert: false,
      controlPoint: { x: midX, y: midY },
      curvature: 0,
      pathD: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
      explanation: 'Chemin direct rectiligne le plus court (économie maximale de câble)',
    };
  }

  // 2. If blocked by an obstacle, evaluate both curve directions
  const curveNormal = calculateObstacleFreeCurve(p1, p2, obstacles, 'auto', false);
  const curveInvert = calculateObstacleFreeCurve(p1, p2, obstacles, 'auto', true);

  // Approximate arc length: L ≈ 0.5 * (dist + hypot(p1->cp) + hypot(p2->cp))
  const lenNormal = 0.5 * (dist + Math.hypot(curveNormal.controlPoint.x - p1.x, curveNormal.controlPoint.y - p1.y) + Math.hypot(p2.x - curveNormal.controlPoint.x, p2.y - curveNormal.controlPoint.y));
  const lenInvert = 0.5 * (dist + Math.hypot(curveInvert.controlPoint.x - p1.x, curveInvert.controlPoint.y - p1.y) + Math.hypot(p2.x - curveInvert.controlPoint.x, p2.y - curveInvert.controlPoint.y));

  // Count remaining conflicts for both
  const checkConflict = (cp: Point) => {
    let conf = 0;
    for (const obs of obstacles) {
      if (Math.hypot(obs.x - p1.x, obs.y - p1.y) < (obs.radius + 14)) continue;
      if (Math.hypot(obs.x - p2.x, obs.y - p2.y) < (obs.radius + 14)) continue;
      const d1 = distToSegment(obs, p1, cp);
      const d2 = distToSegment(obs, cp, p2);
      const minD = Math.min(d1, d2);
      if (minD < (obs.radius + 12)) {
        conf += (obs.radius + 12) - minD;
      }
    }
    return conf;
  };

  const confNormal = checkConflict(curveNormal.controlPoint);
  const confInvert = checkConflict(curveInvert.controlPoint);

  let chosen = curveNormal;
  let chosenInvert = false;

  if (confInvert < confNormal) {
    chosen = curveInvert;
    chosenInvert = true;
  } else if (confNormal < confInvert) {
    chosen = curveNormal;
    chosenInvert = false;
  } else {
    // Both equal in clearance: choose the one with shorter cable length!
    if (lenInvert < lenNormal) {
      chosen = curveInvert;
      chosenInvert = true;
    } else {
      chosen = curveNormal;
      chosenInvert = false;
    }
  }

  return {
    chosenStyle: 'curve',
    chosenInvert,
    controlPoint: chosen.controlPoint,
    curvature: chosen.curvature,
    pathD: chosen.pathD,
    explanation: 'Courbe d’évitement au plus court chemin',
  };
}

/**
 * Mode 2 (Éco-Câble) : Trouve l'ordre optimal de repiquage (chaîne de points)
 * qui minimise la longueur totale de câble nécessaire pour relier tous les points
 * d'un même circuit, sans être contraint par l'ordre de numérotation.
 * Utilise une recherche exacte par séparation et évaluation (Branch & Bound) avec élagage.
 */
export function findShortestDaisyChainOrder<T extends Point>(points: T[]): T[] {
  if (points.length <= 2) return [...points];

  const n = points.length;
  // Calcul de la matrice des distances
  const distMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  let bestOrder: number[] = [];
  let bestDist = Infinity;

  // 1. Heuristique gloutonne multi-départ (Nearest-Neighbor depuis chaque sommet de départ)
  for (let startNode = 0; startNode < n; startNode++) {
    const visitedNN = new Array(n).fill(false);
    const orderNN = [startNode];
    visitedNN[startNode] = true;
    let distNN = 0;

    for (let step = 1; step < n; step++) {
      const last = orderNN[step - 1];
      let nearest = -1;
      let minD = Infinity;
      for (let j = 0; j < n; j++) {
        if (!visitedNN[j] && distMatrix[last][j] < minD) {
          minD = distMatrix[last][j];
          nearest = j;
        }
      }
      if (nearest !== -1) {
        orderNN.push(nearest);
        visitedNN[nearest] = true;
        distNN += minD;
      }
    }

    if (distNN < bestDist) {
      bestDist = distNN;
      bestOrder = [...orderNN];
    }
  }

  // 2. Si n <= 8 : Recherche exacte avec élagage Branch & Bound initialisé avec la borne supérieure
  if (n <= 8) {
    const visited = new Array(n).fill(false);
    const currentOrder = new Array(n);

    function search(depth: number, currentLen: number) {
      if (currentLen >= bestDist) return; // Élagage immédiat

      if (depth === n) {
        if (currentLen < bestDist) {
          bestDist = currentLen;
          bestOrder = [...currentOrder];
        }
        return;
      }

      const candidates: { idx: number; dist: number }[] = [];
      const prev = depth === 0 ? -1 : currentOrder[depth - 1];

      for (let i = 0; i < n; i++) {
        if (!visited[i]) {
          const d = prev === -1 ? 0 : distMatrix[prev][i];
          candidates.push({ idx: i, dist: d });
        }
      }

      if (prev !== -1) {
        candidates.sort((a, b) => a.dist - b.dist);
      }

      for (const c of candidates) {
        visited[c.idx] = true;
        currentOrder[depth] = c.idx;
        search(depth + 1, currentLen + c.dist);
        visited[c.idx] = false;
      }
    }

    search(0, 0);
  } else {
    // 3. Si n > 8 : Amélioration locale 2-Opt (élimine tout croisement de câbles et raccourcit la chaîne)
    let improved = true;
    let iterations = 0;
    while (improved && iterations < 50) {
      improved = false;
      iterations++;
      for (let i = 0; i < n - 2; i++) {
        for (let j = i + 2; j < n; j++) {
          const dCur = distMatrix[bestOrder[i]][bestOrder[i + 1]] + (j + 1 < n ? distMatrix[bestOrder[j]][bestOrder[j + 1]] : 0);
          const dNew = distMatrix[bestOrder[i]][bestOrder[j]] + (j + 1 < n ? distMatrix[bestOrder[i + 1]][bestOrder[j + 1]] : 0);
          if (dNew < dCur - 1e-4) {
            // Inverser le sous-segment de i+1 à j
            let left = i + 1;
            let right = j;
            while (left < right) {
              const tmp = bestOrder[left];
              bestOrder[left] = bestOrder[right];
              bestOrder[right] = tmp;
              left++;
              right--;
            }
            improved = true;
          }
        }
      }
    }
  }

  if (bestOrder.length === n) {
    return bestOrder.map(idx => points[idx]);
  }
  return [...points];
}

/**
 * Mode 2 (Éco-Câble avec départ TGBT) :
 * Trouve l'ordre optimal de repiquage partant obligatoirement de l'origine (TGBT)
 * et reliant tous les points du circuit de manière à minimiser la consommation totale de câble.
 */
export function findShortestDaisyChainFromOrigin<T extends Point>(origin: Point, points: T[]): T[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [points[0]];

  const allNodes: Point[] = [origin, ...points];
  const n = allNodes.length; // node 0 is origin (TGBT)

  const distMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(allNodes[i].x - allNodes[j].x, allNodes[i].y - allNodes[j].y);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  // 1. Initialisation par Nearest-Neighbor partant du nœud 0 (TGBT)
  const visitedNN = new Array(n).fill(false);
  const orderNN = [0];
  visitedNN[0] = true;
  let distNN = 0;

  for (let step = 1; step < n; step++) {
    const last = orderNN[step - 1];
    let nearest = -1;
    let minD = Infinity;
    for (let j = 1; j < n; j++) {
      if (!visitedNN[j] && distMatrix[last][j] < minD) {
        minD = distMatrix[last][j];
        nearest = j;
      }
    }
    if (nearest !== -1) {
      orderNN.push(nearest);
      visitedNN[nearest] = true;
      distNN += minD;
    }
  }

  let bestOrder = [...orderNN];
  let bestDist = distNN;

  // 2. Si n <= 9 : Branch & Bound exact avec départ fixe au nœud 0
  if (n <= 9) {
    const visited = new Array(n).fill(false);
    visited[0] = true;
    const currentOrder = new Array(n);
    currentOrder[0] = 0;

    function search(depth: number, currentLen: number) {
      if (currentLen >= bestDist) return;

      if (depth === n) {
        if (currentLen < bestDist) {
          bestDist = currentLen;
          bestOrder = [...currentOrder];
        }
        return;
      }

      const prev = currentOrder[depth - 1];
      const candidates: { idx: number; dist: number }[] = [];
      for (let i = 1; i < n; i++) {
        if (!visited[i]) {
          candidates.push({ idx: i, dist: distMatrix[prev][i] });
        }
      }
      candidates.sort((a, b) => a.dist - b.dist);

      for (const c of candidates) {
        visited[c.idx] = true;
        currentOrder[depth] = c.idx;
        search(depth + 1, currentLen + c.dist);
        visited[c.idx] = false;
      }
    }

    search(1, 0);
  } else {
    // 3. Si n > 9 : 2-Opt local search improvement sur les nœuds 1 à n-1 (sans toucher au TGBT en 0)
    let improved = true;
    let iterations = 0;
    while (improved && iterations < 50) {
      improved = false;
      iterations++;
      for (let i = 1; i < n - 2; i++) {
        for (let j = i + 1; j < n; j++) {
          const dCur = distMatrix[bestOrder[i - 1]][bestOrder[i]] + (j + 1 < n ? distMatrix[bestOrder[j]][bestOrder[j + 1]] : 0);
          const dNew = distMatrix[bestOrder[i - 1]][bestOrder[j]] + (j + 1 < n ? distMatrix[bestOrder[i]][bestOrder[j + 1]] : 0);
          if (dNew < dCur - 1e-4) {
            let left = i;
            let right = j;
            while (left < right) {
              const tmp = bestOrder[left];
              bestOrder[left] = bestOrder[right];
              bestOrder[right] = tmp;
              left++;
              right--;
            }
            improved = true;
          }
        }
      }
    }
  }

  // Renvoie les points du circuit ordonnés (indices 1 à n-1 de allNodes)
  return bestOrder.slice(1).map(idx => points[idx - 1]);
}

