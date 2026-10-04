// Intelligent Natural Language Parser for Cash Denominations and Counts
// Handles English, Hinglish, number words, bundles, and conversational speech

export interface ParsedVoiceCommand {
  denomination: number;
  count: number;
  action: 'set' | 'add' | 'clear';
  rawText: string;
}

export interface VoiceParseResult {
  commands: ParsedVoiceCommand[];
  isResetAll: boolean;
  unrecognizedParts: string[];
}

const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  panch: 5,
  chhah: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
  pandrah: 15,
  bees: 20,
  pachees: 25,
  tees: 30,
  chaalis: 40,
  pachaas: 50,
  sau: 100,
  hazaar: 1000,
};

/**
 * Converts a sequence of English/Hindi words into an integer (e.g. "two hundred" -> 200, "fifty two" -> 52)
 */
export function wordsToNumber(text: string): number | null {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return null;

  // Direct number string?
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  const tokens = trimmed.split(/[\s-]+/);
  let total = 0;
  let current = 0;
  let matched = false;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      current += parseInt(token, 10);
      matched = true;
    } else if (WORD_TO_NUMBER[token] !== undefined) {
      matched = true;
      const val = WORD_TO_NUMBER[token];
      if (val === 100 || val === 1000 || val === 100000) {
        if (current === 0) current = 1;
        current *= val;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    }
  }

  if (!matched) return null;
  return total + current;
}

/**
 * Normalizes spoken currency words into a standard denomination value
 */
function normalizeDenomination(valStr: string, validDenominations: number[]): number | null {
  const parsed = wordsToNumber(valStr);
  if (parsed !== null && validDenominations.includes(parsed)) {
    return parsed;
  }
  // Try parsing float (e.g. 0.5, 0.25)
  const floatVal = parseFloat(valStr);
  if (!isNaN(floatVal) && validDenominations.includes(floatVal)) {
    return floatVal;
  }
  return null;
}

/**
 * Parses conversational spoken voice commands:
 * Examples:
 * - "200 notes of 500 and 52 notes of 100"
 * - "200 note 500 ke aur 52 note 100 ke"
 * - "500 notes 20, 100 notes 15"
 * - "500 ke 40 note, 200 ke 10"
 * - "add 5 notes of 500"
 * - "3 bundles of 500" (bundle = 100 notes)
 * - "clear 2000"
 * - "reset all / clear all"
 */
