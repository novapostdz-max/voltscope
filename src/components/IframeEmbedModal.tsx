/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Maximize2, 
  Monitor, 
  X, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';

interface IframeEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab?: string;
}

export const IframeEmbedModal: React.FC<IframeEmbedModalProps> = ({
  isOpen,
  onClose,
  currentTab = 'home',
}) => {
  const [selectedTab, setSelectedTab] = useState<string>(currentTab || 'home');
  const [includeVoltscopeParam, setIncludeVoltscopeParam] = useState<boolean>(true);
  const [versionTag, setVersionTag] = useState<string>('v2n');
  const [dateTag, setDateTag] = useState<string>('2026-10-04');
  const [enableFullscreen, setEnableFullscreen] = useState<boolean>(true);
  const [customWidth, setCustomWidth] = useState<string>('100%');
  const [customHeight, setCustomHeight] = useState<string>('100vh');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'code' | 'preview'>('code');

  const originUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
      return window.location.origin;
    }
    return 'https://ais-pre-gphmzxynqhyuijihojsogv-460515623491.europe-west2.run.app';
  }, []);

  const generatedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (includeVoltscopeParam) {
      params.set('voltscope', 'true');
    }
    if (versionTag) {
      params.set('version', versionTag);
    }
    if (dateTag) {
      params.set('date', dateTag);
    }
    if (selectedTab && selectedTab !== 'home') {
      params.set('tab', selectedTab);
    }
    const queryString = params.toString();
    return queryString ? `${originUrl}?${queryString}` : originUrl;
  }, [originUrl, includeVoltscopeParam, versionTag, dateTag, selectedTab]);

  const iframeSnippet = useMemo(() => {
    const allowAttr = enableFullscreen 
      ? 'allow="clipboard-write; fullscreen"' 
      : 'allow="clipboard-write"';
    return `<iframe\n  src="${generatedUrl}"\n  style="width: ${customWidth}; height: ${customHeight}; border: none; display: block;"\n  ${allowAttr}\n></iframe>`;
  }, [generatedUrl, customWidth, customHeight, enableFullscreen]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(iframeSnippet);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = iframeSnippet;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy iframe snippet:', err);
    }
  };

  if (!isOpen) return null;

  const tabOptions = [
    { id: 'home', label: 'Accueil VoltScope' },
    { id: 'smart-meter', label: 'Compteur Intelligent (Index & P1)' },
    { id: 'meter-exam', label: 'Examen Compteurs (123 QCM ORES)' },
    { id: 'rtcc', label: 'Relais RTCC & Contacteur 63A' },
    { id: 'simuphase-tetra', label: 'SimuPhase Champ Tournant Tétra' },
    { id: 'specs', label: 'Spécifications & Coffrets' },
    { id: 'notes', label: 'Guide & Diagnostic' },
    { id: 'solar', label: 'Calcul Solaire' },
    { id: 'pv-config', label: 'Solaire & Batteries' },
    { id: 'icc', label: 'Calculateur Icc Court-Circuit' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Intégration &amp; Code <span className="text-blue-400 font-mono">&lt;iframe&gt;</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  v2n Prêt
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Générez le code d'intégration HTML responsive pour insérer VoltScope dans n'importe quel site ou intranet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Quick Info Box */}
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-start gap-3 text-xs text-blue-200">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Le paramètre <code className="px-1.5 py-0.5 rounded bg-blue-900/60 font-mono text-blue-300 font-bold">voltscope=true</code> déverrouille automatiquement l'accès pour les utilisateurs au sein de l'iframe sans nécessiter la saisie manuelle du code PIN.
            </div>
          </div>

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Tab */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Outil ou Vue initiale :</span>
              </label>
              <select
                value={selectedTab}
                onChange={(e) => setSelectedTab(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-medium text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                {tabOptions.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dimensions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dimensions d'affichage :</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  placeholder="100%"
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-hidden focus:border-blue-500"
                  title="Largeur de l'iframe"
                />
                <input
                  type="text"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  placeholder="100vh"
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-hidden focus:border-blue-500"
                  title="Hauteur de l'iframe"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-800/80 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeVoltscopeParam}
                onChange={(e) => setIncludeVoltscopeParam(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700 w-4 h-4 cursor-pointer"
              />
              <span className="text-slate-300 font-medium">Bypass Code PIN (<code className="text-blue-400 font-mono">voltscope=true</code>)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableFullscreen}
                onChange={(e) => setEnableFullscreen(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700 w-4 h-4 cursor-pointer"
              />
              <span className="text-slate-300 font-medium">Autoriser plein écran &amp; presse-papier</span>
            </label>
          </div>

          {/* Preview / Code switch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('code')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activePreviewTab === 'code' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Code HTML &lt;iframe&gt;
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('preview')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activePreviewTab === 'preview' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Aperçu en direct
                </button>
              </div>

              <a
                href={generatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Tester le lien direct</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {activePreviewTab === 'code' ? (
              <div className="relative group">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto leading-relaxed shadow-inner selection:bg-emerald-900 selection:text-white">
                  <code>{iframeSnippet}</code>
                </pre>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>Copier le code</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 overflow-hidden flex flex-col">
                <div className="px-3 py-1.5 bg-slate-900 text-[11px] font-mono text-slate-400 border-b border-slate-800 flex items-center justify-between">
                  <span>Aperçu conteneur iframe simulé :</span>
                  <span className="text-emerald-400 font-bold">{customWidth} × 350px</span>
                </div>
                <div className="w-full h-[350px] bg-slate-900 relative">
                  <iframe
                    src={generatedUrl}
                    title="Aperçu VoltScope Iframe"
                    className="w-full h-full border-0"
                    allow="clipboard-write; fullscreen"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Compatible avec tout CMS, LMS Moodle, SharePoint ou page web.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Code Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier le code &lt;iframe&gt;</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
