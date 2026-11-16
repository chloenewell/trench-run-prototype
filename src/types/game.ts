export type GameStage =
  | 'TITLE'
  | 'STAGE_1_I_DO'
  | 'MINIGAME_1_INTRO'
  | 'MINIGAME_1'
  | 'MINIGAME_1_COMPLETE'
  | 'STAGE_2_WE_DO'
  | 'MINIGAME_2_INTRO'
  | 'MINIGAME_2'
  | 'MINIGAME_2_COMPLETE'
  | 'STAGE_3_YOU_DO'
  | 'MINIGAME_3_INTRO'
  | 'MINIGAME_3'
  | 'MINIGAME_3_COMPLETE'
  | 'STAGE_4_CORE';

export type StageEnvironment =
  | 'SPAWN_BAY'
  | 'GRID_RUNWAY_1'
  | 'SIGNAL_TOWER'
  | 'GRID_RUNWAY_2'
  | 'SERVER_VAULT'
  | 'MAINFRAME_CANYON'
  | 'THE_CORE';

export interface MiniGameHUDState {
  activeGame: 1 | 2 | 3 | null;
  collectedCount: number;
  totalRequired: number;
  nextLabel: string;
  progressPercent: number;
  speedMultiplier: number;
  boostTimer: number;
  slowdownTimer: number;
  shieldFlashTimer: number;
  elapsedSeconds: number;
  feedbackBanner: {
    type: 'success' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
  } | null;
}

export interface MissionStats {
  stage1Attempts: number;
  stage2Attempts: number;
  stage3Attempts: number;
  mg1WrongOrderHits: number;
  mg2WrongOrderHits: number;
  mg3BarrierBumps: number;
  mg1TimeSeconds: number;
  mg2TimeSeconds: number;
  mg3TimeSeconds: number;
  studentSummarySentence: string;
}

export interface PassageSentence {
  id: string;
  text: string;
  role?: 'context' | 'trigger' | 'intermediate' | 'result' | 'cause' | 'effect';
}
