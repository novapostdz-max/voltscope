import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  HelpCircle, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { audioService } from '../utils/audio';

interface Message {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
}

const PRESET_QUESTIONS = [
  "Explique-moi pas à pas le cas de mon examen avec Brun, Gris, Noir, Bleu.",
  "Pourquoi le fil bleu (neutre) n'affecte pas le champ tournant d'un moteur triphasé ?",
  "Quelle est la procédure exacte pour utiliser un rota-phase lors d'un contrôle ?",
  "Que dit la norme CENELEC HD 308 S2 et le RGIE sur les couleurs des phases ?",
  "Quels sont les dégâts sur une pompe ou un compresseur en rotation inverse ?",
];

export const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'tutor',
      text: "Bonjour ! Je suis ton tuteur expert en électrotechnique, normes RGIE / NF C 15-100 et raccordement de compteurs tétrapolaires.\n\nTu as passé ton examen avec une arrivée présentant [Brun, Gris, Noir, Bleu] et un câble entrant [Brun, Noir, Gris, Bleu].\n\nPose-moi n'importe quelle question sur ce raccordement, sur le théorème de Ferraris ou sur la rotation horlogique / antihorlogique !"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    audioService.playRelayClick();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.text }),
      });

      if (!res.ok) {
        throw new Error('Erreur de communication avec le serveur');
      }

      const data = await res.json();
      const tutorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: data.text || "Réponse non disponible pour le moment.",
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch {
      // Pedagogical fallback response explaining the exact exam case
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'tutor',
          text: "Note technique d'examen : L'inversion de deux phases (ici Gris et Noir) inverse l'ordre temporel cyclique (L1-L3-L2 au lieu de L1-L2-L3). Le vecteur résultant du champ tournant tourne alors en sens trigonométrique (antihorlogique). Pour corriger, il suffit d'intervertir le fil Noir et le fil Gris au niveau du bornier de départ !"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage(inputValue);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-left">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <Bot className="w-3.5 h-3.5" />
              <span>ASSISTANT INTELLIGENT DE FORMATION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Tuteur Spécialisé Électrotechnique &amp; Câblage Tétra
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Pose toutes tes questions sur les pièges d&apos;examen, les règles de raccordement, les calculs de déphasage et la sécurité électrique.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>SUGGESTIONS DE QUESTIONS D&apos;EXAMEN :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((question, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(question)}
              disabled={loading}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-slate-800/80 transition-all text-left cursor-pointer"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[520px]">
        {/* Messages scroll area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'tutor' && (
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-amber-600 text-white font-medium rounded-tr-none shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none font-sans'
                }`}
              >
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 font-bold font-mono text-xs mt-0.5">
                  MOI
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs font-mono">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Analyse technique en cours...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose une question sur ton raccordement tétra, le champ tournant, le neutre..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={loading || !inputValue.trim()}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold transition-all flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
