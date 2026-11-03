import type { CorrectionTip } from "./ports";

/**
 * Small, conservative rewrite rules used by demo mode. They only fire on
 * patterns that are clearly unnatural, so demo feedback stays honest.
 */
type Rule = {
  pattern: RegExp;
  rewrite: (match: RegExpMatchArray, sentence: string) => string;
  reasonKo: string;
};

const RULES: Rule[] = [
  {
    pattern: /\bi want (?:to have |to get )?(?:a |an |one )?([a-z ]{2,30}?)(?:[.!?]|$)/i,
    rewrite: (m) => `Could I have ${/^[aeiou]/i.test(m[1].trim()) ? "an" : "a"} ${m[1].trim()}, please?`,
    reasonKo: "주문이나 요청을 할 때 'I want'는 다소 직설적으로 들려요. 'Could I have ~, please?'가 더 정중해요.",
  },
  {
    pattern: /\bgive me ([a-z ]{2,30}?)(?:[.!?]|$)/i,
    rewrite: (m) => `Could I get ${m[1].trim()}, please?`,
    reasonKo: "'Give me'는 명령처럼 들릴 수 있어요. 'Could I get ~?'로 부탁하는 느낌을 살려요.",
  },
  {
    pattern: /\bhow can i go to\b/i,
    rewrite: (_m, s) => s.replace(/how can i go to/i, "How do I get to"),
    reasonKo: "길을 물을 때는 'How do I get to ~?'가 가장 자연스러운 표현이에요.",
  },
  {
    pattern: /\bi am agree\b/i,
    rewrite: (_m, s) => s.replace(/i am agree/i, "I agree"),
    reasonKo: "'agree'는 동사라서 be동사 없이 'I agree'라고 해요.",
  },
  {
    pattern: /\bvery thank you\b/i,
    rewrite: (_m, s) => s.replace(/very thank you/i, "Thank you very much"),
    reasonKo: "감사 표현은 'Thank you very much'의 순서로 말해요.",
  },
  {
    pattern: /\bplease speak slowly\b|\bspeak slowly please\b/i,
    rewrite: () => "Could you speak a little more slowly, please?",
    reasonKo: "부탁할 때 'Could you ~?'로 시작하면 훨씬 부드럽게 들려요.",
  },
  {
    pattern: /\bi have a allergy\b/i,
    rewrite: (_m, s) => s.replace(/i have a allergy/i, "I have an allergy"),
    reasonKo: "모음 소리로 시작하는 'allergy' 앞에는 'an'을 써요.",
  },
];

export function findTip(sentence: string): CorrectionTip | null {
  const text = sentence.trim();
  for (const rule of RULES) {
    const m = text.match(rule.pattern);
    if (m) {
      const suggested = rule.rewrite(m, text);
      if (suggested.toLowerCase() !== text.toLowerCase()) {
        return { original: text, suggested, reasonKo: rule.reasonKo };
      }
    }
  }
  return null;
}

const POLITE = /\b(could|would|can) (i|you)\b|\bplease\b|\bthank(s| you)\b|\bwould you mind\b|\bi'd like\b/i;
const CONNECTORS = /\b(because|so|but|and then|actually|also|by the way)\b/i;

export function findStrengthNote(sentence: string): string | null {
  if (POLITE.test(sentence)) return "정중한 요청 표현을 자연스럽게 썼어요.";
  if (CONNECTORS.test(sentence)) return "접속어로 생각을 이어서 말했어요.";
  return null;
}
