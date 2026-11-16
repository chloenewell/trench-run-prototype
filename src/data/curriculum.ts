import { PassageSentence } from '../types/game';

export const PASSAGE_PARAGRAPHS: Record<1 | 2 | 3, { title: string; sentences: PassageSentence[] }> = {
  1: {
    title: 'Paragraph 1: Birth of Surtsey (1963)',
    sentences: [
      {
        id: 'p1-s1',
        text: 'In November 1963, crew members on a fishing boat near Iceland smelled something strange in the air.',
        role: 'context',
      },
      {
        id: 'p1-s2',
        text: 'Suddenly, a massive column of black ash ripped through the ocean surface, signaling a violent underwater volcanic eruption deep beneath the sea floor.',
        role: 'trigger',
      },
      {
        id: 'p1-s3',
        text: 'This intense pressure pushed molten rock upward, fighting against the crashing waves until cooling lava piled up above the water.',
        role: 'intermediate',
      },
      {
        id: 'p1-s4',
        text: 'By the next morning, a brand-new island, named Surtsey, stood proudly where open ocean had been just hours before, showing how a sudden trigger can create an immediate physical effect.',
        role: 'result',
      },
    ],
  },
  2: {
    title: 'Paragraph 2: Fighting Wind and Waves',
    sentences: [
      {
        id: 'p2-s1',
        text: 'At first, scientists worried that this new land would not last.',
        role: 'context',
      },
      {
        id: 'p2-s2',
        text: 'Fierce ocean currents and strong arctic winds immediately battered the raw, unprotected volcanic rock.',
        role: 'cause',
      },
      {
        id: 'p2-s3',
        text: 'This caused rapid erosion that washed loose ash straight back into the sea.',
        role: 'effect',
      },
      {
        id: 'p2-s4',
        text: 'However, because the underwater crack kept erupting over the next few months, new layers of liquid lava poured across the island.',
        role: 'cause',
      },
      {
        id: 'p2-s5',
        text: 'When this special lava cooled, it hardened into a tough rock shield.',
        role: 'intermediate',
      },
      {
        id: 'p2-s6',
        text: 'This hard shell successfully resisted the crashing waves, permanently protecting Surtsey from being destroyed by the wind and water.',
        role: 'effect',
      },
    ],
  },
  3: {
    title: 'Paragraph 3: A Living Ecosystem',
    sentences: [
      {
        id: 'p3-s1',
        text: 'Once the island was safe and stable, an amazing chain reaction brought life to the bare rock.',
        role: 'context',
      },
      {
        id: 'p3-s2',
        text: 'Ocean currents washed floating seeds onto the new shores, while strong winds carried tiny moss spores across the water.',
        role: 'cause',
      },
      {
        id: 'p3-s3',
        text: 'Soon after, traveling seabirds began building nests along the hard stone cliffs.',
        role: 'cause',
      },
      {
        id: 'p3-s4',
        text: 'These birds brought important nutrients that quickly enriched the empty volcanic soil.',
        role: 'intermediate',
      },
      {
        id: 'p3-s5',
        text: 'Within just a few decades, this quiet volcanic structure changed from a lonely island born of fire into a busy ecosystem filled with plants, insects, and animals.',
        role: 'effect',
      },
    ],
  },
};

export interface IdoModelStep {
  stepNumber: number;
  label: string;
  tag: string;
  sentenceId: string;
  cipherSpeech: string;
  keyPhrase: string;
}

export const STAGE_1_INTRO_DIALOGUE =
  "Systems are live. Welcome to the Trench. I'm Cipher, your navigator. We intercepted a historic report from 1963 about an island that formed out of nowhere. We need to trace the exact cause-and-effect chain that built it.";

export const STAGE_1_MODELING_STEPS: IdoModelStep[] = [
  {
    stepNumber: 1,
    label: 'Primary Trigger (Cause)',
    tag: 'CAUSE',
    sentenceId: 'p1-s2',
    keyPhrase: 'violent underwater volcanic eruption deep beneath the sea floor',
    cipherSpeech:
      'First, I look for what started everything—the primary trigger. Sentence 2 tells us a massive column of black ash signaled a violent underwater volcanic eruption. That eruption is our starting cause!',
  },
  {
    stepNumber: 2,
    label: 'Intermediate Event',
    tag: 'LINK',
    sentenceId: 'p1-s3',
    keyPhrase: 'intense pressure pushed molten rock upward ... cooling lava piled up',
    cipherSpeech:
      'Next, I trace what happened right because of that eruption. Intense pressure pushed molten rock upward, and cooling lava piled up above the water.',
  },
  {
    stepNumber: 3,
    label: 'Result (Effect)',
    tag: 'EFFECT',
    sentenceId: 'p1-s4',
    keyPhrase: 'a brand-new island, named Surtsey, stood proudly',
    cipherSpeech:
      'Finally, I find the physical result: by the next morning, a brand-new island named Surtsey stood where open ocean had been. One event triggered the next in a clear chain!',
  },
];

