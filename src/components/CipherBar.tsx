import React, { useState } from 'react';
import { Check, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { GameStage } from '../types/game';

interface CipherPortraitProps {
  mood?: 'neutral' | 'encouraging' | 'steppedBack';
  size?: number;
}

export const CipherPortrait: React.FC<CipherPortraitProps> = ({ mood = 'neutral', size = 64 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 rounded-lg border border-purple-400/50 bg-[#080d22] overflow-hidden flex items-center justify-center"
    >
      <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="cipherBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#090d1f" />
          </linearGradient>
          <linearGradient id="visorGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
        <rect width="80" height="80" fill="url(#cipherBg)" />
        {/* Hoodie shoulders */}
        <path d="M12 80 C14 58, 25 52, 40 52 C55 52, 66 58, 68 80 Z" fill="#111827" stroke="#a855f7" strokeWidth="1.5" />
        {/* Glowing C emblem */}
        <path d="M44 63 A6 6 0 1 0 44 73" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
        {/* Neck & Head */}
        <rect x="35" y="45" width="10" height="9" rx="3" fill="#d4a373" />
        <ellipse cx="40" cy="34" rx="15" ry="17" fill="#d4a373" />
        {/* Messy cyberpunk dark hair */}
        <path
          d="M23 32 C22 17, 34 11, 43 12 C54 13, 59 22, 57 33 C54 24, 48 21, 40 21 C31 21, 27 25, 23 32 Z"
          fill="#0f172a"
        />
        {/* Neon Purple Visor */}
        <rect x="25" y="27" width="30" height="10" rx="3" fill="url(#visorGlow)" stroke="#f0abfc" strokeWidth="1" />
        <line x1="28" y1="32" x2="36" y2="32" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="44" y1="32" x2="52" y2="32" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
        {/* Smile / focus expression */}
        {mood === 'encouraging' ? (
          <path d="M35 43 Q40 46 45 43" fill="none" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <line x1="36" y1="43" x2="44" y2="43" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};

interface CipherDialogueProps {
  speakerLabel?: string;
  text: string;
  mood?: 'neutral' | 'encouraging' | 'steppedBack';
  muted?: boolean;
}

export const CipherDialogueBox: React.FC<CipherDialogueProps> = ({
  speakerLabel = 'CIPHER · NAVIGATOR',
  text,
  mood = 'neutral',
  muted = false,
}) => {
  const [speaking, setSpeaking] = useState(false);

  const handleToggleSpeech = () => {
    if (speaking || soundEngine.isSpeaking()) {
      soundEngine.stopSpeaking();
      setSpeaking(false);
    } else {
      const started = soundEngine.speak(text, () => setSpeaking(false));
      if (started) setSpeaking(true);
    }
  };

  return (
    <div className="rounded-xl border border-purple-400/40 bg-[#070b1a]/95 p-3.5 sm:p-4 flex items-start gap-3.5 shadow-lg">
      <CipherPortrait mood={mood} size={56} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-display text-xs font-bold tracking-wider text-purple-300 uppercase">
            {speakerLabel}
          </span>
          {!muted && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-cyan-400/35 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-200 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400"
              aria-label={speaking ? 'Stop reading aloud' : 'Read Cipher message aloud'}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{speaking ? 'Stop' : 'Read Aloud'}</span>
            </button>
          )}
        </div>
        <p className="text-sm sm:text-base text-slate-100 leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

interface MissionStepperProps {
  stage: GameStage;
}

const STEPS = [
  { key: 'I_DO', label: '1. I Do', stages: ['STAGE_1_I_DO'] },
  { key: 'MG1', label: '2. Chain Run', stages: ['MINIGAME_1_INTRO', 'MINIGAME_1', 'MINIGAME_1_COMPLETE'] },
  { key: 'WE_DO', label: '3. We Do', stages: ['STAGE_2_WE_DO'] },
  { key: 'MG2', label: '4. Driftline', stages: ['MINIGAME_2_INTRO', 'MINIGAME_2', 'MINIGAME_2_COMPLETE'] },
  { key: 'YOU_DO', label: '5. You Do', stages: ['STAGE_3_YOU_DO'] },
  { key: 'MG3', label: '6. Grid Overload', stages: ['MINIGAME_3_INTRO', 'MINIGAME_3', 'MINIGAME_3_COMPLETE'] },
  { key: 'CORE', label: 'The Core', stages: ['STAGE_4_CORE'] },
];

export const MissionStepper: React.FC<MissionStepperProps> = ({ stage }) => {
  const activeIdx = STEPS.findIndex((s) => s.stages.includes(stage));

  return (
    <nav
      aria-label="Mission Progress"
      className="w-full max-w-4xl mx-auto px-3 py-2 rounded-xl border border-cyan-500/25 bg-[#060a17]/95 flex items-center justify-between gap-1.5 overflow-x-auto"
    >
      {STEPS.map((step, idx) => {
        const isDone = activeIdx > idx || (stage === 'STAGE_4_CORE' && idx === STEPS.length - 1);
        const isCurrent = activeIdx === idx && stage !== 'STAGE_4_CORE';
        return (
          <div key={step.key} className="flex items-center gap-1.5 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isCurrent
                  ? 'bg-purple-600/40 border border-purple-400 text-white'
                  : isDone
                    ? 'bg-cyan-950/60 border border-cyan-400/50 text-cyan-200'
                    : 'bg-slate-900/70 border border-slate-700/60 text-slate-400'
              }`}
            >
              {isDone && <Check className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />}
              <span className="whitespace-nowrap">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <span className="text-slate-600 text-xs select-none" aria-hidden="true">
                ›
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};
