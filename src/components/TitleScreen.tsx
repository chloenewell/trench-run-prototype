import React from 'react';
import { ArrowRight, BookOpen, Gamepad2, Volume2, VolumeX } from 'lucide-react';
import { CipherPortrait } from './CipherBar';

interface TitleScreenProps {
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, muted, onToggleMute }) => {
  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 sm:p-8 pointer-events-none">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-4 pointer-events-auto">
        <div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            TRENCH RUN
          </h1>
          <p className="text-xs sm:text-sm text-cyan-300 font-medium">
            When an Island Explodes · Grade 4 Reading Adventure · Designed by Chloé Newell
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-cyan-400/35 bg-[#070b1a]/90 hover:bg-slate-900 text-cyan-200 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400"
          aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{muted ? 'Sound Off' : 'Sound On'}</span>
        </button>
      </header>

      {/* Main Holographic Mission Brief Card on Left/Center */}
      <main className="my-auto max-w-xl pointer-events-auto">
        <div className="rounded-2xl border border-purple-400/45 bg-[#060a18]/92 p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="text-xs font-display font-bold tracking-widest text-cyan-300 uppercase">
            Mission Brief · Spawn Bay
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight text-balance">
            Trace the Chain Reaction That Built a Real Island
          </h2>

          <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
            In 1963, an underwater volcano near Iceland erupted and built a brand-new island overnight. Join your guide <strong className="text-purple-300">Cipher</strong>, ride your hoverboard through the cyber trench, and unlock the exact cause-and-effect chain to reach <strong className="text-cyan-300">The Core</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-cyan-500/25 bg-[#0b1228]/90 p-3.5 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="text-sm font-bold text-white">3 Guided Reading Stages</div>
                <div className="text-xs text-slate-300">I Do · We Do · You Do (RI.4.3)</div>
              </div>
            </div>
            <div className="rounded-xl border border-purple-500/25 bg-[#0b1228]/90 p-3.5 flex items-start gap-3">
              <Gamepad2 className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="text-sm font-bold text-white">3 Arcade Mini-Games</div>
                <div className="text-xs text-slate-300">Hoverboard, Driftline & Gravity Flight</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <CipherPortrait mood="encouraging" size={44} />
              <div className="text-xs sm:text-sm text-slate-300">
                <span className="block font-bold text-purple-300">Cipher · Tech Coach</span>
                <span>Ready when you are, Runner.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold text-base sm:text-lg tracking-wide shadow-lg transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-white"
            >
              <span>Start Mission</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </main>

      <footer className="text-xs text-slate-400 flex items-center justify-between pointer-events-auto">
        <span>Controls: Arrow Keys / A-D / Spacebar · On-screen touch controls included</span>
        <span>CCSS.ELA-Literacy.RI.4.3</span>
      </footer>
    </div>
  );
};