export interface SequenceCardItem {
  id: string;
  correctOrder: number;
  label: string;
  detail: string;
}

export const STAGE_1_SEQUENCE_CARDS: SequenceCardItem[] = [
  {
    id: 'seq-island',
    correctOrder: 3,
    label: 'A new island, Surtsey, forms',
    detail: 'Land rises above open ocean by morning.',
  },
  {
    id: 'seq-eruption',
    correctOrder: 1,
    label: 'Underwater volcanic eruption',
    detail: 'Black ash rips through the ocean surface.',
  },
  {
    id: 'seq-lava',
    correctOrder: 2,
    label: 'Molten rock & lava pile up',
    detail: 'Intense pressure pushes lava upward to cool.',
  },
];

export function evaluateStage1Sequence(orderedIds: string[]): {
  isCorrect: boolean;
  feedback: string;
} {
  const correctIds = ['seq-eruption', 'seq-lava', 'seq-island'];
  if (orderedIds.length !== 3) {
    return {
      isCorrect: false,
      feedback: 'Place all three events into the sequence slots before running the check.',
    };
  }
  const isExact = orderedIds.every((id, idx) => id === correctIds[idx]);
  if (isExact) {
    return {
      isCorrect: true,
      feedback:
        'Chain locked! Eruption (cause) pushed molten rock upward (link), which built Surtsey Island (effect). Ready for the Grid Runway!',
    };
  }
  if (orderedIds[0] === 'seq-island') {
    return {
      isCorrect: false,
      feedback:
        'Check your starting cause! Putting "A new island forms" first reverses cause and effect—an island cannot appear before the eruption and lava pile-up happen.',
    };
  }
  if (orderedIds[0] === 'seq-lava') {
    return {
      isCorrect: false,
      feedback:
        'Almost! Molten rock and lava piling up is the middle link, not the first trigger. Ask: what caused the molten rock to push upward in the first place?',
    };
  }
  if (orderedIds[1] === 'seq-island' && orderedIds[2] === 'seq-lava') {
    return {
      isCorrect: false,
      feedback:
        'You found the starting eruption! Watch the last two steps though: cooling lava has to pile up ABOVE the water BEFORE the new island can exist.',
    };
  }
  return {
    isCorrect: false,
    feedback:
      'Look back at Paragraph 1: first comes the underwater eruption, then cooling lava piles up, and finally the island stands above the sea.',
  };
}

// Mini-Game 1 packets (Paragraph 1 causal chain)
export interface CausalPacketSpec {
  order: number; // 1-based
  shortLabel: string;
  fullText: string;
  wrongOrderHint: string;
}

export const MINIGAME_1_PACKETS: CausalPacketSpec[] = [
  {
    order: 1,
    shortLabel: '1. Underwater Eruption',
    fullText: 'Violent underwater volcanic eruption begins',
    wrongOrderHint: 'This is the very first trigger! Start with the eruption beneath the sea floor.',
  },
  {
    order: 2,
    shortLabel: '2. Pressure & Ash',
    fullText: 'Black ash & intense pressure push molten rock up',
    wrongOrderHint: 'Pressure pushes molten rock upward right after the volcano erupts—not before!',
  },
  {
    order: 3,
    shortLabel: '3. Lava Piles Up',
    fullText: 'Cooling lava piles up above the waves',
    wrongOrderHint: 'Molten rock must push upward before cooling lava can pile up above the water.',
  },
  {
    order: 4,
    shortLabel: '4. Island Surtsey Forms',
    fullText: 'New island Surtsey stands above the ocean',
    wrongOrderHint: 'Hold on! Surtsey is the final EFFECT—lava must erupt and pile up first!',
  },
];

// Stage 2 (Signal Tower - WE DO) Checkpoints
export interface Stage2MCQuestion {
  prompt: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  clue: string;
}

export const STAGE_2_Q1: Stage2MCQuestion = {
  prompt: 'Checkpoint 1: What was the direct EFFECT of fierce ocean currents and arctic winds striking the raw volcanic rock?',
  options: [
    {
      id: 'q1-a',
      label: 'Rapid erosion washed loose ash straight back into the sea.',
      isCorrect: true,
      feedback:
        'Spot on! Wind and waves battered the unprotected rock (cause), which led to rapid erosion washing ash into the sea (effect).',
    },
    {
      id: 'q1-b',
      label: 'The ocean currents forced the underwater crack to start erupting.',
      isCorrect: false,
      feedback:
        'Check Paragraph 2 carefully: ocean currents battered the outside of the island—they did not cause the underground volcano to erupt.',
    },
    {
      id: 'q1-c',
      label: 'The loose ash immediately hardened into a tough rock shield.',
      isCorrect: false,
      feedback:
        'Not quite! Look at sentences 2 and 3: loose ash was washed away by erosion. The tough shield came months later from liquid lava.',
    },
  ],
  clue: 'Clue: Look at the third sentence of Paragraph 2, starting with "This caused..."',
};

