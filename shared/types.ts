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
}
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
