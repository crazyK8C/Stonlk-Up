export type ReactionType =
  'happy' | 'sad' | 'angry' | 'confused' | 'shocked' | 'celebration' | 'genius' | 'panic';
export type Mode = 'daily' | 'unlimited';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Quant';
export interface Question {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  format:
    | 'prediction'
    | 'multiple-choice'
    | 'numerical'
    | 'probability'
    | 'portfolio'
    | 'chart'
    | 'strategy';
  options: { id: string; label: string; icon: string }[];
  concept: string;
  kind: 'historical' | 'model';
  date: string;
  ticker: string;
  source: { label: string; url: string };
  reward: { xp: number; coins: number };
}
export interface ContentQuestion extends Question {
  correctAnswer: string;
  explanation: string;
  takeaway: string;
  chart?: { label: string; values: number[]; unit: string };
}
export interface Attempt {
  questionId: string;
  optionId: string;
  correct: boolean;
  xp: number;
  coins: number;
  mode: Mode;
  day: string;
  at: string;
  duration: number;
  category: string;
  difficulty?: Difficulty;
  /** How sure the player said they were, 0–100, before seeing the answer. */
  confidence?: number;
}
export interface Calibration {
  /** Predictions that carried a confidence rating. */
  count: number;
  /** Mean Brier score, 0 (perfect) to 1; null until the first rated prediction. */
  brier: number | null;
  buckets: { stated: number; hitRate: number; n: number }[];
}
export type MarketPreset = 'calm' | 'choppy' | 'crash';
export type MarketRegime = 'bull' | 'sideways' | 'bear';
export interface MarketPath {
  preset: MarketPreset;
  label: string;
  seed: number;
  prices: number[];
  regimes: MarketRegime[];
  /** Percentages, one decimal place. */
  stats: { totalReturn: number; maxDrawdown: number; annualVolatility: number; worstDay: number };
}
// ---- Event Lab ----
export type EventShelf = 'india' | 'global' | 'crowd';
export type EventSubject = 'index' | 'mix' | 'stock';
export type EventAction = 'hold' | 'trim' | 'add' | 'exit';
export interface EventMix {
  equity: number;
  debt: number;
  gold: number;
}
export interface EventPlan {
  /** Exit if your holding falls this many percent from its peak; null = no exit rule. */
  exitDrawdown: number | null;
  addRule: 'never' | 'once' | 'any';
  /** How sure you are (0–100) that your holding ends above where it started. */
  confidence: number;
  thesis: string;
}
export interface EventCard {
  id: string;
  shelf: EventShelf;
  name: string;
  when: string;
  blurb: string;
  knownThen: string;
  skill: string;
  subjects: EventSubject[];
}
export interface EventNews {
  day: number;
  kind: 'news' | 'hype';
  text: string;
}
export interface EventRunView {
  id: string;
  title: string;
  when: string;
  subject: EventSubject;
  plan: EventPlan;
  day: number;
  totalDays: number;
  checkpointEvery: number;
  done: boolean;
  /** Subject price path revealed so far, indexed to 100 at the start. */
  prices: number[];
  /** Your holding's value so far, after your decisions. */
  values: number[];
  invested: number;
  news: EventNews[];
  decisions: { day: number; action: EventAction }[];
  ruleTriggered: boolean;
}
export type RunVerdict = 'earned-win' | 'bad-beat' | 'dumb-luck' | 'deserved-loss';
export interface RunSummary {
  processScore: number;
  outcome: number;
  holdOutcome: number;
  behaviourGap: number;
  /** Checkpoints between your rule triggering and acting on it; null if it never triggered. */
  checkpointsLate: number | null;
  ruleIgnored: boolean;
  subjectDrawdown: number;
  benchmarkDrawdown: number | null;
  confidence: number;
  hit: boolean;
  brier: number;
  verdict: RunVerdict;
  tags: string[];
}
export interface EventDebrief extends EventRunView {
  eventId: string;
  eventName: string;
  eventWhen: string;
  knownThen: string;
  notKnowable: string;
  holdPath: number[];
  benchmarkPath: number[] | null;
  triggerDay: number | null;
  summary: RunSummary;
  reflection: string;
}
export interface EventRunListItem {
  id: string;
  eventId: string;
  eventName: string;
  subject: EventSubject;
  createdAt: string;
  done: boolean;
  summary: RunSummary | null;
}
export const confidenceLevels = [
  { value: 30, label: 'Guessing' },
  { value: 50, label: 'Coin flip' },
  { value: 70, label: 'Fairly sure' },
  { value: 90, label: 'Very sure' },
] as const;
export interface Profile {
  id: string;
  name: string;
  email: string;
  xp: number;
  coins: number;
  attempts: Attempt[];
  streak: number;
  level: number;
  accuracy: number;
  calibration: Calibration;
}
export interface Reveal {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  takeaway: string;
  concept: string;
  chart?: ContentQuestion['chart'];
  xp: number;
  coins: number;
  reaction: ReactionType;
  profile: Profile;
  source: Question['source'];
}
export const levels = [
  'Market Baby',
  'Market Rookie',
  'Risk Taker',
  'News Trader',
  'Quant Wannabe',
  'Portfolio Goblin',
  'Market Psychopath',
  'Quant Overlord',
];
