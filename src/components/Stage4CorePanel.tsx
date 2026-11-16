import React from 'react';
import { Award, CheckCircle2, Home, RotateCcw } from 'lucide-react';
import { STAGE_4_FULL_CHAIN } from '../data/curriculum';
import { MissionStats } from '../types/game';
import { CipherDialogueBox, MissionStepper } from './CipherBar';

interface Stage4CorePanelProps {
  stats: MissionStats;
  onReplay: () => void;
  onReturnTitle: () => void;
  muted: boolean;
}

export const Stage4CorePanel: React.FC<Stage4CorePanelProps> = ({
  stats,
  onReplay,
  onReturnTitle,
  muted,
}) => {
  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-6 gap-3 overflow-y-auto trench-scroll">
      {/* Top Celebration Banner */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-display font-bold tracking-widest text-cyan-300 uppercase">
            The Core · Mainframe Restored
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-wide">
            SYSTEM CLEARED
          </h2>
        </div>

        <div className="rounded-xl border border-amber-400/60 bg-amber-950/50 px-4 py-2.5 flex items-center gap-3">
          <Award className="w-7 h-7 text-amber-300 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-display text-sm font-bold text-amber-200">
              CHAIN MASTER BADGE
            </div>
            <div className="text-xs text-amber-100/85">CCSS.ELA-Literacy.RI.4.3 Certified</div>
          </div>
        </div>
      </div>

      {/* Main Complete Causal Chain Visual Summary */}
      <div className="max-w-5xl w-full mx-auto my-auto space-y-4">
        <div className="rounded-2xl border border-purple-400/45 bg-[#060a18]/93 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display text-lg sm:text-xl font-bold text-white">
              Complete Cause-and-Effect Chain: When an Island Explodes
            </h3>
            <span className="text-xs font-semibold text-emerald-300 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>All 5 Causal Links Verified</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {STAGE_4_FULL_CHAIN.map((node) => (
              <div
                key={node.step}
                className="rounded-xl border border-cyan-400/35 bg-[#0b132b] p-3.5 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-md bg-purple-600/50 border border-purple-400 text-xs font-display font-bold text-white flex items-center justify-center">
                    {node.step}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-white leading-snug">
                    {node.title}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {node.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reading Strategy Recap + Student Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-slate-800 bg-[#0b1228] p-4 space-y-2">
              <div className="font-display text-sm font-bold text-cyan-300 uppercase">
                Reading Strategy Recap (RI.4.3)
              </div>
              <ul className="text-sm text-slate-200 space-y-1.5 leading-relaxed">
                <li>• <strong>Find the trigger (Cause):</strong> Ask what happened first.</li>
                <li>• <strong>Follow signal words:</strong> Look for <em>because, caused, until, once,</em> and <em>soon after</em>.</li>
                <li>• <strong>Trace the chain (Effect):</strong> See how one effect becomes the cause of the next event.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0b1228] p-4 space-y-2">
              <div className="font-display text-sm font-bold text-purple-300 uppercase">
                Mission Summary
              </div>
              {stats.studentSummarySentence && (
                <p className="text-sm text-slate-200 italic">
                  Your Summary: “{stats.studentSummarySentence}”
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono-tabular text-xs">
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400">Run 1</div>
                  <div className="text-cyan-300 font-bold">{stats.mg1TimeSeconds.toFixed(1)}s</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400">Run 2</div>
                  <div className="text-cyan-300 font-bold">{stats.mg2TimeSeconds.toFixed(1)}s</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400">Run 3</div>
                  <div className="text-cyan-300 font-bold">{stats.mg3TimeSeconds.toFixed(1)}s</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onReturnTitle}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-600 bg-slate-900 hover:bg-slate-800 text-slate-100 font-display font-bold text-sm sm:text-base transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Return to Title</span>
            </button>
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold text-sm sm:text-base transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Mission</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Cipher & Stepper */}
      <div className="max-w-5xl w-full mx-auto space-y-2.5">
        <CipherDialogueBox
          text="Excellent work, Runner! You traced every cause and effect from the 1963 eruption all the way to Surtsey's living ecosystem. System cleared!"
          mood="encouraging"
          muted={muted}
        />
        <MissionStepper stage="STAGE_4_CORE" />
      </div>
    </div>
  );
};