export const STAGE_2_Q2 = {
  prompt:
    'Checkpoint 2: Click the sentence in Paragraph 2 that explains the original CAUSE of the island’s permanent stabilization (what kept adding new rock?).',
  correctSentenceId: 'p2-s4',
  sentenceFeedback: {
    'p2-s1':
      'That sentence shares how scientists felt at first—it does not explain what caused the island to stabilize.',
    'p2-s2':
      'Careful! That describes wind and waves wearing the island DOWN, which is the opposite of stabilizing it.',
    'p2-s3':
      'That describes erosion washing ash away. Look for the sentence with the signal word "because"!',
    'p2-s4':
      'Exact match! Notice the signal word "because": because the underwater crack kept erupting, new liquid lava poured out to build a protective layer.',
    'p2-s5':
      'Very close! That sentence explains how the lava cooled into a shield, which happened right after. Click the sentence just before it with the word "because" to see the root cause!',
    'p2-s6':
      'Watch out for cause vs. effect! Sentence 6 shows the final EFFECT (Surtsey was protected), not what caused the new rock layers to appear.',
  } as Record<string, string>,
  clue: 'Clue: Scan Paragraph 2 for the signal word "because" in sentence 4!',
};

export const STAGE_2_Q3 = {
  prompt: 'Checkpoint 3: Complete the statement about the direct EFFECT of the hardened lava shield.',
  sentenceTemplate: [
    'The tough rock shield ',
    ' the crashing waves, ',
    ' Surtsey from being ',
    ' by wind and water.',
  ],
  correctWords: ['resisted', 'permanently protecting', 'destroyed'],
  wordBank: ['resisted', 'permanently protecting', 'destroyed', 'washed', 'weakened'],
  reducedWordBank: ['resisted', 'permanently protecting', 'destroyed'],
  clue: 'Clue: Check the last sentence of Paragraph 2. The hard shell resisted waves and kept the island safe!',
};

// Mini-Game 2 (Driftline Chase) - 5 Cause Nodes from Paragraph 2 leading to Effect Container
export const MINIGAME_2_NODES: CausalPacketSpec[] = [
  {
    order: 1,
    shortLabel: '1. Crack Keeps Erupting',
    fullText: 'Underwater crack erupts for months',
    wrongOrderHint: 'Start with Node 1: the underwater crack kept erupting over several months.',
  },
  {
    order: 2,
    shortLabel: '2. Liquid Lava Pours',
    fullText: 'New layers of liquid lava pour across the island',
    wrongOrderHint: 'Lava can only pour across the island after the crack keeps erupting!',
  },
  {
    order: 3,
    shortLabel: '3. Tough Rock Shield',
    fullText: 'Cooling lava hardens into a rock shield',
    wrongOrderHint: 'First liquid lava pours out, THEN it cools into a tough rock shield.',
  },
  {
    order: 4,
    shortLabel: '4. Resists Crashing Waves',
    fullText: 'Hard shell resists waves and arctic winds',
    wrongOrderHint: 'The rock must harden into a shield before it can resist the crashing waves!',
  },
  {
    order: 5,
    shortLabel: '5. Island Stays Protected',
    fullText: 'Surtsey is safe and permanently stable',
    wrongOrderHint: 'Node 5 is the final stabilization—intercept the earlier nodes first!',
  },
];

// Stage 3 (Server Vault - YOU DO)
export interface CausalSlotOption {
  id: string;
  text: string;
  role: 'slot1' | 'slot2' | 'distractor';
  feedbackIfMisplaced: string;
}

export const STAGE_3_CHALLENGE_1_OPTIONS: CausalSlotOption[] = [
  {
    id: 'c3-seeds-birds',
    text: 'floating seeds, moss spores, and nesting seabirds arrived and enriched the soil',
    role: 'slot1',
    feedbackIfMisplaced:
      'Wait—the arrival of seeds, spores, and birds happened BEFORE the full ecosystem grew. Try placing that in the first blank!',
  },
  {
    id: 'c3-ecosystem',
    text: 'the bare volcanic rock transformed into a busy ecosystem with plants, insects, and animals',
    role: 'slot2',
    feedbackIfMisplaced:
      'Think about the order: the busy ecosystem was the FINAL outcome ("which ultimately caused..."), not the first step!',
  },
  {
    id: 'c3-lava-shield',
    text: 'liquid lava melted all the plants and pushed the seabirds away',
    role: 'distractor',
    feedbackIfMisplaced:
      'Check Paragraph 3: by the time life arrived, the island was already safe and stable—lava did not destroy the plants.',
  },
  {
    id: 'c3-erosion',
    text: 'fierce waves washed all the loose ash away so nothing could grow',
    role: 'distractor',
    feedbackIfMisplaced:
      'That happened in Paragraph 2 before the lava shield formed! Paragraph 3 explains how life grew AFTER Surtsey became stable.',
  },
];

