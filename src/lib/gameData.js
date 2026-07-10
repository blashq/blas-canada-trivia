// ============================================================================
// BLAS Canada Day Trivia — GAME CONFIG
// This file encodes the locked design spec as data. The engine is driven by it.
// NOTE: Question CONTENT below is DRAFT and must be completed + fact-checked in
// the content pass. The STRUCTURE and SCORING are final.
// ============================================================================

export const AVATARS = ['leaf', 'moose', 'beaver', 'bear', 'goose', 'loon']
export const TEAM_COLORS = ['#D80621', '#0B5394', '#128A6B', '#B8860B', '#7A3E9D', '#C2410C']

// Round TYPES: 'mc' | 'select-all' | 'clue-drip' | 'tf-rapid' | 'mixed' | 'wager'
export const ROUNDS = [
  // 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 'maps',
    title: 'Which Province or Territory Is This?',
    type: 'mc',
    timerSec: 20,
    scoring: { correct: 1, wrong: -1 },
    rules: 'A map shape appears. Pick the right province or territory. Some options are real places, some are made-up. No answer counts as wrong.',
    pointsLabel: '+1 correct · −1 wrong or no answer',
    questions: [
      { id: 'm1', image: 'maps/saskatchewan.svg', prompt: 'Which one is this?',
        options: [{ id: 'a', label: 'Saskatchewan' }, { id: 'b', label: 'Manitoba' }, { id: 'c', label: 'Assiniboia' }, { id: 'd', label: 'Alberta' }],
        correct: 'a', reveal: { answerName: 'Saskatchewan', flag: 'flags/sk.svg', blurb: 'Nicknamed "Land of Living Skies."' } },
      { id: 'm2', image: 'maps/nova-scotia.svg', prompt: 'Which one is this?',
        options: [{ id: 'a', label: 'New Brunswick' }, { id: 'b', label: 'Nova Scotia' }, { id: 'c', label: 'New Acadia' }, { id: 'd', label: 'Prince Edward Island' }],
        correct: 'b', reveal: { answerName: 'Nova Scotia', flag: 'flags/ns.svg', blurb: 'Latin for "New Scotland."' } },
    ],
  },
  // 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 'capitals',
    title: 'Provincial & Territorial Capitals',
    type: 'mc',
    timerSec: 20,
    scoring: { correct: 1, wrong: -1 },
    rules: 'Name the capital. Watch out — all four options are real cities from that province. No answer counts as wrong.',
    pointsLabel: '+1 correct · −1 wrong or no answer',
    questions: [
      { id: 'c1', prompt: 'What is the capital of Alberta?',
        options: [{ id: 'a', label: 'Calgary' }, { id: 'b', label: 'Edmonton' }, { id: 'c', label: 'Red Deer' }, { id: 'd', label: 'Lethbridge' }],
        correct: 'b', reveal: { answerName: 'Edmonton', flag: 'flags/ab.svg', blurb: 'Home of the largest mall in North America, West Edmonton Mall.' } },
      { id: 'c2', prompt: 'What is the capital of British Columbia?',
        options: [{ id: 'a', label: 'Vancouver' }, { id: 'b', label: 'Surrey' }, { id: 'c', label: 'Victoria' }, { id: 'd', label: 'Kelowna' }],
        correct: 'c', reveal: { answerName: 'Victoria', flag: 'flags/bc.svg', blurb: 'On the southern tip of Vancouver Island — not in the city of Vancouver!' } },
    ],
  },
  // 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 'spot',
    title: 'Spot the Canadian',
    type: 'select-all',
    timerSec: 30,
    scoring: { perCorrect: 1, perWrong: -1, mustPickOne: true },
    rules: 'Four faces. Select EVERYONE who is Canadian — could be one, could be all four. At least one always is. You must pick at least one.',
    pointsLabel: '+1 per correct pick · −1 per wrong pick',
    questions: [
      // Photos supplied by Ayaz. isCanadian marks the correct picks.
      { id: 's1', prompt: 'Who here is Canadian?',
        options: [
          { id: 'a', label: 'TBD', img: 'people/s1a.jpg', isCanadian: true },
          { id: 'b', label: 'TBD', img: 'people/s1b.jpg', isCanadian: false },
          { id: 'c', label: 'TBD', img: 'people/s1c.jpg', isCanadian: true },
          { id: 'd', label: 'TBD', img: 'people/s1d.jpg', isCanadian: false },
        ], reveal: { blurb: '' } },
    ],
  },
  // 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 'slang',
    title: 'Canadian Slang',
    type: 'mc',
    timerSec: 20,
    scoring: { correct: 1, wrong: -1 },
    rules: 'What does the word or phrase actually mean? The wrong answers are plausible on purpose. No answer counts as wrong.',
    pointsLabel: '+1 correct · −1 wrong or no answer',
    questions: [
      { id: 'sl1', prompt: 'What is a "toque"?',
        options: [{ id: 'a', label: 'A knitted winter hat' }, { id: 'b', label: 'A small canoe' }, { id: 'c', label: 'A type of mitten' }, { id: 'd', label: 'A snow shovel' }],
        correct: 'a', reveal: { blurb: 'From Canadian French; the spelling "toque" is distinctly Canadian.' } },
      { id: 'sl2', prompt: 'What is a "double-double"?',
        options: [{ id: 'a', label: 'A hockey scoring play' }, { id: 'b', label: 'A coffee with two creams and two sugars' }, { id: 'c', label: 'A long weekend' }, { id: 'd', label: 'A double cheeseburger' }],
        correct: 'b', reveal: { blurb: 'Popularized by Tim Hortons — now in the Canadian Oxford Dictionary.' } },
    ],
  },
  // 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 'city',
    title: 'Name This Canadian City',
    type: 'clue-drip',
    timerSec: 30,
    clueIntervalSec: 10,
    scoring: { tiers: [3, 2, 1], wrong: -1, mustAnswer: true },
    rules: 'Clues appear one at a time. Lock in early for more points: after clue 1 = +3, clue 2 = +2, clue 3 = +1. Wrong OR no answer = −1. Your pick is FINAL — no changing it.',
    pointsLabel: '+3 / +2 / +1 by clue · −1 wrong or no answer',
    questions: [
      { id: 'ct1',
        clues: ['This city sits where two rivers meet, the Bow and the Elbow.', 'It hosted the 1988 Winter Olympics.', 'Every July it throws "The Greatest Outdoor Show on Earth."'],
        options: [{ id: 'a', label: 'Edmonton' }, { id: 'b', label: 'Calgary' }, { id: 'c', label: 'Winnipeg' }, { id: 'd', label: 'Regina' }],
        correct: 'b', reveal: { blurb: 'Calgary — home of the Calgary Stampede.' } },
      { id: 'ct2',
        clues: ['This Atlantic port city has one of the world\'s largest natural harbours.', 'It was the closest major port to the 1912 Titanic disaster.', 'It\'s the capital of Nova Scotia.'],
        options: [{ id: 'a', label: 'St. John\'s' }, { id: 'b', label: 'Halifax' }, { id: 'c', label: 'Moncton' }, { id: 'd', label: 'Charlottetown' }],
        correct: 'b', reveal: { blurb: 'Halifax — many Titanic victims are buried here.' } },
    ],
  },
  // 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 'canadianornot',
    title: 'Canadian or Not?',
    type: 'tf-rapid',
    timerSec: 10,
    scoring: { correct: 1, wrong: -1 },
    rules: 'Rapid fire! TRUE or FALSE — is it really Canadian? 10 seconds each, no reveals until the end. No answer counts as wrong.',
    pointsLabel: '+1 correct · −1 wrong or no answer',
    questions: [
      { id: 'co1', statement: 'Basketball was invented by a Canadian.', correct: true, blurb: 'TRUE — James Naismith, from Almonte, Ontario, invented it in 1891.' },
      { id: 'co2', statement: 'The clothing brand Lululemon was founded in Canada.', correct: true, blurb: 'TRUE — founded in Vancouver in 1998.' },
      { id: 'co3', statement: 'The North Face is a Canadian company.', correct: false, blurb: 'FALSE — it was founded in San Francisco, USA.' },
    ],
  },
  // 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 'grabbag',
    title: 'General Grab-Bag',
    type: 'mc',
    timerSec: 20,
    scoring: { correct: 2, wrong: -1 },
    rules: 'A mix of everything Canadian. Worth more now — +2 for correct! No answer counts as wrong.',
    pointsLabel: '+2 correct · −1 wrong or no answer',
    questions: [
      { id: 'g1', prompt: 'In what year did Canada become a country (Confederation)?',
        options: [{ id: 'a', label: '1776' }, { id: 'b', label: '1812' }, { id: 'c', label: '1867' }, { id: 'd', label: '1931' }],
        correct: 'c', reveal: { blurb: 'July 1, 1867 — which is why we celebrate Canada Day!' } },
      { id: 'g2', prompt: 'Which is Canada\'s largest province by area?',
        options: [{ id: 'a', label: 'Ontario' }, { id: 'b', label: 'Quebec' }, { id: 'c', label: 'British Columbia' }, { id: 'd', label: 'Alberta' }],
        correct: 'b', reveal: { blurb: 'Quebec — bigger than Alaska.' } },
    ],
  },
  // 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 'blas',
    title: 'You Should Know This, BLAS!',
    type: 'mixed',
    timerSec: 15,
    multiplier: 4,
    // base values are ×1; engine multiplies by `multiplier`. Wrong is a flat -2 (see scoring.js).
    scoring: { correctBase: 1, wrongFlat: -2, drip: { tiers: [2, 1], intervalSec: 10 }, mustAnswer: true },
    rules: 'Your home turf — Canadian tax & finance, worth 4× the points! Mixed formats. Correct +4 (bank clues up to +8). Wrong or no answer −2.',
    pointsLabel: '4× scoring · correct +4 (drip +8/+4) · wrong/none −2',
    questions: [
      { id: 'b1', subtype: 'mc', prompt: 'How many provinces/territories charge NO provincial sales tax (only the 5% GST)?',
        options: [{ id: 'a', label: '2' }, { id: 'b', label: '4' }, { id: 'c', label: '5' }, { id: 'd', label: '6' }],
        correct: 'b', verify: true, reveal: { blurb: 'DRAFT — verify: Alberta + the 3 territories (Yukon, NWT, Nunavut) = 4.' } },
      { id: 'b2', subtype: 'tf', statement: 'A corporation with a January 31, 2025 year-end must file its T2 by July 31, 2025.',
        correct: true, verify: true, reveal: { blurb: 'DRAFT — verify: T2 is due 6 months after year-end.' } },
      { id: 'b3', subtype: 'bank-drip',
        clues: ['My primary brand colour is blue, and my logo is a globe.', 'I\'m the biggest bank in Canada by assets.'],
        options: [{ id: 'a', label: 'RBC' }, { id: 'b', label: 'BMO' }, { id: 'c', label: 'Scotiabank' }, { id: 'd', label: 'TD' }, { id: 'e', label: 'CIBC' }],
        correct: 'a', reveal: { blurb: 'RBC — Royal Bank of Canada.' } },
    ],
  },
]

// FINALE ────────────────────────────────────────────────────────────────────
export const FINALE = {
  id: 'wager',
  title: 'The Final Wager',
  type: 'wager',
  timerSec: 30,
  category: 'The Meaning of Canada',
  rules: 'Bet any portion of your (hidden) points with the slider, THEN see the question. Right = you gain your wager. Wrong = you lose it. This decides everything.',
  prompt: 'What does the word "Canada" actually mean?',
  options: [
    { id: 'a', label: 'The Great White North' },
    { id: 'b', label: 'Village or Settlement' },
    { id: 'c', label: 'Land of Many Rivers' },
    { id: 'd', label: 'New France' },
  ],
  correct: 'b',
  reveal: { blurb: 'It comes from the Iroquoian word "kanata," meaning village or settlement.' },
}

export const GLOBAL = {
  eventTitle: 'BLAS Canada Day Trivia',
  brandTeal: '#128A6B',   // placeholder — replaced with exact BLAS hex from logo files
  flagRed: '#D80621',
}
