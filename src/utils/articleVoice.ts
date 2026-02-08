/**
 * Text extraction and chunking utilities for article TTS (voice assistance).
 */

const CODE_BLOCK_PLACEHOLDER = 'Code block. See article for details.';
const MAX_CHUNK_CHARS = 900;

/**
 * Strip markdown to plain text for TTS.
 * - Removes #, **, `, code fences
 * - Replaces code blocks with a brief placeholder
 * - Preserves headings, lists, paragraphs as readable prose
 */
export function extractArticleText(content: string): string {
  let text = content.trim();

  // Remove code blocks and replace with placeholder
  text = text.replace(/```[\w]*\n([\s\S]*?)```/g, `\n${CODE_BLOCK_PLACEHOLDER}\n`);

  // Remove inline code (backticks)
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove bold markers
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');

  // Remove heading markers (keep the text)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Normalize list items: "- item" -> "item" (keep readable)
  text = text.replace(/^\s*[-*]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // Collapse multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Split text into chunks suitable for TTS.
 * Splits at paragraph/sentence boundaries to stay under max length.
 */
export function chunkForTTS(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const chunks: string[] = [];
  const paragraphs = trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 <= MAX_CHUNK_CHARS) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else if (para.length <= MAX_CHUNK_CHARS) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = para;
      } else {
        // Single long paragraph - split by sentences
        const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
        for (const s of sentences) {
          if (currentChunk.length + s.length + 1 <= MAX_CHUNK_CHARS) {
            currentChunk = currentChunk ? `${currentChunk} ${s}` : s.trim();
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = s.length <= MAX_CHUNK_CHARS ? s.trim() : s.slice(0, MAX_CHUNK_CHARS);
          }
        }
      }
    } else {
      if (currentChunk) chunks.push(currentChunk);
      // Split long paragraph by sentences
      const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
      currentChunk = '';
      for (const s of sentences) {
        if (currentChunk.length + s.length + 1 <= MAX_CHUNK_CHARS) {
          currentChunk = currentChunk ? `${currentChunk} ${s}` : s.trim();
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = s.length <= MAX_CHUNK_CHARS ? s.trim() : s.slice(0, MAX_CHUNK_CHARS);
        }
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}
