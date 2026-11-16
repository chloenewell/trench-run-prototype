import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Volume2,
} from 'lucide-react';
import {
  evaluateStage3Summary,
  PASSAGE_PARAGRAPHS,
  STAGE_3_CHALLENGE_1_OPTIONS,
  SummaryEvaluationResult,
} from '../data/curriculum';
import { soundEngine } from '../audio/soundEngine';
import { CipherDialogueBox, MissionStepper } from './CipherBar';

interface Stage3PanelProps {
  onComplete: (attempts: number, summarySentence: string) => void;
  muted: boolean;
}

export const Stage3Panel: React.FC<Stage3PanelProps> = ({ onComplete, muted }) => {
  const [challenge, setChallenge] = useState<1 | 2>(1);
  const [attempts, setAttempts] = useState(0);

  // Challenge 1 state
  const [slot1Id, setSlot1Id] = useState<string | null>(null);
  const [slot2Id, setSlot2Id] = useState<string | null>(null);
  const [c1Feedback, setC1Feedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [c1Passed, setC1Passed] = useState(false);

  // Challenge 2 state
  const [summaryText, setSummaryText] = useState('');
  const [evalResult, setEvalResult] = useState<SummaryEvaluationResult | null>(null);

  const paragraph = PASSAGE_PARAGRAPHS[3];

  const handleReadPassage = () => {
    const fullText = paragraph.sentences.map((s) => s.text).join(' ');
    soundEngine.speak(fullText);
  };

  const handleAssignSlot = (optionId: string) => {
    if (c1Passed) return;
    soundEngine.playUiClick();
    setC1Feedback(null);
    if (slot1Id === optionId) {
      setSlot1Id(null);
      return;
    }
    if (slot2Id === optionId) {
      setSlot2Id(null);
      return;
    }
    if (!slot1Id) {
      setSlot1Id(optionId);
    } else if (!slot2Id) {
      setSlot2Id(optionId);
    } else {
      setSlot2Id(optionId);
    }
  };

  const handleCheckChallenge1 = () => {
    if (!slot1Id || !slot2Id) {
      setC1Feedback({
        isCorrect: false,
        text: 'Select statements for both blanks before checking your chain.',
      });
      return;
    }
    setAttempts((a) => a + 1);
    const opt1 = STAGE_3_CHALLENGE_1_OPTIONS.find((o) => o.id === slot1Id)!;
    const opt2 = STAGE_3_CHALLENGE_1_OPTIONS.find((o) => o.id === slot2Id)!;

    if (opt1.role === 'slot1' && opt2.role === 'slot2') {
      soundEngine.playCheckpointSuccess();
      setC1Passed(true);
      setC1Feedback({
        isCorrect: true,
        text: 'Verified! First seeds, spores, and seabirds arrived and enriched the soil, which caused Surtsey to transform into a busy ecosystem.',
      });
    } else {
      soundEngine.playWrongOrder();
      if (opt1.role === 'distractor') {
        setC1Feedback({ isCorrect: false, text: opt1.feedbackIfMisplaced });
      } else if (opt2.role === 'distractor') {
        setC1Feedback({ isCorrect: false, text: opt2.feedbackIfMisplaced });
      } else {
        setC1Feedback({ isCorrect: false, text: opt1.feedbackIfMisplaced });
      }
    }
  };

  const handleCheckChallenge2 = () => {
    setAttempts((a) => a + 1);
    const res = evaluateStage3Summary(summaryText);
    setEvalResult(res);
    if (res.passed) {
      soundEngine.playCheckpointSuccess();
    } else {
      soundEngine.playWrongOrder();
    }
  };

  const slot1Text = STAGE_3_CHALLENGE_1_OPTIONS.find((o) => o.id === slot1Id)?.text;
  const slot2Text = STAGE_3_CHALLENGE_1_OPTIONS.find((o) => o.id === slot2Id)?.text;

  return (
    <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-6 gap-3 overflow-y-auto trench-scroll">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 max-w-5xl w-full mx-auto">
        <div>
          <span className="text-xs font-display font-bold tracking-widest text-purple-300 uppercase">
            Server Vault · Stage 3: You Do (Independent Synthesis)
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
            Challenge {challenge} of 2 · Independent Cause-and-Effect Chain
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

      {/* Main Content */}
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Paragraph 3 */}
        <div className="lg:col-span-5 rounded-2xl border border-cyan-400/35 bg-[#060a18]/93 p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-cyan-300">
              {paragraph.title}
            </h3>
            <span className="text-xs text-purple-300 font-semibold">Cipher Stepped Back</span>
          </div>
          <div className="space-y-2.5 text-base sm:text-lg leading-relaxed text-slate-100">
            {paragraph.sentences.map((s) => (
              <p key={s.id}>{s.text}</p>
            ))}
          </div>
        </div>

        {/* Right: Challenge 1 or Challenge 2 */}
        <div className="lg:col-span-7 rounded-2xl border border-purple-400/35 bg-[#060a18]/93 p-5 sm:p-6 flex flex-col justify-between gap-4">
          {challenge === 1 ? (
            <div className="space-y-4">
              <div className="text-xs font-display font-bold tracking-wider text-purple-300 uppercase">
                Challenge 1 · Construct the Causal Statement
              </div>

              <div className="p-4 rounded-xl border border-cyan-400/35 bg-[#0b132b] text-base sm:text-lg leading-relaxed text-slate-100 space-y-2">
                <span>“Because the island became safe and stable, </span>
                <button
                  type="button"
                  onClick={() => !c1Passed && setSlot1Id(null)}
                  className="inline-block px-3 py-1 my-1 rounded-lg border border-dashed border-cyan-400 bg-cyan-950/60 text-cyan-200 font-semibold text-left"
                >
                  {slot1Text ?? '[ Select First Event ]'}
                </button>
                <span>, which ultimately caused </span>
                <button
                  type="button"
                  onClick={() => !c1Passed && setSlot2Id(null)}
                  className="inline-block px-3 py-1 my-1 rounded-lg border border-dashed border-purple-400 bg-purple-950/60 text-purple-200 font-semibold text-left"
                >
                  {slot2Text ?? '[ Select Final Effect ]'}
                </button>
                <span>.”</span>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-400">
                  Choose two statements in order (click a placed box above to clear it):
                </div>
                {STAGE_3_CHALLENGE_1_OPTIONS.map((opt) => {
                  const inSlot1 = slot1Id === opt.id;
                  const inSlot2 = slot2Id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={c1Passed}
                      onClick={() => handleAssignSlot(opt.id)}
                      className={`w-full text-left p-3 rounded-xl border text-sm sm:text-base transition-colors flex items-center justify-between gap-3 ${
                        inSlot1
                          ? 'bg-cyan-950/65 border-cyan-400 text-white'
                          : inSlot2
                            ? 'bg-purple-950/65 border-purple-400 text-white'
                            : 'bg-[#0b1228] border-slate-700 hover:border-cyan-400 text-slate-100'
                      }`}
                    >
                      <span>{opt.text}</span>
                      {(inSlot1 || inSlot2) && (
                        <span className="text-xs font-display font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-200 shrink-0">
                          {inSlot1 ? 'SLOT 1' : 'SLOT 2'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {c1Feedback && (
                <div
                  className={`p-3 rounded-xl border text-sm flex items-start gap-2.5 ${
                    c1Feedback.isCorrect
                      ? 'bg-emerald-950/60 border-emerald-400/60 text-emerald-100'
                      : 'bg-amber-950/60 border-amber-400/60 text-amber-100'
                  }`}
                >
                  {c1Feedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  )}
                  <span>{c1Feedback.text}</span>
                </div>
              )}

              {!c1Passed ? (
                <button
                  type="button"
                  onClick={handleCheckChallenge1}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold text-base"
                >
                  Verify Causal Chain
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setChallenge(2);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base"
                >
                  <span>Proceed to Challenge 2</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-display font-bold tracking-wider text-purple-300 uppercase">
                Challenge 2 · Summarize in Your Own Words
              </div>
              <p className="text-base sm:text-lg font-semibold text-white">
                In your own words, write one sentence that summarizes the cause-and-effect chain of Paragraph 3.
              </p>

              <textarea
                rows={3}
                value={summaryText}
                onChange={(e) => {
                  setSummaryText(e.target.value);
                  if (evalResult && !evalResult.passed) setEvalResult(null);
                }}
                placeholder="Example: Because seeds, wind, and seabirds brought nutrients to the stable island, Surtsey grew into a busy ecosystem."
                className="w-full rounded-xl border border-cyan-400/45 bg-[#0b132b] p-3.5 text-base text-white placeholder-slate-400 focus:outline-none focus:border-cyan-300"
              />

              {/* Transparent Rule-Based Checklist */}
              <div className="rounded-xl border border-slate-800 bg-[#0b1228] p-3.5 space-y-2">
                <div className="text-xs font-display font-bold text-cyan-300 uppercase">
                  Transparent Validation Checklist
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    {evalResult?.hasCause ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={evalResult?.hasCause ? 'text-emerald-200 font-medium' : 'text-slate-300'}>
                      Includes a Cause (seeds, birds, stability)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {evalResult?.hasConnector ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={evalResult?.hasConnector ? 'text-emerald-200 font-medium' : 'text-slate-300'}>
                      Cause-Effect Connector (because, led to, so)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {evalResult?.hasEffect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={evalResult?.hasEffect ? 'text-emerald-200 font-medium' : 'text-slate-300'}>
                      Includes Effect (soil, plants, ecosystem)
                    </span>
                  </div>
                </div>
              </div>

              {evalResult && (
                <div
                  className={`p-3 rounded-xl border text-sm flex items-start gap-2.5 ${
                    evalResult.passed
                      ? 'bg-emerald-950/60 border-emerald-400/60 text-emerald-100'
                      : 'bg-amber-950/60 border-amber-400/60 text-amber-100'
                  }`}
                >
                  {evalResult.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  )}
                  <span>{evalResult.message}</span>
                </div>
              )}

              {!evalResult?.passed ? (
                <button
                  type="button"
                  onClick={handleCheckChallenge2}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-display font-bold text-base"
                >
                  Check My Sentence
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onComplete(attempts, summaryText.trim())}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base"
                >
                  <span>Enter Grid Overload: Final Run</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Cipher & Stepper */}
      <div className="max-w-5xl w-full mx-auto space-y-2.5">
        <CipherDialogueBox
          speakerLabel="CIPHER · STANDING BACK"
          text={
            challenge === 1
              ? c1Feedback?.text ??
                'I am stepping back from the console—this is your turn, Runner. Connect the cause-and-effect chain from Paragraph 3!'
              : evalResult?.message ??
                'Summarize Paragraph 3 in one clear sentence showing what caused the island to become a living ecosystem.'
          }
          mood={evalResult?.passed ? 'encouraging' : 'steppedBack'}
          muted={muted}
        />
        <MissionStepper stage="STAGE_3_YOU_DO" />
      </div>
    </div>
  );
};
