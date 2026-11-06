const MAX_AUTO_TAGS = 5;

// Each tag lists the words that suggest it. Everyday commute words (ride, bus,
// "rest of the day") are left out on purpose so they don't tag every page.
const tagRules: Array<[tag: string, pattern: RegExp]> = [
  ["Work", /\b(office|work(ed|ing)?|projects?|clients?|sandbox|team|deadlines?|tasks?|manager|colleagues?)\b/g],
  ["University", /\b(universit(y|ies)|viva|lectures?|exams?|assignments?|campus|semester|modules?|pp[12])\b/g],
  ["Meeting", /\b(meetings?|teams call|zoom|discuss(ed|ion)?|stand-?up)\b/g],
  ["Coding", /\b(code|coding|develop(ed|ing|ment)?|deploy(ed|ing|ment)?|websites?|bugs?|api|vercel|github|frontend|backend|aws)\b/g],
  ["Design", /\b(design(ed|ing)?|redesign(ed)?|ui|ux|layouts?|figma)\b/g],
  ["Research", /\b(research(ed|ing)?|studied|analys(is|ed))\b/g],
  ["Growth", /\b(learn(ed|t|ing)?|opportunit(y|ies)|improv(e|ed|ing)|initiative|progress|skills?|goals?)\b/g],
  ["Friends", /\b(friends?|hang(ed|ing)? out|caught up)\b/g],
  ["Family", /\b(family|mom|mother|dad|father|amma|thaththa|brother|sister|aunt|uncle|cousins?|grand(ma|pa|mother|father))\b/g],
  ["Travel", /\b(trips?|travel(l?ed|l?ing)?|journey|flights?|vacation|holiday|tour)\b/g],
  ["Health", /\b(gym|workout|exercise|doctor|sick|fever|hospital|yoga)\b/g],
  ["Food", /\b(lunch|dinner|breakfast|cook(ed|ing)?|restaurant|cafe|coffee)\b/g],
  ["Quiet", /\b(relax(ed|ing)?|calm|quiet|peaceful|nap)\b/g]
];

export function suggestTags(text: string) {
  const lower = text.toLowerCase();

  return tagRules
    .map(([tag, pattern], order) => ({ tag, order, hits: lower.match(pattern)?.length ?? 0 }))
    .filter((rule) => rule.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.order - b.order)
    .slice(0, MAX_AUTO_TAGS)
    .map((rule) => rule.tag);
}
