import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Volume2,
} from 'lucide-react';
import {
  PASSAGE_PARAGRAPHS,
  STAGE_2_Q1,
  STAGE_2_Q2,
  STAGE_2_Q3,
} from '../data/curriculum';
import { soundEngine } from '../audio/soundEngine';
import { CipherDialogueBox, MissionStepper } from './CipherBar';

interface Stage2PanelProps {
  onComplete: (attempts: number) => void;
  muted: boolean;
}

export const Stage2Panel: React.FC<Stage2PanelProps> = ({ onComplete, muted }) => {
  const [checkpoint, setCheckpoint] = useState<1 | 2 | 3>(1);
  const [attempts, setAttempts] = useState(0);
  const [errorsOnCurrent, setErrorsOnCurrent] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [cpPassed, setCpPassed] = useState(false);

  // Q1 state
  const [eliminatedQ1Ids, setEliminatedQ1Ids] = useState<string[]>([]);

  // Q3 word bank state
  const [blanks, setBlanks] = useState<(string | null)[]>([null, null, null]);

  const paragraph = PASSAGE_PARAGRAPHS[2];

  const handleReadPassage = () => {
    const fullText = paragraph.sentences.map((s) => s.text).join(' ');
    soundEngine.speak(fullText);
  };

  const handleSelectQ1 = (optId: string) => {
    if (cpPassed) return;
    const option = STAGE_2_Q1.options.find((o) => o.id === optId)!;
    setAttempts((a) => a + 1);
    setFeedback({ isCorrect: option.isCorrect, text: option.feedback });

    if (option.isCorrect) {
      soundEngine.playCheckpointSuccess();
      setCpPassed(true);
    } else {
      soundEngine.playWrongOrder();
      setErrorsOnCurrent((e) => e + 1);
      setEliminatedQ1Ids((prev) => (prev.includes(optId) ? prev : [...prev, optId]));
    }
  };

  const handleSelectSentenceQ2 = (sentenceId: string) => {
    if (checkpoint !== 2 || cpPassed) return;
    setAttempts((a) => a + 1);
    const isCorrect = sentenceId === STAGE_2_Q2.correctSentenceId;
    const text =
      STAGE_2_Q2.sentenceFeedback[sentenceId] ||
      'Check Paragraph 2 for the sentence that explains why new lava poured over the island.';
    setFeedback({ isCorrect, text });

    if (isCorrect) {
      soundEngine.playCheckpointSuccess();
      setCpPassed(true);
    } else {
      soundEngine.playWrongOrder();
      setErrorsOnCurrent((e) => e + 1);
    }
  };

  const handlePickWordQ3 = (word: string) => {
    if (cpPassed) return;
    soundEngine.playUiClick();
    const firstEmpty = blanks.findIndex((b) => b === null);
    if (firstEmpty === -1) return;
    const next = [...blanks];
    next[firstEmpty] = word;
    setBlanks(next);
    setFeedback(null);
  };

  const handleClearBlankQ3 = (idx: number) => {
    if (cpPassed) return;
    soundEngine.playUiClick();
    const next = [...blanks];
    next[idx] = null;
    setBlanks(next);
    setFeedback(null);
  };

  const handleCheckQ3 = () => {
    if (blanks.some((b) => b === null)) {
      setFeedback({
        isCorrect: false,
        text: 'Fill in all three blanks from the word bank before checking.',
      });
      return;
    }
    setAttempts((a) => a + 1);
    const isCorrect = blanks.every((b, idx) => b === STAGE_2_Q3.correctWords[idx]);
    if (isCorrect) {
      soundEngine.playCheckpointSuccess();
      setCpPassed(true);
      setFeedback({
        isCorrect: true,
        text: 'Confirmed! The rock shield resisted crashing waves, permanently protecting Surtsey from being destroyed.',
      });
    } else {
      soundEngine.playWrongOrder();
      setErrorsOnCurrent((e) => e + 1);
      if (blanks.includes('washed') || blanks.includes('weakened')) {
        setFeedback({
          isCorrect: false,
          text: 'Careful! "Washed" and "weakened" describe what happened BEFORE the shield hardened. Look at the last sentence of Paragraph 2 for what the hard shell did!',
        });
      } else {
        setFeedback({
          isCorrect: false,
          text: 'You chose great shield words, but two blanks are swapped! Read the full sentence aloud to check which word fits each spot.',
        });
      }
    }
  };

  const handleNextCheckpoint = () => {
    soundEngine.playUiClick();
    if (checkpoint < 3) {
      setCheckpoint((c) => (c + 1) as 1 | 2 | 3);
      setErrorsOnCurrent(0);
      setFeedback(null);
      setCpPassed(false);
    } else {
      onComplete(attempts);
    }
  };

  const activeWordBank =
    errorsOnCurrent >= 2 ? STAGE_2_Q3.reducedWordBank : STAGE_2_Q3.wordBank;

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-6 gap-3 overflow-y-auto trench-scroll">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 max-w-5xl w-full mx-auto">
        <div>
          <span className="text-xs font-display font-bold tracking-widest text-cyan-300 uppercase">
            Signal Tower · Stage 2: We Do (Guided Practice)
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
            Checkpoint {checkpoint} of 3 · Cause & Effect Analysis
          </h2>
        </div>

        {!muted && (
          <button
            type="button"
            onClick={handleReadPassage}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-400/40 bg-[#080d22]/90 hover:bg-cyan-950/70 text-cyan-200 text-xs sm:text-sm font-medium shrink-0"
          >
            <Volume2 className="w-4 h-4" />
            <span>Read Passage</span>
          </button>
        )}
      </div>

      {/* Main Split */}
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Paragraph 2 (interactive clickable sentences for Checkpoint 2!) */}
        <div className="lg:col-span-6 rounded-2xl border border-cyan-400/35 bg-[#060a18]/93 p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-cyan-300">
              {paragraph.title}
            </h3>
            {checkpoint === 2 && !cpPassed && (
              <span className="text-xs font-bold text-purple-300">
                Click a sentence below!
              </span>
            )}
          </div>

          <div className="space-y-2 text-base sm:text-lg leading-relaxed">
            {paragraph.sentences.map((s) => {
              const isClickable = checkpoint === 2 && !cpPassed;
              const isTargetSolved = checkpoint === 2 && cpPassed && s.id === STAGE_2_Q2.correctSentenceId;
              const isHintHighlight =
                checkpoint === 2 && errorsOnCurrent >= 2 && s.id === STAGE_2_Q2.correctSentenceId;

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => handleSelectSentenceQ2(s.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                    isTargetSolved
                      ? 'bg-emerald-950/60 border-emerald-400 text-white font-medium'
                      : isHintHighlight
                        ? 'bg-purple-950/55 border-purple-400/80 text-white'
                        : isClickable
                          ? 'bg-[#0b1228]/80 border-slate-700/80 hover:border-cyan-400 hover:bg-cyan-950/40 text-slate-100 cursor-pointer'
                          : 'bg-transparent border-transparent text-slate-200 cursor-default'
                  }`}
                >
                  {s.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Checkpoint Interaction */}
        <div className="lg:col-span-6 rounded-2xl border border-purple-400/35 bg-[#060a18]/93 p-5 sm:p-6 flex flex-col justify-between gap-4">
          {/* Checkpoint 1: Multiple Choice */}
          {checkpoint === 1 && (
            <div className="space-y-4">
              <div className="text-xs font-display font-bold tracking-wider text-purple-300 uppercase">
                Interaction Type: Multiple Choice
              </div>
              <p className="text-base sm:text-lg font-semibold text-white leading-snug">
                {STAGE_2_Q1.prompt}
              </p>

              <div className="space-y-2.5">
                {STAGE_2_Q1.options.map((opt, idx) => {
                  const isEliminated = eliminatedQ1Ids.includes(opt.id) && errorsOnCurrent >= 2 && !opt.isCorrect;
                  const isSolvedOpt = cpPassed && opt.isCorrect;
                  if (isEliminated) return null;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={cpPassed}
                      onClick={() => handleSelectQ1(opt.id)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm sm:text-base transition-colors flex items-start gap-3 ${
                        isSolvedOpt
                          ? 'bg-emerald-950/65 border-emerald-400 text-white font-semibold'
                          : 'bg-[#0b132b] border-slate-700 hover:border-cyan-400 text-slate-100'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-md bg-purple-600/40 border border-purple-400/60 text-xs font-display font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {errorsOnCurrent >= 2 && !cpPassed && (
                <div className="p-3 rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-sm text-cyan-100 flex items-start gap-2.5">
                  <Lightbulb className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                  <span>{STAGE_2_Q1.clue} (Incorrect choice narrowed!)</span>
                </div>
              )}
            </div>
          )}

          {/* Checkpoint 2: Clickable Sentence Evidence */}
          {checkpoint === 2 && (
            <div className="space-y-4">
              <div className="text-xs font-display font-bold tracking-wider text-purple-300 uppercase">
                Interaction Type: Clickable Sentence Evidence
              </div>
              <p className="text-base sm:text-lg font-semibold text-white leading-snug">
                {STAGE_2_Q2.prompt}
              </p>
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#0b132b] text-sm sm:text-base text-slate-200">
                Click directly on the sentence inside Paragraph 2 on the left panel to lock in your evidence!
              </div>
              {errorsOnCurrent >= 2 && !cpPassed && (
                <div className="p-3 rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-sm text-cyan-100 flex items-start gap-2.5">
                  <Lightbulb className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                  <span>{STAGE_2_Q2.clue}</span>
                </div>
              )}
            </div>
          )}

          {/* Checkpoint 3: Word Bank Fill-in-the-Blank */}
          {checkpoint === 3 && (
            <div className="space-y-4">
              <div className="text-xs font-display font-bold tracking-wider text-purple-300 uppercase">
                Interaction Type: Word Bank Completion
              </div>
              <p className="text-base sm:text-lg font-semibold text-white leading-snug">
                {STAGE_2_Q3.prompt}
              </p>

              {/* Sentence with interactive blanks */}
              <div className="p-4 rounded-xl border border-cyan-400/35 bg-[#0b132b] text-base sm:text-lg leading-loose text-slate-100">
                <span>{STAGE_2_Q3.sentenceTemplate[0]}</span>
                <button
                  type="button"
                  onClick={() => handleClearBlankQ3(0)}
                  className="mx-1 px-3 py-0.5 rounded-lg border border-dashed border-cyan-400 bg-cyan-950/50 text-cyan-200 font-bold"
                >
                  {blanks[0] ?? '___ 1 ___'}
                </button>
                <span>{STAGE_2_Q3.sentenceTemplate[1]}</span>
                <button
                  type="button"
                  onClick={() => handleClearBlankQ3(1)}
                  className="mx-1 px-3 py-0.5 rounded-lg border border-dashed border-cyan-400 bg-cyan-950/50 text-cyan-200 font-bold"
                >
                  {blanks[1] ?? '___ 2 ___'}
                </button>
                <span>{STAGE_2_Q3.sentenceTemplate[2]}</span>
                <button
                  type="button"
                  onClick={() => handleClearBlankQ3(2)}
                  className="mx-1 px-3 py-0.5 rounded-lg border border-dashed border-cyan-400 bg-cyan-950/50 text-cyan-200 font-bold"
                >
                  {blanks[2] ?? '___ 3 ___'}
                </button>
                <span>{STAGE_2_Q3.sentenceTemplate[3]}</span>
              </div>

              {/* Word Bank buttons */}
              <div>
                <div className="text-xs text-slate-400 mb-2">
                  Word Bank (click a word to place it; click a blank to clear):
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeWordBank.map((word) => {
                    const alreadyUsed = blanks.includes(word);
                    return (
                      <button
                        key={word}
                        type="button"
                        disabled={alreadyUsed || cpPassed}
                        onClick={() => handlePickWordQ3(word)}
                        className="px-3.5 py-2 rounded-lg border border-purple-400/50 bg-purple-950/45 hover:bg-purple-900/60 disabled:opacity-35 text-sm sm:text-base font-semibold text-white transition-colors"
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorsOnCurrent >= 2 && !cpPassed && (
                <div className="p-3 rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-sm text-cyan-100 flex items-start gap-2.5">
                  <Lightbulb className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                  <span>{STAGE_2_Q3.clue} (Extra distractor words removed!)</span>
                </div>
              )}

              {!cpPassed && (
                <button
                  type="button"
                  onClick={handleCheckQ3}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold text-base transition-colors"
                >
                  Verify Cause & Effect
                </button>
              )}
            </div>
          )}

          {/* Feedback + Next */}
          <div className="space-y-3">
            {feedback && (
              <div
                className={`p-3 rounded-xl border text-sm flex items-start gap-2.5 ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/60 border-emerald-400/60 text-emerald-100'
                    : 'bg-amber-950/60 border-amber-400/60 text-amber-100'
                }`}
              >
                {feedback.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {cpPassed && (
              <button
                type="button"
                onClick={handleNextCheckpoint}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base transition-colors"
              >
                <span>
                  {checkpoint < 3
                    ? `Continue to Checkpoint ${checkpoint + 1}`
                    : 'Enter Driftline Chase: Mini-Game 2'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Cipher & Stepper */}
      <div className="max-w-5xl w-full mx-auto space-y-2.5">
        <CipherDialogueBox
          text={
            feedback
              ? feedback.text
              : "Let's analyze Paragraph 2 together. I'll ask, you find the evidence, and we'll build the stabilization chain!"
          }
          mood={cpPassed ? 'encouraging' : 'neutral'}
          muted={muted}
        />
        <MissionStepper stage="STAGE_2_WE_DO" />
      </div>
    </div>
  );
};
