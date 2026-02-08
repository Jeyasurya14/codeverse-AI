import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import {
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  LINE_HEIGHTS,
} from '../constants/theme';

type ArticleContentProps = { content: string };

/** Parses simple markdown: **bold**, ```code```, # heading, - list, paragraphs */
function parseContent(
  content: string
): Array<{ type: 'paragraph' | 'code' | 'list' | 'heading'; content: string; lang?: string; level?: number }> {
  const blocks: Array<{
    type: 'paragraph' | 'code' | 'list' | 'heading';
    content: string;
    lang?: string;
    level?: number;
  }> = [];
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
  blocks: Array<{
    type: 'paragraph' | 'code' | 'list' | 'heading';
    content: string;
    lang?: string;
    level?: number;
  }>,
  text: string
) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const p of paragraphs) {
    const lines = p.split('\n');
    const headingMatch = p.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        content: headingMatch[2].trim(),
        level: headingMatch[1].length,
      });
      continue;
    }
    const isList =
      lines.length >= 1 &&
      lines.every((l) => /^\s*-\s+/.test(l) || l.trim() === '');
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
  const { colors } = useTheme();
  const blocks = parseContent(content);

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        paragraph: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.reading,
          color: colors.textSecondary,
          lineHeight: FONT_SIZES.md * LINE_HEIGHTS.relaxed,
          marginBottom: SPACING.lg,
          letterSpacing: 0.15,
        },
        bold: {
          fontFamily: FONTS.readingMedium,
          color: colors.textPrimary,
        },
        heading: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: colors.textPrimary,
          marginTop: SPACING.xl,
          marginBottom: SPACING.md,
          lineHeight: FONT_SIZES.lg * 1.3,
          letterSpacing: -0.3,
        },
        heading2: {
          fontSize: FONT_SIZES.md + 2,
          marginTop: SPACING.lg,
          marginBottom: SPACING.sm,
        },
        heading3: {
          fontSize: FONT_SIZES.md,
          marginTop: SPACING.md,
          marginBottom: SPACING.xs,
        },
        codeWrap: {
          marginBottom: SPACING.lg,
          borderRadius: BORDER_RADIUS.lg,
          overflow: 'hidden' as const,
          borderWidth: 1,
          borderColor: colors.codeBorder,
          backgroundColor: colors.codeBackground,
        },
        codeLang: {
          fontFamily: FONTS.semiBold,
          fontSize: FONT_SIZES.xs,
          color: colors.primary,
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.sm,
          paddingBottom: SPACING.xs,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        codeText: {
          fontFamily: 'monospace',
          fontSize: FONT_SIZES.sm,
          color: colors.codeText,
          lineHeight: FONT_SIZES.sm * 1.6,
        },
        bullet: {
          fontSize: FONT_SIZES.md,
          color: colors.primary,
          marginRight: SPACING.sm,
          fontWeight: '600' as const,
        },
        listItemText: {
          flex: 1,
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.reading,
          color: colors.textSecondary,
          lineHeight: FONT_SIZES.md * LINE_HEIGHTS.relaxed,
          letterSpacing: 0.15,
        },
        listItemBold: {
          fontFamily: FONTS.readingMedium,
          color: colors.textPrimary,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <View key={index} style={themedStyles.codeWrap}>
              {block.lang ? (
                <Text style={themedStyles.codeLang}>{block.lang}</Text>
              ) : null}
              <View style={styles.codeBlock}>
                <Text style={themedStyles.codeText} selectable>
                  {block.content}
                </Text>
              </View>
            </View>
          );
        }
        if (block.type === 'heading') {
          const level = block.level ?? 1;
          const style =
            level === 1
              ? themedStyles.heading
              : level === 2
              ? [themedStyles.heading, themedStyles.heading2]
              : [themedStyles.heading, themedStyles.heading3];
          return (
            <Text key={index} style={style}>
              {block.content}
            </Text>
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
                    <Text style={themedStyles.bullet}>•</Text>
                    <Text style={themedStyles.listItemText}>
                      {inline.map((part, j) => (
                        <Text
                          key={j}
                          style={
                            part.bold ? themedStyles.listItemBold : undefined
                          }
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
          <Text key={index} style={themedStyles.paragraph}>
            {inline.map((part, j) => (
              <Text
                key={j}
                style={part.bold ? themedStyles.bold : undefined}
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
  codeBlock: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  listWrap: {
    marginBottom: SPACING.lg,
    paddingLeft: SPACING.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
});
