import type { ReactionType } from '../shared/types.js';
const cats: Record<ReactionType, { emoji: string; message: string }> = {
  happy: { emoji: '1f63a', message: 'THE CAT APPROVES.' },
  sad: { emoji: '1f63f', message: 'A loss. A lesson. A little meow.' },
  angry: { emoji: '1f63e', message: 'The market has some notes.' },
  confused: { emoji: '1f640', message: 'Bro. What was that?' },
  shocked: { emoji: '1f640', message: 'That escalated quickly.' },
  celebration: { emoji: '1f63b', message: 'LET’S GOOOOOO.' },
  genius: { emoji: '1f63c', message: 'Big brain. Tiny paws.' },
  panic: { emoji: '1f639', message: 'Emotionally short on this one.' },
};
export function reaction(type: ReactionType) {
  return {
    ...cats[type],
    type,
    provider: 'twemoji',
    url: `/reactions/${cats[type].emoji}.svg`,
    attribution: 'Twemoji graphics © Twitter and contributors, CC BY 4.0',
    license: 'https://creativecommons.org/licenses/by/4.0/',
  };
}