export interface SummaryEvaluationResult {
  passed: boolean;
  hasCause: boolean;
  hasConnector: boolean;
  hasEffect: boolean;
  message: string;
}

export function evaluateStage3Summary(input: string): SummaryEvaluationResult {
  const text = input.trim().toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const causeKeywords = [
    'safe',
    'stable',
    'shield',
    'seed',
    'spore',
    'moss',
    'wind',
    'current',
    'wave',
    'ocean',
    'bird',
    'seabird',
    'nutrient',
    'nest',
  ];
  const connectorKeywords = [
    'because',
    'since',
    'so',
    'caused',
    'cause',
    'led to',
    'lead to',
    'resulted',
    'brought',
    'enriched',
    'changed',
    'turned',
    'helped',
    'allowed',
    'made',
    'created',
    'therefore',
    'once',
    'when',
    'which',
  ];
  const effectKeywords = [
    'ecosystem',
    'life',
    'living',
    'plant',
    'insect',
    'animal',
    'soil',
    'grow',
    'grew',
    'busy',
    'home',
    'habitat',
    'nature',
  ];

  const hasCause = causeKeywords.some((kw) => text.includes(kw));
  const hasConnector = connectorKeywords.some((kw) => text.includes(kw));
  const hasEffect = effectKeywords.some((kw) => text.includes(kw));

  if (wordCount < 5) {
    return {
      passed: false,
      hasCause,
      hasConnector,
      hasEffect,
      message:
        'Write a complete sentence (at least 5 words) connecting a cause from Paragraph 3 to its effect.',
    };
  }

  if (hasCause && hasConnector && hasEffect) {
    return {
      passed: true,
      hasCause,
      hasConnector,
      hasEffect,
      message:
        'Strong causal summary! Your sentence connects an accurate trigger (seeds, winds, birds, or stability) to the resulting living ecosystem.',
    };
  }

  const missing: string[] = [];
  if (!hasCause) missing.push('what caused the change (like seeds, spores, seabirds, or a stable island)');
  if (!hasConnector) missing.push('a cause-and-effect connector (like because, so, led to, or enriched)');
  if (!hasEffect) missing.push('the final effect (like enriched soil, plants, animals, or a busy ecosystem)');

  return {
    passed: false,
    hasCause,
    hasConnector,
    hasEffect,
    message: `Almost there! Try revising your sentence to include ${missing.join(' and ')}.`,
  };
}

// Mini-Game 3 (Grid Overload) - 5 Full Chain Links activated by passing 5 Firewall Barriers
export const MINIGAME_3_CHAIN_LINKS = [
  {
    order: 1,
    shortLabel: '1. Underwater Eruption',
    description: 'Deep volcanic pressure cracks the sea floor.',
  },
  {
    order: 2,
    shortLabel: '2. Island Formation',
    description: 'Piled lava creates Surtsey above the waves.',
  },
  {
    order: 3,
    shortLabel: '3. Lava Shield Stabilization',
    description: 'Cooled lava forms a rock shell against erosion.',
  },
  {
    order: 4,
    shortLabel: '4. Arrival of Seeds & Birds',
    description: 'Winds, currents, and seabirds enrich the soil.',
  },
  {
    order: 5,
    shortLabel: '5. Developing Ecosystem',
    description: 'Bare volcanic stone transforms into living habitat.',
  },
];

export const STAGE_4_FULL_CHAIN = [
  {
    step: 1,
    title: 'Underwater eruption',
    caption: '1963 volcanic pressure rips through the sea floor.',
  },
  {
    step: 2,
    title: 'Island formation',
    caption: 'Cooling lava piles up above the waves to form Surtsey.',
  },
  {
    step: 3,
    title: 'Lava shield stabilization',
    caption: 'Months of fresh lava cool into a permanent rock shield.',
  },
  {
    step: 4,
    title: 'Arrival of seeds and birds',
    caption: 'Currents, winds, and nesting seabirds enrich the soil.',
  },
  {
    step: 5,
    title: 'Developing ecosystem',
    caption: 'A quiet rock grows into a busy home for plants and animals.',
  },
];
