import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  MINIGAME_1_PACKETS,
  MINIGAME_2_NODES,
  MINIGAME_3_CHAIN_LINKS,
} from '../data/curriculum';
import { TrenchEngine } from '../game/TrenchEngine';
import { GameStage, MiniGameHUDState } from '../types/game';
import { CipherDialogueBox, MissionStepper } from './CipherBar';

interface ArcadeHUDProps {
  stage: GameStage;
  hud: MiniGameHUDState;
  engineRef: React.RefObject<TrenchEngine | null>;
  paused: boolean;
  muted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onStartMiniGame: (gameNum: 1 | 2 | 3) => void;
  onAdvanceFromComplete: (gameNum: 1 | 2 | 3) => void;
  onRestartMiniGame: (gameNum: 1 | 2 | 3) => void;
  onReturnTitle: () => void;
}

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  stage,
  hud,
  engineRef,
  paused,
  muted,
  onTogglePause,
  onToggleMute,
  onStartMiniGame,
  onAdvanceFromComplete,
  onRestartMiniGame,
  onReturnTitle,
}) => {
  const isMG1 = stage.startsWith('MINIGAME_1');
  const isMG2 = stage.startsWith('MINIGAME_2');
  const isMG3 = stage.startsWith('MINIGAME_3');
  const gameNum: 1 | 2 | 3 = isMG1 ? 1 : isMG2 ? 2 : 3;

  const isIntro = stage.endsWith('_INTRO');
  const isComplete = stage.endsWith('_COMPLETE');
  const isPlaying = !isIntro && !isComplete;

  const chainItems =
    gameNum === 1
      ? MINIGAME_1_PACKETS
      : gameNum === 2
        ? MINIGAME_2_NODES
        : MINIGAME_3_CHAIN_LINKS;

  const gameMeta = {
    1: {
      title: 'Mini-Game 1: Chain Reaction Run',
      location: 'Grid Runway · Hoverboard 3-Lane Runner',
      instructions:
        'Use Left/Right Arrows (or A/D) to switch lanes and Spacebar to jump over firewalls. Collect the glowing magma packets in the EXACT cause-and-effect order (1 → 2 → 3 → 4)!',
      completeQuote:
        'Chain complete! Every magma packet fired in the exact order that built Surtsey Island. Next stop: Signal Tower!',
    },
    2: {
      title: 'Mini-Game 2: Driftline Chase',
      location: 'Grid Runway · Energy Lane Steering',
      instructions:
        'Steer smoothly Left/Right (Arrow keys or A/D) along the swirling driftlines. Intercept Cause Nodes 1 through 5 in chronological order for a speed boost, then enter the Effect Container!',
      completeQuote:
        'Effect Container reached! You traced how ongoing lava cooled into a rock shield that protected Surtsey. Advancing to the Server Vault!',
    },
    3: {
      title: 'Mini-Game 3: Grid Overload',
      location: 'Mainframe Canyon · Gravity Flight',
      instructions:
        'Hold Spacebar (or tap & hold Ascend) to fire your hoverboard thrusters upward, and release to glide down under gravity. Fly through the glowing gap in all 5 firewall barriers to reach the Mainframe Core!',
      completeQuote:
        'All 5 circuit links activated! You piloted straight through the Grid Overload into the Mainframe Core!',
    },
  }[gameNum];

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-5 pointer-events-none">
      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 pointer-events-auto">
        {/* Left: Game Info & Progress */}
        <div className="rounded-xl border border-cyan-400/35 bg-[#060a18]/92 px-3.5 py-2.5 max-w-xs sm:max-w-sm">
          <div className="text-[11px] font-display font-bold tracking-wider text-cyan-300 uppercase">
            {gameMeta.location}
          </div>
          <div className="font-display text-sm sm:text-base font-bold text-white">
            {gameMeta.title}
          </div>
          {isPlaying && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
                  style={{ width: `${hud.progressPercent}%` }}
                />
              </div>
              <span className="font-mono-tabular text-xs font-bold text-cyan-200">
                {hud.collectedCount}/{hud.totalRequired}
              </span>
            </div>
          )}
        </div>

        {/* Center: Numbered Causal Chain Slots */}
        {isPlaying && (
          <div className="rounded-xl border border-purple-400/40 bg-[#060a18]/92 px-3.5 py-2 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              {chainItems.map((item) => {
                const done = item.order <= hud.collectedCount;
                const isNext = item.order === hud.collectedCount + 1;
                return (
                  <div
                    key={item.order}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border font-display font-bold text-xs sm:text-sm flex items-center justify-center ${
                      done
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                        : isNext
                          ? 'bg-cyan-500/30 border-cyan-300 text-white'
                          : 'bg-slate-900/80 border-slate-700 text-slate-500'
                    }`}
                    title={item.shortLabel}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : item.order}
                  </div>
                );
              })}
            </div>
            <div className="text-xs font-semibold text-cyan-200 whitespace-nowrap">
              NEXT TARGET: <span className="text-white">{hud.nextLabel}</span>
            </div>
          </div>
        )}

        {/* Right: Timer, Speed State & Controls */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <div className="rounded-xl border border-slate-700 bg-[#060a18]/92 px-3 py-2 text-right font-mono-tabular">
              <div className="text-[10px] text-slate-400 uppercase">Time</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {hud.elapsedSeconds.toFixed(1)}s
              </div>
            </div>
          )}

          {isPlaying && hud.boostTimer > 0 && (
            <div className="rounded-xl border border-cyan-400/60 bg-cyan-950/80 px-2.5 py-2 flex items-center gap-1 text-xs font-bold text-cyan-200">
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>BOOST</span>
            </div>
          )}

          {isPlaying && hud.slowdownTimer > 0 && (
            <div className="rounded-xl border border-amber-400/60 bg-amber-950/80 px-2.5 py-2 flex items-center gap-1 text-xs font-bold text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>SLOWDOWN</span>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            className="p-2.5 rounded-xl border border-slate-700 bg-[#060a18]/92 hover:bg-slate-900 text-cyan-200"
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={onTogglePause}
              className="p-2.5 rounded-xl border border-slate-700 bg-[#060a18]/92 hover:bg-slate-900 text-white"
              aria-label={paused ? 'Resume game' : 'Pause game'}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Center Modals: Intro / Complete / Pause */}
      <div className="my-auto flex items-center justify-center">
        {isIntro && (
          <div className="pointer-events-auto max-w-lg w-full rounded-2xl border border-purple-400/50 bg-[#060a18]/95 p-6 shadow-2xl space-y-4">
            <div className="text-xs font-display font-bold tracking-widest text-cyan-300 uppercase">
              Pre-Run Briefing
            </div>
            <h3 className="font-display text-2xl font-bold text-white">{gameMeta.title}</h3>
            <p className="text-base text-slate-200 leading-relaxed">{gameMeta.instructions}</p>

            <div className="rounded-xl border border-slate-800 bg-[#0b1228] p-3.5 space-y-1.5">
              <div className="text-xs font-display font-bold text-purple-300 uppercase">
                Sequence to Collect in Order:
              </div>
              <ol className="text-sm text-slate-200 space-y-1">
                {chainItems.map((item) => (
                  <li key={item.order} className="font-medium">
                    {item.shortLabel}
                  </li>
                ))}
              </ol>
            </div>

            <button
              type="button"
              onClick={() => onStartMiniGame(gameNum)}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold text-base shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Run</span>
            </button>
          </div>
        )}

        {isComplete && (
          <div className="pointer-events-auto max-w-lg w-full rounded-2xl border border-emerald-400/55 bg-[#060a18]/95 p-6 shadow-2xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-display font-bold tracking-widest text-emerald-300 uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sequence Verified</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-white">
              {gameMeta.title} Complete!
            </h3>
            <p className="text-base text-slate-200 leading-relaxed">{gameMeta.completeQuote}</p>

            <div className="space-y-1.5 rounded-xl border border-slate-800 bg-[#0b1228] p-3.5">
              {chainItems.map((item) => (
                <div key={item.order} className="flex items-center gap-2 text-sm text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item.shortLabel}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onAdvanceFromComplete(gameNum)}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base"
            >
              <span>
                {gameNum === 1
                  ? 'Continue to Signal Tower (We Do)'
                  : gameNum === 2
                    ? 'Continue to Server Vault (You Do)'
                    : 'Enter The Core'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {isPlaying && paused && (
          <div className="pointer-events-auto max-w-sm w-full rounded-2xl border border-cyan-400/50 bg-[#060a18]/96 p-6 shadow-2xl space-y-3 text-center">
            <h3 className="font-display text-2xl font-bold text-white">Run Paused</h3>
            <p className="text-sm text-slate-300">
              Take a breath, review the target order, or restart this mini-game checkpoint.
            </p>
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={onTogglePause}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-base"
              >
                Resume Run
              </button>
              <button
                type="button"
                onClick={() => onRestartMiniGame(gameNum)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-400/45 bg-purple-950/50 hover:bg-purple-900/60 text-purple-100 font-display font-bold text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart This Mini-Game</span>
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold"
              >
                Return to Title
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls + Feedback + Stepper */}
      <div className="space-y-2.5">
        {isPlaying && hud.feedbackBanner && (
          <div
            className={`max-w-xl mx-auto rounded-xl border px-4 py-2.5 flex items-center gap-3 text-sm shadow-lg ${
              hud.feedbackBanner.type === 'success'
                ? 'bg-emerald-950/92 border-emerald-400/70 text-emerald-100'
                : hud.feedbackBanner.type === 'warning'
                  ? 'bg-amber-950/92 border-amber-400/70 text-amber-100'
                  : 'bg-cyan-950/92 border-cyan-400/70 text-cyan-100'
            }`}
          >
            {hud.feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
            )}
            <div>
              <strong className="font-display mr-1.5">{hud.feedbackBanner.title}</strong>
              <span>{hud.feedbackBanner.message}</span>
            </div>
          </div>
        )}

        {/* Accessible On-Screen Touch / Click Controls */}
        {isPlaying && !paused && (
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 pointer-events-auto">
            {gameNum === 1 && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => engineRef.current?.triggerLaneLeft()}
                    className="w-14 h-12 rounded-xl border border-cyan-400/55 bg-[#070d20]/90 active:bg-cyan-500/40 text-cyan-200 flex items-center justify-center"
                    aria-label="Switch lane left"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => engineRef.current?.triggerLaneRight()}
                    className="w-14 h-12 rounded-xl border border-cyan-400/55 bg-[#070d20]/90 active:bg-cyan-500/40 text-cyan-200 flex items-center justify-center"
                    aria-label="Switch lane right"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
                <span className="hidden sm:inline text-xs text-slate-300 bg-[#060a18]/85 px-3 py-1.5 rounded-lg border border-slate-800">
                  Desktop: ← / → Lanes · Spacebar Jump
                </span>
                <button
                  type="button"
                  onClick={() => engineRef.current?.triggerJump()}
                  className="px-5 h-12 rounded-xl border border-purple-400/60 bg-purple-950/85 active:bg-purple-600/60 text-white font-display font-bold text-sm inline-flex items-center gap-1.5"
                >
                  <ArrowUp className="w-5 h-5" />
                  <span>JUMP</span>
                </button>
              </>
            )}

            {gameNum === 2 && (
              <>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setSteerInput(-1)}
                  onPointerUp={() => engineRef.current?.setSteerInput(0)}
                  onPointerLeave={() => engineRef.current?.setSteerInput(0)}
                  className="px-5 h-12 rounded-xl border border-cyan-400/55 bg-[#070d20]/90 active:bg-cyan-500/40 text-cyan-200 font-display font-bold text-sm inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>STEER LEFT</span>
                </button>
                <span className="hidden sm:inline text-xs text-slate-300 bg-[#060a18]/85 px-3 py-1.5 rounded-lg border border-slate-800">
                  Desktop: Hold ← / → or A / D to Steer Smoothly
                </span>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setSteerInput(1)}
                  onPointerUp={() => engineRef.current?.setSteerInput(0)}
                  onPointerLeave={() => engineRef.current?.setSteerInput(0)}
                  className="px-5 h-12 rounded-xl border border-cyan-400/55 bg-[#070d20]/90 active:bg-cyan-500/40 text-cyan-200 font-display font-bold text-sm inline-flex items-center gap-1.5"
                >
                  <span>STEER RIGHT</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {gameNum === 3 && (
              <>
                <span className="text-xs text-slate-300 bg-[#060a18]/85 px-3 py-1.5 rounded-lg border border-slate-800">
                  Hold Spacebar or Ascend to Climb · Release to Descend
                </span>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setThrusterHeld(true)}
                  onPointerUp={() => engineRef.current?.setThrusterHeld(false)}
                  onPointerLeave={() => engineRef.current?.setThrusterHeld(false)}
                  className="px-6 h-12 rounded-xl border border-purple-400/70 bg-purple-700/80 active:bg-cyan-500 text-white font-display font-bold text-sm inline-flex items-center gap-2"
                >
                  <ArrowUp className="w-5 h-5" />
                  <span>HOLD TO ASCEND</span>
                </button>
              </>
            )}
          </div>
        )}

        {isComplete && (
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <CipherDialogueBox text={gameMeta.completeQuote} mood="encouraging" muted={muted} />
          </div>
        )}

        <div className="pointer-events-auto">
          <MissionStepper stage={stage} />
        </div>
      </div>
    </div>
  );
};
