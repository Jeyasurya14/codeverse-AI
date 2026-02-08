import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
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
  const { colors } = useTheme();
  const parts = parseMessage(text);

  const themedStyles = useMemo(() => StyleSheet.create({
    text: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: colors.textPrimary,
      lineHeight: 22,
      marginBottom: SPACING.xs,
    },
    textUser: {
      color: colors.background,
    },
    codeContainer: {
      marginTop: SPACING.xs,
      marginBottom: SPACING.xs,
      borderRadius: BORDER_RADIUS.md,
      overflow: 'hidden' as const,
      backgroundColor: colors.codeBackground,
      borderWidth: 1,
      borderColor: colors.codeBorder,
    },
    codeHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.codeBorder,
    },
    codeLang: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      textTransform: 'uppercase' as const,
    },
    copyText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      color: colors.primary,
    },
    codeText: {
      fontFamily: 'monospace',
      fontSize: FONT_SIZES.sm,
      color: colors.codeText,
      lineHeight: 20,
    },
  }), [colors]);

  const handleCopy = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied', 'Code copied to clipboard');
  };

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <View key={index} style={themedStyles.codeContainer}>
              <View style={themedStyles.codeHeader}>
                <Text style={themedStyles.codeLang}>{part.lang.toUpperCase()}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopy(part.content)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="copy-outline" size={16} color={colors.primary} />
                  <Text style={themedStyles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.codeBlock}>
                <Text style={themedStyles.codeText} selectable>
                  {part.content}
                </Text>
              </View>
            </View>
          );
        }
        
        return (
          <Text key={index} style={[themedStyles.text, isUser && themedStyles.textUser]}>
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
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  codeBlock: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
});
