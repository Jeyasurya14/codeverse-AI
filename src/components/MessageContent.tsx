import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { Clipboard, Alert } from 'react-native';

interface MessageContentProps {
  text: string;
  isUser?: boolean;
}

// Parse code blocks from markdown-style text
function parseMessage(text: string): Array<{ type: 'text' | 'code'; content: string; lang?: string }> {
  const parts: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    // Add code block
    parts.push({
      type: 'code',
      content: match[2].trim(),
      lang: match[1] || 'code',
    });
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex).trim();
    if (textContent) {
      parts.push({ type: 'text', content: textContent });
    }
  }

  // If no code blocks found, return entire text as single part
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return parts;
}

export function MessageContent({ text, isUser = false }: MessageContentProps) {
  const parts = parseMessage(text);

  const handleCopy = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied', 'Code copied to clipboard');
  };

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <View key={index} style={styles.codeContainer}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeLang}>{part.lang.toUpperCase()}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopy(part.content)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText} selectable>
                  {part.content}
                </Text>
              </View>
            </View>
          );
        }
        
        return (
          <Text key={index} style={[styles.text, isUser && styles.textUser]}>
            {part.content}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  textUser: {
    color: COLORS.background,
  },
  codeContainer: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.codeBackground,
    borderWidth: 1,
    borderColor: COLORS.codeBorder,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.codeBorder,
  },
  codeLang: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  copyText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  codeBlock: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: FONT_SIZES.sm,
    color: COLORS.codeText,
    lineHeight: 20,
  },
});
