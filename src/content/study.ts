// Study tracks: short concept lessons with a worked example and a self-check.
// Self-checks award no XP, so their answers can live in the client bundle.
export interface StudyTrack {
  id: string;
  title: string;
  tag:
    | 'Mindset'
    | 'Risk'
    | 'Math'
    | 'Process'
    | 'Behavior'
    | 'Info'
    | 'Macro'
    | 'Portfolio'
    | 'Research';
  level: number;
  /** Practice questions are drawn from this content category. */
  practiceCategory: string;
  summary: string;
  ideas: string[];
  example: { setup: string; steps: string[]; result: string };
  check: { question: string; options: string[]; answer: number; why: string };
}

export const studyTracks: StudyTrack[] = [
  {
    id: 'odds',
    title: 'Think in odds',
    tag: 'Mindset',
    level: 1,
    practiceCategory: 'Probability',
    summary:
      'Markets are uncertain, so useful predictions come with a probability. "70% likely" is more honest and easier to learn from than "it will go up".',
    ideas: [
      'Attach a confidence to every call. It forces you to weigh both sides.',
      'One right call proves little. Patterns only show up over many calls.',
      'Calibration means your 70% calls come true about 70% of the time.',
    ],
    example: {
      setup: 'You make 10 predictions, each at 70% confidence.',
      steps: [
        'If you are well calibrated, expect about 7 of the 10 to come true.',
        'Suppose only 4 come true. That is 40%, well below the 70% you claimed.',
      ],
      result:
        'You were overconfident. Next time, lower your confidence or look harder for reasons you might be wrong.',
    },
    check: {
      question:
        'You say you are 90% sure on 20 predictions and 12 are right. What does that suggest?',
      options: [
        'You are well calibrated',
        'You are overconfident',
        'You are underconfident',
        'Nothing; 20 calls is plenty to ignore',
      ],
      answer: 1,
      why: '12 of 20 is 60%, far below the 90% you stated. You were more sure than your results justify.',
    },
  },
  {
    id: 'info',
    title: 'Spot the red flags',
    tag: 'Info',
    level: 1,
    practiceCategory: 'Market basics',
    summary:
      'Before acting on any tip, sort it into fact, model or opinion, and check who is saying it and why.',
    ideas: [
      'Fact: something you can verify, like a company filing or an official rate decision.',
      'Model: a calculation that depends on assumptions. Opinion: someone’s guess.',
      'Red flags: guaranteed returns, urgency, secret groups, and advice from people who aren’t registered to give it.',
    ],
    example: {
      setup: 'A post says: "Guaranteed 5% every week! Join my VIP group before seats run out."',
      steps: [
        '"Guaranteed" returns with no stated risk: red flag.',
        '"Before seats run out" creates urgency so you skip checking: red flag.',
        'A paid private group run by someone with no stated registration: red flag.',
      ],
      result: 'Three red flags in one sentence. Walk away.',
    },
    check: {
      question: 'Which of these is the biggest red flag in an investment pitch?',
      options: [
        'It includes a price chart',
        'It promises 25% a year with no risk',
        'It lists the risks clearly',
        'It links to the company’s annual report',
      ],
      answer: 1,
      why: 'Higher returns come with higher risk. A promise of high returns with no risk is a classic sign of fraud.',
    },
  },
  {
    id: 'ev',
    title: 'Expected value and costs',
    tag: 'Math',
    level: 2,
    practiceCategory: 'Mathematics',
    summary:
      'Expected value is the average result if you could repeat a decision many times: each outcome times its probability, added up, minus costs.',
    ideas: [
      'EV = (chance of win × win size) + (chance of loss × loss size).',
      'A low win rate can still have positive EV if wins are big enough.',
      'Fees, spreads and taxes come off every trade, and can turn a small edge negative.',
    ],
    example: {
      setup:
        'A trade wins ₹3,000 with 40% probability and loses ₹1,500 with 60% probability. Costs are ₹100.',
      steps: [
        'Win part: 0.40 × ₹3,000 = ₹1,200.',
        'Loss part: 0.60 × −₹1,500 = −₹900.',
        'Before costs: ₹1,200 − ₹900 = +₹300. After costs: +₹200.',
      ],
      result:
        'Positive EV even though you lose more often than you win. If costs were ₹350, EV would be −₹50.',
    },
    check: {
      question:
        '50% chance of +₹1,000, 50% chance of −₹900, and ₹120 in costs. What is the expected value?',
      options: ['+₹100', '+₹50', '−₹70', '−₹20'],
      answer: 2,
      why: '0.5 × 1,000 − 0.5 × 900 = +₹50 before costs. Subtract ₹120 and you get −₹70 per trade.',
    },
  },
  {
    id: 'sizing',
    title: 'Position sizing and ruin',
    tag: 'Risk',
    level: 3,
    practiceCategory: 'Risk',
    summary:
      'How much you put on each idea matters as much as which idea. Oversized bets can wreck an account even when the strategy has an edge.',
    ideas: [
      'Risk a small, fixed share of the account per idea, often 1–2%.',
      'Losses need bigger gains to recover: −50% needs +100% to get back to even.',
      'Position size = amount you’re willing to lose ÷ distance to your exit.',
    ],
    example: {
      setup: 'Account: ₹1,00,000. You risk 2% per idea. Your exit is 5% below your entry.',
      steps: [
        'Amount at risk: 2% of ₹1,00,000 = ₹2,000.',
        'Position size: ₹2,000 ÷ 0.05 = ₹40,000.',
        'If the exit is hit, you lose about ₹2,000, not ₹40,000.',
      ],
      result: 'You decide the loss before you enter, and the position size follows from it.',
    },
    check: {
      question: 'Account ₹50,000, risk 1% per idea, exit 4% below entry. What position size fits?',
      options: ['₹500', '₹2,000', '₹12,500', '₹50,000'],
      answer: 2,
      why: '1% of ₹50,000 is ₹500 at risk. ₹500 ÷ 0.04 = ₹12,500.',
    },
  },
  {
    id: 'plan',
    title: 'Plan before you play',
    tag: 'Process',
    level: 3,
    practiceCategory: 'Risk',
    summary:
      'Decisions made in the moment are driven by emotion. A written plan, made before you act, gives your calm self a say.',
    ideas: [
      'A plan has a thesis, an entry, an exit if you’re wrong, an exit if you’re right, and a size.',
      'The "wrong" exit should be a fact you can observe, not a feeling.',
      'Afterwards, compare what you did with what you planned. That gap is where you learn.',
    ],
    example: {
      setup: 'Thesis: a company’s new product will lift next quarter’s sales.',
      steps: [
        'Entry: ₹500. Wrong if: the price closes below ₹480, or the launch is delayed.',
        'Right if: sales beat expectations; take half off at ₹560.',
        'Size: risk 1% of the account, so the ₹20 gap sets the share count.',
      ],
      result:
        'Every later decision is checked against this card, not against how you feel that day.',
    },
    check: {
      question: 'Which of these is a usable "I was wrong" exit?',
      options: [
        'When I start feeling nervous',
        'If the price closes below ₹480',
        'When my friends start selling',
        'There isn’t one; I’ll wait it out',
      ],
      answer: 1,
      why: 'A good exit is specific and observable, decided in advance. Feelings and other people’s moves are not.',
    },
  },
  {
    id: 'regimes',
    title: 'Market regimes and rates',
    tag: 'Macro',
    level: 4,
    practiceCategory: 'Macroeconomics',
    summary:
      'Markets move through bull, bear and sideways stretches. Interest rates, inflation and growth help shape which one you’re in.',
    ideas: [
      'Calm and stormy periods bunch together: volatility clusters.',
      'When interest rates rise, prices of existing fixed-rate bonds usually fall.',
      'A strategy that shines in one regime can struggle in the next.',
    ],
    example: {
      setup: 'You hold a bond paying 5% a year. New bonds now pay 7%.',
      steps: [
        'Nobody pays full price for 5% when they can buy 7%.',
        'So the old bond’s price falls until its yield is competitive.',
      ],
      result:
        'Rates and bond prices tend to move in opposite directions. The Strategy Lab’s market drill shows regimes in action.',
    },
    check: {
      question:
        'Interest rates rise sharply. What usually happens to existing fixed-rate bond prices?',
      options: ['They rise', 'They fall', 'They don’t change', 'They double'],
      answer: 1,
      why: 'New bonds pay more, so older lower-paying bonds become less valuable and their prices fall.',
    },
  },
  {
    id: 'testing',
    title: 'Test a strategy honestly',
    tag: 'Research',
    level: 5,
    practiceCategory: 'Mathematics',
    summary:
      'A backtest shows how a rule would have done in the past. It’s easy to fool yourself, so look for the common traps.',
    ideas: [
      'Overfitting: tuning many rules until they fit the past perfectly, then failing on new data.',
      'Survivorship bias: testing only on companies that survived, ignoring those that failed.',
      'Lookahead bias: using information you couldn’t have had at the time.',
    ],
    example: {
      setup: 'A rule "buy every stock in today’s index" is tested over the last 20 years.',
      steps: [
        'Today’s index only contains companies that did well enough to stay in it.',
        'Companies that collapsed and were dropped are missing from the test.',
      ],
      result:
        'The backtest looks better than reality. Test on the list as it was at each point in time.',
    },
    check: {
      question:
        'A strategy tested only on today’s Nifty 50 members over 20 years looks great. What’s the main flaw?',
      options: [
        'Lookahead bias',
        'Survivorship bias',
        'Too little data',
        'Nothing; it’s a fair test',
      ],
      answer: 1,
      why: 'Using only today’s survivors leaves out the companies that failed along the way.',
    },
  },
  {
    id: 'diversify',
    title: 'Diversification and time',
    tag: 'Portfolio',
    level: 6,
    practiceCategory: 'Portfolio',
    summary:
      'Combining assets that don’t move together smooths the ride. The less they move together, the bigger the benefit.',
    ideas: [
      'Correlation runs from −1 (opposite moves) to +1 (identical moves).',
      'With correlation +1, mixing two assets doesn’t reduce swings at all.',
      'Smoother portfolios are easier to hold, which helps you avoid selling at the bottom.',
    ],
    example: {
      setup: 'Two assets each swing about 20% a year. You split 50/50.',
      steps: [
        'Correlation +1: the mix still swings about 20%.',
        'Correlation 0: the mix swings about 20% ÷ √2 ≈ 14%.',
      ],
      result:
        'Same assets, same expected return, a much calmer ride when they don’t move together.',
    },
    check: {
      question: 'Two assets have correlation +1. How much does a 50/50 mix reduce swings?',
      options: ['By half', 'By about 30%', 'Not at all', 'It removes all risk'],
      answer: 2,
      why: 'With correlation +1 they move in lockstep, so mixing them gives no diversification benefit.',
    },
  },
  {
    id: 'loss',
    title: 'Losses, winners and your brain',
    tag: 'Behavior',
    level: 7,
    practiceCategory: 'Psychology',
    summary:
      'Losses feel roughly twice as painful as equal gains feel good. That pushes people to sell winners early and hold losers too long.',
    ideas: [
      'The disposition effect: selling winners faster than losers is common, even among experienced investors.',
      'What you paid is history. It doesn’t change what the asset is worth now.',
      'Ask: "Would I buy this today, at this price, knowing what I know?"',
    ],
    example: {
      setup: 'You bought at ₹200. It’s now ₹150 and the reason you bought no longer holds.',
      steps: [
        'Tempting thought: "I’ll sell once it’s back to ₹200."',
        'Better question: would I buy it today at ₹150? If not, why hold it?',
      ],
      result: 'Judge the position on its future, not on your purchase price.',
    },
    check: {
      question:
        'You bought at ₹200, it’s now ₹150 and your reason for owning it is gone. Which question helps most?',
      options: [
        'Will it get back to ₹200?',
        'Would I buy it today at ₹150 with what I know?',
        'How much have I lost so far?',
        'What did I originally pay?',
      ],
      answer: 1,
      why: 'Your purchase price is a sunk cost. The decision is about what to do from here.',
    },
  },
  {
    id: 'fomo',
    title: 'FOMO, herding and revenge trades',
    tag: 'Behavior',
    level: 7,
    practiceCategory: 'Psychology',
    summary:
      'When everyone is talking about a stock, it feels safe to join in. Research on retail herding found crowded, attention-driven buying tended to be followed by weak returns.',
    ideas: [
      'Popularity tells you attention is high, not that value is high.',
      'After a loss, people often take bigger risks to "win it back". That’s revenge trading.',
      'Simple rules help: no trade without a written plan, and a cool-down after a loss.',
    ],
    example: {
      setup: 'A stock is up 60% in a week and all over your feed.',
      steps: [
        'What you know: attention and price have both jumped.',
        'What you don’t know: whether the business is worth more than before.',
        'What the crowd is doing isn’t a plan.',
      ],
      result: 'If you can’t write a thesis and an exit, it’s FOMO, not a decision.',
    },
    check: {
      question: 'A stock is trending everywhere and up 60% this week. What does that tell you?',
      options: [
        'It will keep rising',
        'Attention is high; its value is still unknown',
        'It must be undervalued',
        'The risk is now low',
      ],
      answer: 1,
      why: 'Price momentum and attention don’t tell you what a business is worth, and crowded trades can reverse fast.',
    },
  },
];
