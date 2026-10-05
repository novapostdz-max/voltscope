/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
  label?: string;
}

export type WireStyle = 'auto' | 'curve' | 'straight' | 'orthogonal' | 'freehand';

export interface PdfPlanBackground {
  fileName: string;
  currentPage: number;
  totalPages: number;
  pageImages: string[];
  opacity?: number;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  visible?: boolean;
  aspectRatio?: number;
  pageAspectRatios?: number[];
}

export interface DrawnWire {
  id: string;
  pageNumber: number;
  p1: Point;
  p2: Point;
  color: string;
  circuitCode: string;
  circuitName: string;
  wireStyle?: WireStyle;
  invertCurve?: boolean;
  curvature?: number;
  controlPoint?: Point;
  pathD?: string;
  points?: Point[];
}
