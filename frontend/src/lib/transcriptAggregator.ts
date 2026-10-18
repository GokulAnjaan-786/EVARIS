/**
 * EVARIS Real-Time Transcript Aggregation & Deduplication Engine.
 * 
 * Combines incoming speech recognition chunks into a coherent, continuous transcript.
 * Eliminates acoustic boundary overlap repetitions (e.g. from buffer lookbacks),
 * handles partial vs final transcription states, filters silence hallucinations,
 * and formats flowing, readable sentences without artificial numbering.
 */

// Common Whisper silence/noise hallucinations
const HALLUCINATED_PHRASES = new Set([
  "thanks for watching",
  "thanks for watching.",
  "thanks for watching!",
  "thank you for watching",
  "thank you for watching.",
  "thank you.",
  "thank you",
  "thanks for listening",
  "thanks for listening.",
  "bye",
  "bye.",
  "bye bye",
  "bye. bye.",
  "bye-bye",
  "please subscribe",
  "subscribe to my channel",
  "see you next time",
  "you are just",
  "you are just.",
  "subtitles by",
]);

const HALLUCINATION_REGEX = /^(\s*(thanks? (you )?(very much )?for (watching|listening)|bye|goodbye|please subscribe|subscribe to (my|the) channel|see you (next time|soon)|you are just|subtitles by)[.!,? ]*)+$/i;

/**
 * Checks if a transcribed chunk is an empty silence artifact or known hallucination.
 */
export function isHallucinatedSilence(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (HALLUCINATION_REGEX.test(trimmed)) return true;
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  if (HALLUCINATED_PHRASES.has(normalized)) return true;
  return false;
}

/**
 * Cleans a word for comparison (lowercased, alphanumeric only).
 */
function cleanWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Merges an incoming finalized transcript segment into the existing accumulated transcript,
 * detecting and stripping overlapping prefix words caused by acoustic boundary lookbacks.
 * Preserves the exact teacher's spoken vocabulary and ensures natural sentence continuation.
 */
export function mergeTranscriptSegments(existingText: string, incomingSegment: string): string {
  const incoming = incomingSegment.trim();
  if (!incoming) return existingText;
  if (isHallucinatedSilence(incoming)) return existingText;

  const existing = existingText.trim();
  if (!existing) {
    // Capitalize first character if needed
    return incoming.charAt(0).toUpperCase() + incoming.slice(1);
  }

  const existingWords = existing.split(/\s+/);
  const incomingWords = incoming.split(/\s+/);

  const cleanExisting = existingWords.map(cleanWord);
  const cleanIncoming = incomingWords.map(cleanWord);

  // Check for word-level overlap: compare suffix of existing with prefix of incoming
  // Check overlap lengths up to 8 words (or max available)
  const maxOverlap = Math.min(existingWords.length, incomingWords.length, 8);
  let overlapCount = 0;

  for (let k = maxOverlap; k >= 1; k--) {
    const existingSuffix = cleanExisting.slice(cleanExisting.length - k);
    const incomingPrefix = cleanIncoming.slice(0, k);

    let match = true;
    for (let i = 0; i < k; i++) {
      if (existingSuffix[i] !== incomingPrefix[i] || existingSuffix[i] === "") {
        match = false;
        break;
      }
    }

    if (match) {
      overlapCount = k;
      break;
    }
  }

  // Slice off overlapping words from incoming
  const nonOverlappingWords = incomingWords.slice(overlapCount);
  if (nonOverlappingWords.length === 0) {
    // Exact duplicate or already fully present in existing tail
    return existing;
  }

  const newWordsText = nonOverlappingWords.join(" ");

  if (overlapCount > 0) {
    // Acoustic boundary overlap detected: strip artificial chunk-boundary punctuation from existing tail
    const cleanedExisting = existing.replace(/[.,;]+$/, "");
    return `${cleanedExisting} ${newWordsText}`;
  }

  // Inspect transition punctuation when there is no overlap
  const endsWithPunct = /[.!?]$/.test(existing);
  const startsWithLower = /^[a-z]/.test(newWordsText);

  let formattedNew = newWordsText;
  if (endsWithPunct && startsWithLower) {
    formattedNew = newWordsText.charAt(0).toUpperCase() + newWordsText.slice(1);
  }

  return `${existing} ${formattedNew}`;
}

/**
 * Splits a continuous transcript string into logical, readable sentences
 * for smooth paragraph grouping and comfortable reading.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || !text.trim()) return [];
  // Match sentences ending in ., !, ? followed by space or end of string
  const rawSentences = text.match(/[^.!?]+(?:[.!?]+|$)/g) || [text];
  return rawSentences
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Groups sentences into coherent, flowing paragraphs of ~2-3 sentences each
 * to prevent walls of text while maintaining continuous reading flow.
 */
export function groupIntoParagraphs(text: string, sentencesPerParagraph = 3): string[] {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return [];

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    const slice = sentences.slice(i, i + sentencesPerParagraph);
    paragraphs.push(slice.join(" "));
  }

  return paragraphs;
}