export function parseVoiceInput(
  rawTranscript: string,
  availableDenominations: number[] = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1]
): VoiceParseResult {
  const text = rawTranscript
    .toLowerCase()
    .replace(/[₹$,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const result: VoiceParseResult = {
    commands: [],
    isResetAll: false,
    unrecognizedParts: [],
  };

  if (!text) return result;

  // Check reset command
  if (
    text.includes('reset all') ||
    text.includes('clear all') ||
    text.includes('saaf karo') ||
    text.includes('reset karo')
  ) {
    result.isResetAll = true;
    return result;
  }

  // Split transcript by conjunctions or punctuation
  const segments = text
    .split(/[,;&]|\band\b|\baur\b|\bplus\b|\btatha\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const segment of segments) {
    let handled = false;

    // Pattern 0: Clear specific denomination (e.g. "clear 500", "remove 2000")
    const clearMatch = segment.match(/(?:clear|remove|delete|hatao)\s+(\d+|[a-z]+)/i);
    if (clearMatch) {
      const denom = normalizeDenomination(clearMatch[1], availableDenominations);
      if (denom) {
        result.commands.push({
          denomination: denom,
          count: 0,
          action: 'clear',
          rawText: segment,
        });
        handled = true;
        continue;
      }
    }

    // Pattern 1: Bundles (e.g. "2 bundles of 500", "ek bundle 100 ka")
    // 1 bundle = 100 notes
    const bundleMatch = segment.match(
      /(?:add\s+)?(\d+|[a-z\s]+)\s+(?:bundles?|gaddi|packets?)\s+(?:of|ka|ke)?\s*(\d+|[a-z]+)/i
    );
    if (bundleMatch) {
      const countVal = wordsToNumber(bundleMatch[1]);
      const denom = normalizeDenomination(bundleMatch[2], availableDenominations);
      if (countVal !== null && denom !== null) {
        const isAdd = segment.includes('add') || segment.includes('plus');
        result.commands.push({
          denomination: denom,
          count: countVal * 100, // 1 bundle = 100 notes
          action: isAdd ? 'add' : 'set',
          rawText: segment,
        });
        handled = true;
        continue;
      }
    }

    // Pattern 2: "<count> notes/coins of <denomination>"
    // e.g. "200 notes of 500", "52 notes of 100", "10 coins of 5", "5 note of 200"
    const countOfDenomMatch = segment.match(
      /(?:add\s+|put\s+|set\s+)?(\d+|[a-z\s]+)\s+(?:notes?|coins?|pieces?|pcs?|tokens?)\s+(?:of|val[ea]|wale|at)?\s*(\d+|[a-z]+)/i
    );
    if (countOfDenomMatch) {
      const countVal = wordsToNumber(countOfDenomMatch[1]);
      const denom = normalizeDenomination(countOfDenomMatch[2], availableDenominations);
      if (countVal !== null && denom !== null) {
        const isAdd = segment.includes('add') || segment.includes('plus');
        result.commands.push({
          denomination: denom,
          count: countVal,
          action: isAdd ? 'add' : 'set',
          rawText: segment,
        });
        handled = true;
        continue;
      }
    }

    // Pattern 3: Hindi/Hinglish "<denomination> ke <count> note" or "<count> note <denomination> ke"
    // e.g. "500 ke 40 note", "100 ke 52 note", "500 ka 20 note"
    const hindiDenomFirstMatch = segment.match(
      /(\d+|[a-z]+)\s+(?:ke|ka|ki|wale|waale)\s+(\d+|[a-z\s]+)\s*(?:notes?|coins?|pieces?|pcs?|gaddi)?/i
    );
    if (hindiDenomFirstMatch) {
      const denom = normalizeDenomination(hindiDenomFirstMatch[1], availableDenominations);
      const countVal = wordsToNumber(hindiDenomFirstMatch[2]);
      if (denom !== null && countVal !== null) {
        result.commands.push({
          denomination: denom,
          count: countVal,
          action: segment.includes('add') ? 'add' : 'set',
          rawText: segment,
        });
        handled = true;
        continue;
      }
    }

    // Pattern 4: "<count> of <denomination>" or "<count> times <denomination>" or "<count> x <denomination>"
    // e.g. "200 of 500", "52 of 100", "15 x 200"
    const countXDenomMatch = segment.match(
      /(\d+|[a-z\s]+)\s*(?:of|times|x|\*|gunna)\s*(\d+|[a-z]+)/i
    );
    if (countXDenomMatch) {
      const countVal = wordsToNumber(countXDenomMatch[1]);
      const denom = normalizeDenomination(countXDenomMatch[2], availableDenominations);
      if (countVal !== null && denom !== null) {
        result.commands.push({
          denomination: denom,
          count: countVal,
          action: segment.includes('add') ? 'add' : 'set',
          rawText: segment,
        });
        handled = true;
        continue;
      }
    }

    // Pattern 5: "<denomination> : <count>" or "<denomination> has <count>" or "<denomination> count <count>"
    // e.g. "500 has 200", "100 count 52"
    const denomHasCountMatch = segment.match(
      /(\d+|[a-z]+)\s*(?:has|count|quantity|pe|me)\s*(\d+|[a-z\s]+)/i
    );
    if (denomHasCountMatch) {
      const denom = normalizeDenomination(denomHasCountMatch[1], availableDenominations);
      const countVal = wordsToNumber(denomHasCountMatch[2]);
      if (denom !== null && countVal !== null) {
        result.commands.push({
          denomination: denom,
          count: countVal,
          action: 'set',
          rawText: segment,
        });
        handled = true;
        continue;
      }
    }

    // Pattern 6: Direct 2 numbers in segment, e.g. "500 200" or "200 500"
    // Disambiguate: Which one is a valid denomination?
    const numbersInSegment = segment.match(/\d+(\.\d+)?/g);
    if (numbersInSegment && numbersInSegment.length === 2) {
      const n1 = parseFloat(numbersInSegment[0]);
      const n2 = parseFloat(numbersInSegment[1]);
      if (availableDenominations.includes(n2)) {
        // First is count, second is denom (e.g. 200 of 500)
        result.commands.push({
          denomination: n2,
          count: n1,
          action: 'set',
          rawText: segment,
        });
        handled = true;
        continue;
      } else if (availableDenominations.includes(n1)) {
        // First is denom, second is count (e.g. 500 200)
        result.commands.push({
          denomination: n1,
          count: n2,
          action: 'set',
          rawText: segment,
        });
        handled = true;
        continue;
      }
    }

    if (!handled && segment.length > 2) {
      result.unrecognizedParts.push(segment);
    }
  }

  return result;
}

/**
 * Text-to-speech spoken confirmation
 */
export function speakConfirmation(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    // Prefer English/Indian accent if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang === 'en-IN' || v.name.includes('India') || v.lang.startsWith('en')
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors
  }
}
