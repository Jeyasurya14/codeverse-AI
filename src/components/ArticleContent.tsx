import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  LINE_HEIGHTS,
} from '../constants/theme';

type ArticleContentProps = { content: string };

/** Parses simple markdown: **bold**, ```code```, - list, paragraphs */
function parseContent(content: string): Array<{ type: 'paragraph' | 'code' | 'list'; content: string; lang?: string }> {
  const blocks: Array<{ type: 'paragraph' | 'code' | 'list'; content: string; lang?: string }> = [];
  let remaining = content.trim();

  // Split by code blocks first
  const codeBlockRe = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const codeMatches: Array<{ start: number; end: number; lang: string; code: string }> = [];
  while ((match = codeBlockRe.exec(content)) !== null) {
    codeMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      lang: match[1] || '',
      code: match[2].trim(),
    });
  }

  if (codeMatches.length === 0) {
    pushTextBlocks(blocks, content);
    return blocks;
  }

  let pos = 0;
  for (const { start, end, lang, code } of codeMatches) {
    if (start > pos) {
      pushTextBlocks(blocks, content.slice(pos, start));
    }
    blocks.push({ type: 'code', content: code, lang });
    pos = end;
  }
  if (pos < content.length) {
    pushTextBlocks(blocks, content.slice(pos));
  }
  return blocks;
}

function pushTextBlocks(
  blocks: Array<{ type: 'paragraph' | 'code' | 'list'; content: string; lang?: string }>,
  text: string
) {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    const lines = p.split('\n');
    const isList = lines.length >= 1 && lines.every((l) => /^\s*-\s+/.test(l) || l.trim() === '');
    if (isList && lines.some((l) => /^\s*-\s+/.test(l))) {
      blocks.push({ type: 'list', content: p });
    } else {
      blocks.push({ type: 'paragraph', content: p });
    }
  }
}

function renderInlineText(str: string) {
  const parts: Array<{ bold: boolean; text: string }> = [];
  let rest = str;
  const boldRe = /\*\*([^*]+)\*\*/g;
  let m: RegExpExecArray | null;
  let lastEnd = 0;
  while ((m = boldRe.exec(str)) !== null) {
    if (m.index > lastEnd) {
      parts.push({ bold: false, text: str.slice(lastEnd, m.index) });
    }
    parts.push({ bold: true, text: m[1] });
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < str.length) {
    parts.push({ bold: false, text: str.slice(lastEnd) });
  }
  if (parts.length === 0) {
    parts.push({ bold: false, text: str });
  }
  return parts;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const blocks = parseContent(content);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <View key={index} style={styles.codeWrap}>
              {block.lang ? (
                <Text style={styles.codeLang}>{block.lang}</Text>
              ) : null}
              <View style={styles.codeBlock}>
                <Text style={styles.codeText} selectable>{block.content}</Text>
              </View>
            </View>
          );
        }
        if (block.type === 'list') {
          const items = block.content
            .split('\n')
            .map((l) => l.replace(/^\s*-\s+/, '').trim())
            .filter(Boolean);
          return (
            <View key={index} style={styles.listWrap}>
              {items.map((item, i) => {
                const inline = renderInlineText(item);
                return (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>
                      {inline.map((part, j) => (
                        <Text
                          key={j}
                          style={part.bold ? styles.listItemBold : undefined}
                        >
                          {part.text}
                        </Text>
                      ))}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }
        const inline = renderInlineText(block.content);
        return (
          <Text key={index} style={styles.paragraph}>
            {inline.map((part, j) => (
              <Text
                key={j}
                style={part.bold ? styles.bold : undefined}
              >
                {part.text}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  paragraph: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.reading,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.relaxed,
    marginBottom: SPACING.lg,
    letterSpacing: 0.2,
  },
  bold: {
    fontFamily: FONTS.readingMedium,
    color: COLORS.textPrimary,
  },
  codeWrap: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.codeBorder,
    backgroundColor: COLORS.codeBackground,
  },
  codeLang: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  codeBlock: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: FONT_SIZES.sm,
    color: COLORS.codeText,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  listWrap: {
    marginBottom: SPACING.lg,
    paddingLeft: SPACING.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bullet: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    fontFamily: FONTS.reading,
  },
  listItemText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.reading,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.relaxed,
    letterSpacing: 0.2,
  },
  listItemBold: {
    fontFamily: FONTS.readingMedium,
    color: COLORS.textPrimary,
  },
});
