import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { ArcadeHUD } from './components/ArcadeHUD';
import { Stage1Panel } from './components/Stage1Panel';
import { Stage2Panel } from './components/Stage2Panel';
import { Stage3Panel } from './components/Stage3Panel';
import { Stage4CorePanel } from './components/Stage4CorePanel';
import { TitleScreen } from './components/TitleScreen';
import { TrenchEngine } from './game/TrenchEngine';
import { GameStage, MiniGameHUDState, MissionStats } from './types/game';

const INITIAL_HUD: MiniGameHUDState = {
  activeGame: null,
  collectedCount: 0,
  totalRequired: 4,
  nextLabel: '',
  progressPercent: 0,
  speedMultiplier: 1,
  boostTimer: 0,
  slowdownTimer: 0,
  shieldFlashTimer: 0,
  elapsedSeconds: 0,
  feedbackBanner: null,
};

const INITIAL_STATS: MissionStats = {
  stage1Attempts: 0,
  stage2Attempts: 0,
  stage3Attempts: 0,
  mg1WrongOrderHits: 0,
  mg2WrongOrderHits: 0,
  mg3BarrierBumps: 0,
  mg1TimeSeconds: 0,
  mg2TimeSeconds: 0,
  mg3TimeSeconds: 0,
  studentSummarySentence: '',
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<TrenchEngine | null>(null);

  const [stage, setStage] = useState<GameStage>('TITLE');
  const [hud, setHud] = useState<MiniGameHUDState>(INITIAL_HUD);
  const [stats, setStats] = useState<MissionStats>(INITIAL_STATS);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const handleMiniGameComplete = useCallback(
    (gameNum: 1 | 2 | 3, elapsedSeconds: number, wrongHits: number) => {
      setStats((prev) => ({
        ...prev,
        mg1TimeSeconds: gameNum === 1 ? elapsedSeconds : prev.mg1TimeSeconds,
        mg2TimeSeconds: gameNum === 2 ? elapsedSeconds : prev.mg2TimeSeconds,
        mg3TimeSeconds: gameNum === 3 ? elapsedSeconds : prev.mg3TimeSeconds,
        mg1WrongOrderHits: gameNum === 1 ? wrongHits : prev.mg1WrongOrderHits,
        mg2WrongOrderHits: gameNum === 2 ? wrongHits : prev.mg2WrongOrderHits,
        mg3BarrierBumps: gameNum === 3 ? wrongHits : prev.mg3BarrierBumps,
      }));
      if (gameNum === 1) setStage('MINIGAME_1_COMPLETE');
      else if (gameNum === 2) setStage('MINIGAME_2_COMPLETE');
      else setStage('MINIGAME_3_COMPLETE');
    },
    []
  );

  // Mount Three.js engine once in isolated container
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new TrenchEngine(mount, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onMiniGameComplete: handleMiniGameComplete,
      onContextLost: (lost) => setContextLost(lost),
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleMiniGameComplete]);

  // Sync React stage & pause state to Three.js engine
  useEffect(() => {
    soundEngine.stopSpeaking();
    setPaused(false);
    engineRef.current?.setPaused(false);
    engineRef.current?.setStage(stage);
  }, [stage]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const handleStartMission = () => {
    soundEngine.playUiClick();
    setStats(INITIAL_STATS);
    setStage('STAGE_1_I_DO');
  };

  const handleReturnTitle = () => {
    soundEngine.playUiClick();
    setStage('TITLE');
  };

  const handleStartMiniGame = (gameNum: 1 | 2 | 3) => {
    soundEngine.playUiClick();
    if (gameNum === 1) setStage('MINIGAME_1');
    else if (gameNum === 2) setStage('MINIGAME_2');
    else setStage('MINIGAME_3');
  };

  const handleRestartMiniGame = (gameNum: 1 | 2 | 3) => {
    soundEngine.playUiClick();
    setPaused(false);
    if (gameNum === 1) {
      setStage('MINIGAME_1_INTRO');
      setTimeout(() => setStage('MINIGAME_1'), 20);
    } else if (gameNum === 2) {
      setStage('MINIGAME_2_INTRO');
      setTimeout(() => setStage('MINIGAME_2'), 20);
    } else {
      setStage('MINIGAME_3_INTRO');
      setTimeout(() => setStage('MINIGAME_3'), 20);
    }
  };

  const handleAdvanceFromComplete = (gameNum: 1 | 2 | 3) => {
    soundEngine.playUiClick();
    if (gameNum === 1) setStage('STAGE_2_WE_DO');
    else if (gameNum === 2) setStage('STAGE_3_YOU_DO');
    else {
      soundEngine.playMissionCleared();
      setStage('STAGE_4_CORE');
    }
  };

  const isArcadeStage =
    stage.startsWith('MINIGAME_1') ||
    stage.startsWith('MINIGAME_2') ||
    stage.startsWith('MINIGAME_3');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#040713]">
      {/* Dedicated isolated WebGL canvas container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0"
        aria-hidden="true"
      />

      {contextLost && (
        <div className="absolute inset-0 z-50 bg-[#040713]/95 flex items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-cyan-400/40 bg-[#080d22] p-6 space-y-3">
            <h2 className="font-display text-xl font-bold text-white">
              3D Graphics Context Paused
            </h2>
            <p className="text-sm text-slate-300">
              Your browser paused WebGL rendering. Reload the page to restore the 3D Trench Run world.
            </p>
          </div>
        </div>
      )}

      {/* Stage UI Overlays */}
      {stage === 'TITLE' && (
        <TitleScreen
          onStart={handleStartMission}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {stage === 'STAGE_1_I_DO' && (
        <Stage1Panel
          muted={muted}
          onComplete={(attempts) => {
            soundEngine.playUiClick();
            setStats((s) => ({ ...s, stage1Attempts: attempts }));
            setStage('MINIGAME_1_INTRO');
          }}
        />
      )}

      {stage === 'STAGE_2_WE_DO' && (
        <Stage2Panel
          muted={muted}
          onComplete={(attempts) => {
            soundEngine.playUiClick();
            setStats((s) => ({ ...s, stage2Attempts: attempts }));
            setStage('MINIGAME_2_INTRO');
          }}
        />
      )}

      {stage === 'STAGE_3_YOU_DO' && (
        <Stage3Panel
          muted={muted}
          onComplete={(attempts, summarySentence) => {
            soundEngine.playUiClick();
            setStats((s) => ({
              ...s,
              stage3Attempts: attempts,
              studentSummarySentence: summarySentence,
            }));
            setStage('MINIGAME_3_INTRO');
          }}
        />
      )}

      {isArcadeStage && (
        <ArcadeHUD
          stage={stage}
          hud={hud}
          engineRef={engineRef}
          paused={paused}
          muted={muted}
          onTogglePause={() => setPaused((p) => !p)}
          onToggleMute={handleToggleMute}
          onStartMiniGame={handleStartMiniGame}
          onAdvanceFromComplete={handleAdvanceFromComplete}
          onRestartMiniGame={handleRestartMiniGame}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {stage === 'STAGE_4_CORE' && (
        <Stage4CorePanel
          stats={stats}
          muted={muted}
          onReplay={handleStartMission}
          onReturnTitle={handleReturnTitle}
        />
      )}
    </div>
  );
}
