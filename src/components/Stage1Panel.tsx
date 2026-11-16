import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import {
  evaluateStage1Sequence,
  PASSAGE_PARAGRAPHS,
  STAGE_1_INTRO_DIALOGUE,
  STAGE_1_MODELING_STEPS,
  STAGE_1_SEQUENCE_CARDS,
} from '../data/curriculum';
import { soundEngine } from '../audio/soundEngine';
import { CipherDialogueBox, MissionStepper } from './CipherBar';

interface Stage1PanelProps {
  onComplete: (attempts: number) => void;
  muted: boolean;
}

type Phase = 'INTRO' | 'MODELING' | 'SEQUENCE_CHECK';

export const Stage1Panel: React.FC<Stage1PanelProps> = ({ onComplete, muted }) => {
  const [phase, setPhase] = useState<Phase>('INTRO');
  const [modelStepIdx, setModelStepIdx] = useState(0);
  const [orderedIds, setOrderedIds] = useState<string[]>([
    STAGE_1_SEQUENCE_CARDS[0].id,
    STAGE_1_SEQUENCE_CARDS[1].id,
    STAGE_1_SEQUENCE_CARDS[2].id,
  ]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [passed, setPassed] = useState(false);

  const paragraph = PASSAGE_PARAGRAPHS[1];
  const currentModel = STAGE_1_MODELING_STEPS[modelStepIdx];

  const handleInitializeSequence = () => {
    soundEngine.playUiClick();
    setPhase('MODELING');
  };

  const handleNextModelStep = () => {
    soundEngine.playUiClick();
    if (modelStepIdx < STAGE_1_MODELING_STEPS.length - 1) {
      setModelStepIdx((prev) => prev + 1);
    } else {
      setPhase('SEQUENCE_CHECK');
    }
  };

  const moveCard = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedIds.length) return;
    soundEngine.playUiClick();
    const copy = [...orderedIds];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setOrderedIds(copy);
    setFeedback(null);
  };

  const handleCheckOrder = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const result = evaluateStage1Sequence(orderedIds);
    setFeedback({ isCorrect: result.isCorrect, text: result.feedback });
    if (result.isCorrect) {
      soundEngine.playCheckpointSuccess();
      setPassed(true);
    } else {
      soundEngine.playWrongOrder();
    }
  };

  const handleResetOrder = () => {
    soundEngine.playUiClick();
    setOrderedIds(STAGE_1_SEQUENCE_CARDS.map((c) => c.id));
    setFeedback(null);
  };

  const handleReadPassage = () => {
    const fullText = paragraph.sentences.map((s) => s.text).join(' ');
    soundEngine.speak(fullText);
  };

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-6 gap-3 overflow-y-auto trench-scroll">
      {/* Top Location Header */}
      <div className="flex items-center justify-between gap-4 max-w-5xl w-full mx-auto">
        <div>
          <span className="text-xs font-display font-bold tracking-widest text-cyan-300 uppercase">
            Spawn Bay · Stage 1: I Do (Guided Modeling)
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
            Tracing the Primary Cause & Resulting Effect
          </h2>
        </div>
        {!muted && phase !== 'INTRO' && (
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

      {/* Center Split Content */}
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left/Main Panel: Passage or Intro */}
        <div className="lg:col-span-7 rounded-2xl border border-cyan-400/35 bg-[#060a18]/93 p-5 sm:p-6 flex flex-col justify-between gap-4">
          {phase === 'INTRO' ? (
            <div className="space-y-4 my-auto">
              <div className="text-xs font-display font-bold tracking-wider text-purple-300 uppercase">
                Intercepted 1963 Report
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                Ready to Analyze Paragraph 1
              </h3>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
                Before launching onto the Grid Runway, Cipher will show you how to spot the <strong className="text-cyan-300">triggering cause</strong>, the <strong className="text-purple-300">middle chain link</strong>, and the <strong className="text-emerald-300">final effect</strong> inside real scientific text.
              </p>
              <button
                type="button"
                onClick={handleInitializeSequence}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold text-base tracking-wide shadow-lg focus-visible:outline-2 focus-visible:outline-white"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Initialize Sequence</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-cyan-300">
                  {paragraph.title}
                </h3>
                <span className="text-xs text-slate-400">Source Passage</span>
              </div>

              <div className="space-y-2.5 text-base sm:text-lg leading-relaxed text-slate-100">
                {paragraph.sentences.map((s) => {
                  const isHighlighted =
                    phase === 'MODELING' && currentModel.sentenceId === s.id;
                  return (
                    <p
                      key={s.id}
                      className={`p-2.5 rounded-xl transition-colors border ${
                        isHighlighted
                          ? 'bg-cyan-950/65 border-cyan-400 text-white font-medium'
                          : 'bg-transparent border-transparent text-slate-200'
                      }`}
                    >
                      {s.text}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Cipher's Think-Aloud OR Sequence Check */}
        <div className="lg:col-span-5 rounded-2xl border border-purple-400/35 bg-[#060a18]/93 p-5 sm:p-6 flex flex-col justify-between gap-4">
          {phase === 'INTRO' && (
            <div className="space-y-3 my-auto">
              <div className="text-xs font-display font-bold text-purple-300 uppercase">
                Strategy Focus
              </div>
              <ul className="space-y-2.5 text-sm sm:text-base text-slate-200">
                <li className="p-3 rounded-xl border border-slate-800 bg-[#0b1228]">
                  <strong className="text-cyan-300">1. Cause:</strong> Ask what made something happen first.
                </li>
                <li className="p-3 rounded-xl border border-slate-800 bg-[#0b1228]">
                  <strong className="text-purple-300">2. Chain Link:</strong> Notice what pushed the event forward.
                </li>
                <li className="p-3 rounded-xl border border-slate-800 bg-[#0b1228]">
                  <strong className="text-emerald-300">3. Effect:</strong> Identify the physical result created.
                </li>
              </ul>
            </div>
          )}

          {phase === 'MODELING' && (
            <div className="space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold tracking-wider text-purple-300 uppercase">
                    Cipher Think-Aloud · Step {currentModel.stepNumber} of 3
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-400/40">
                    {currentModel.tag}
                  </span>
                </div>

                <h4 className="font-display text-xl font-bold text-white">
                  {currentModel.label}
                </h4>

                <div className="p-3.5 rounded-xl border border-cyan-400/35 bg-cyan-950/35 text-sm sm:text-base text-cyan-100">
                  <span className="text-xs uppercase font-bold tracking-wider text-cyan-300 block mb-1">
                    Highlighted Text Evidence
                  </span>
                  “{currentModel.keyPhrase}”
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {STAGE_1_MODELING_STEPS.map((st, idx) => (
                    <button
                      key={st.stepNumber}
                      type="button"
                      onClick={() => setModelStepIdx(idx)}
                      className={`px-2 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        idx === modelStepIdx
                          ? 'bg-purple-600/45 border-purple-400 text-white'
                          : idx < modelStepIdx
                            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
                            : 'bg-slate-900/70 border-slate-700 text-slate-400'
                      }`}
                    >
                      {st.stepNumber}. {st.tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextModelStep}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-base transition-colors"
              >
                <span>
                  {modelStepIdx < STAGE_1_MODELING_STEPS.length - 1
                    ? 'Next Modeling Step'
                    : 'Try Quick Sequence Check'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {phase === 'SEQUENCE_CHECK' && (
            <div className="space-y-3.5 flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold tracking-wider text-purple-300 uppercase">
                    Quick Sequence Check
                  </span>
                  <button
                    type="button"
                    onClick={handleResetOrder}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base text-slate-200 font-medium">
                  Use the arrows to place the three events in exact chronological cause-and-effect order (1st → 2nd → 3rd).
                </p>
              </div>

              <div className="space-y-2.5">
                {orderedIds.map((id, idx) => {
                  const card = STAGE_1_SEQUENCE_CARDS.find((c) => c.id === id)!;
                  return (
                    <div
                      key={card.id}
                      className="rounded-xl border border-cyan-400/35 bg-[#0b132b] p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-purple-600/50 border border-purple-400 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-bold text-white leading-snug">
                            {card.label}
                          </div>
                          <div className="text-xs text-slate-300">{card.detail}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0 || passed}
                          onClick={() => moveCard(idx, -1)}
                          aria-label={`Move ${card.label} up`}
                          className="p-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-35 text-cyan-200"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderedIds.length - 1 || passed}
                          onClick={() => moveCard(idx, 1)}
                          aria-label={`Move ${card.label} down`}
                          className="p-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-35 text-cyan-200"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

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

              {!passed ? (
                <button
                  type="button"
                  onClick={handleCheckOrder}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold text-base transition-colors"
                >
                  Check Sequence
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onComplete(attempts)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base transition-colors"
                >
                  <span>Enter Grid Runway: Mini-Game 1</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Cipher Dialogue + Stepper */}
      <div className="max-w-5xl w-full mx-auto space-y-2.5">
        <CipherDialogueBox
          text={
            phase === 'INTRO'
              ? STAGE_1_INTRO_DIALOGUE
              : phase === 'MODELING'
                ? currentModel.cipherSpeech
                : feedback
                  ? feedback.text
                  : 'Your turn! Order the three events from first cause to final effect.'
          }
          mood={passed ? 'encouraging' : 'neutral'}
          muted={muted}
        />
        <MissionStepper stage="STAGE_1_I_DO" />
      </div>
    </div>
  );
};
