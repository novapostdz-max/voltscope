/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ObstaclePoint } from './wireRouter';

if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PdfImportResult {
  fileName: string;
  totalPages: number;
  pageImages: string[];
  aspectRatio: number;
  pageAspectRatios?: number[];
  detectedSymbolsByPage?: Record<number, ObstaclePoint[]>;
}

/**
 * Loads an image file (PNG, JPG, SVG, WebP) and prepares it as a high-res blueprint
 */
export async function loadImageAsBlueprint(file: File): Promise<PdfImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = (img.naturalWidth || 1400) / (img.naturalHeight || 960);
        resolve({
          fileName: file.name,
          totalPages: 1,
          pageImages: [dataUrl],
          aspectRatio,
          pageAspectRatios: [aspectRatio],
        });
      };
      img.onerror = () => {
        reject(new Error("Impossible de décoder l'image. Veuillez sélectionner un format valide (PNG, JPG, SVG)."));
      };
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier image.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Loads PDF pages using local Vite-bundled pdfjs-dist worker and auto-extracts circuit labels (e.g. L1, L2, L3, E1...)
 */
export async function loadPdfPages(file: File): Promise<PdfImportResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Configure loading task
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: true,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pageImages: string[] = [];
    const pageAspectRatios: number[] = [];
    const detectedSymbolsByPage: Record<number, ObstaclePoint[]> = {};
    let primaryAspectRatio = 1.45;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      // High-resolution scale for crisp blueprint details
      const viewport = page.getViewport({ scale: 2.0 });
      const ar = (viewport.width || 1400) / (viewport.height || 960);
      pageAspectRatios.push(ar);
      if (pageNum === 1) {
        primaryAspectRatio = ar;
      }

      // Auto-extract circuit codes like L1, L2, L3, E1, A1 with their exact sheet coordinates
      try {
        const textContent = await page.getTextContent();
        const pageDetected: ObstaclePoint[] = [];
        const seenCodes = new Set<string>();

        for (const item of textContent.items as any[]) {
          const str = (item.str || '').trim();
          const match = str.match(/\b([A-Za-z]{1,2})[-_\s]*(\d{1,2})\b/);
          if (match && item.transform) {
            const prefix = match[1].toUpperCase();
            const num = parseInt(match[2], 10);
            const fullCode = `${prefix}${num}`;
            if (!seenCodes.has(fullCode)) {
              seenCodes.add(fullCode);
              const tx = item.transform[4];
              const ty = item.transform[5];
              const [vx, vy] = viewport.convertToViewportPoint(tx, ty);
              const sheetWidth = 1400;
              const sheetHeight = 1400 / ar;
              const sheetX = Math.round((vx / (viewport.width || 1)) * sheetWidth);
              const sheetY = Math.round((vy / (viewport.height || 1)) * sheetHeight);

              pageDetected.push({
                id: `${fullCode}_p${pageNum}`,
                x: sheetX,
                y: sheetY,
                radius: 19,
                label: `Point ${fullCode}`,
                type: 'terminal',
              });
            }
          }
        }
        if (pageDetected.length > 0) {
          detectedSymbolsByPage[pageNum] = pageDetected;
        }
      } catch (e) {
        // Text extraction is non-blocking
      }

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // @ts-ignore
        const renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        pageImages.push(canvas.toDataURL('image/png', 0.95));
      }
    }

    if (pageImages.length === 0) {
      throw new Error("Aucune page n'a pu être extraite du fichier PDF.");
    }

    return {
      fileName: file.name,
      totalPages: pageImages.length,
      pageImages,
      aspectRatio: primaryAspectRatio,
      pageAspectRatios,
      detectedSymbolsByPage,
    };
  } catch (err: any) {
    console.error('PDF.js rendering error:', err);
    throw new Error(err.message || 'Erreur lors du traitement du fichier PDF.');
  }
}

/**
 * Generates an architectural blueprint of an apartment / house with RGIE apparatus
 */
export function generateSamplePositionBlueprint(): {
  fileName: string;
  totalPages: number;
  pageImages: string[];
  aspectRatio: number;
} {
  const width = 1400;
  const height = 960;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Background Paper
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Millimetric grid (subtle)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer border & Title cartouche
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Cartouche (Title block bottom-right)
    const cartoucheW = 340;
    const cartoucheH = 90;
    const cartoucheX = width - 40 - cartoucheW;
    const cartoucheY = height - 40 - cartoucheH;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cartoucheX, cartoucheY, cartoucheW, cartoucheH);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(cartoucheX, cartoucheY, cartoucheW, cartoucheH);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('PLAN DE POSITION ÉLECTRIQUE RGIE', cartoucheX + 15, cartoucheY + 24);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Installation : Maison Individuelle 105 m²', cartoucheX + 15, cartoucheY + 42);
    ctx.fillText('Tension : 3x400V+N / 230V~ · Échelle : 1/50', cartoucheX + 15, cartoucheY + 58);
    ctx.fillText('Conforme RGIE Livre 1 & NF C 15-100', cartoucheX + 15, cartoucheY + 74);

    // Outer Main Walls (Double line for thickness)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.strokeRect(100, 100, 1200, 720);

    // Inner dividing walls
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#334155';

    // Vertical wall dividing Salon (left) and Bedrooms (right)
    ctx.beginPath();
    ctx.moveTo(760, 100);
    ctx.lineTo(760, 820);
    ctx.stroke();

    // Horizontal wall dividing Salon & Cuisine (left side)
    ctx.beginPath();
    ctx.moveTo(100, 480);
    ctx.lineTo(760, 480);
    ctx.stroke();

    // Horizontal wall dividing Bedroom 1 & Office/Bathroom (right side)
    ctx.beginPath();
    ctx.moveTo(760, 480);
    ctx.lineTo(1300, 480);
    ctx.stroke();

    // Vertical wall dividing Office & Bathroom
    ctx.beginPath();
    ctx.moveTo(1060, 480);
    ctx.lineTo(1060, 820);
    ctx.stroke();

    // Room Name Labels
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';

    ctx.fillText('SÉJOUR / SALON (34 m²)', 430, 290);
    ctx.fillText('CUISINE / REPAS (22 m²)', 430, 650);
    ctx.fillText('CHAMBRE 1 (24 m²)', 1030, 290);
    ctx.fillText('BUREAU (14 m²)', 910, 650);
    ctx.fillText('SALLE D’EAU (11 m²)', 1180, 650);

    // Doors with swing arcs
    const drawDoor = (x: number, y: number, length: number, angleDeg: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angleDeg * Math.PI) / 180);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(length, 0);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, length, 0, Math.PI / 2);
      ctx.stroke();
      ctx.restore();
    };

    drawDoor(100, 360, 50, 0);
    drawDoor(680, 480, 45, 90);
    drawDoor(760, 360, 45, 0);
    drawDoor(840, 480, 45, -90);
    drawDoor(1120, 480, 45, -90);

    // Windows
    const drawWindow = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);
    };

    drawWindow(320, 96, 140, 8);
    drawWindow(950, 96, 120, 8);
    drawWindow(96, 620, 8, 120);
    drawWindow(1296, 620, 8, 100);
  }

  const dataUrl = canvas.toDataURL('image/png', 0.95);
  return {
    fileName: 'Schema_Position_Maison_Demo_RGIE.pdf',
    totalPages: 1,
    pageImages: [dataUrl],
    aspectRatio: width / height,
  };
}
