import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTokens } from '../context/TokenContext';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { sendAIMessage } from '../services/api';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, AI_TOKENS, FONTS } from '../constants/theme';

const MIN_TOKENS_TO_SEND = 20;

export function AIMentorScreen({ navigation }: any) {
  const { totalAvailable, consumeTokens, freeRemaining } = useTokens();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const canSend = totalAvailable >= MIN_TOKENS_TO_SEND && input.trim().length > 0;

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!canSend || loading) return;
    const text = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const { reply, tokensUsed } = await sendAIMessage(text);
      const deducted = consumeTokens(tokensUsed);
      if (!deducted) {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text: "You don't have enough tokens. Please recharge to continue.",
          },
        ]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: reply }]);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Something went wrong. Try again.';
      setMessages((m) => [...m, { role: 'assistant', text: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AI Mentor</Text>
            <Text style={styles.subtitle}>Learning & interview prep</Text>
          </View>
          <TouchableOpacity
            style={styles.tokenChip}
            onPress={() => navigation.navigate('RechargeTokens')}
          >
            <Text style={styles.tokenValue}>{totalAvailable}</Text>
            <Text style={styles.tokenLabel}>tokens</Text>
          </TouchableOpacity>
        </View>

        {totalAvailable < MIN_TOKENS_TO_SEND && (
          <Card accentColor={COLORS.warning} style={styles.banner}>
            <Text style={styles.bannerText}>
              You've used your free {AI_TOKENS.FREE_LIMIT} tokens. Recharge to continue.
            </Text>
            <NeonButton
              title="Recharge"
              onPress={() => navigation.navigate('RechargeTokens')}
              style={styles.bannerBtn}
            />
          </Card>
        )}

        <ScrollView
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          ref={scrollRef}
        >
          {messages.length === 0 && (
            <Card style={styles.welcome}>
              <Text style={styles.welcomeTitle}>Ask anything</Text>
              <Text style={styles.welcomeDesc}>
                Get explanations, code help, or practice for interviews. Replies use tokens (amount depends on the response).
              </Text>
              <Text style={styles.welcomeHint}>Free: {freeRemaining} / 300 tokens left</Text>
            </Card>
          )}
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}
            >
              <Text style={styles.bubbleText}>{msg.text}</Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.bubble, styles.bubbleBot]}>
              <Text style={styles.bubbleText}>...</Text>
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inputRow}
        >
          <TextInput
            style={styles.input}
            placeholder="Ask about concepts, code, or interviews..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={totalAvailable >= MIN_TOKENS_TO_SEND}
          />
          <NeonButton
            title="Send"
            onPress={sendMessage}
            disabled={!canSend}
            loading={loading}
            style={styles.sendBtn}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tokenChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-end',
  },
  tokenValue: { fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
  tokenLabel: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  banner: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  bannerText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bannerBtn: { alignSelf: 'flex-start' },
  chat: { flex: 1 },
  chatContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  welcome: { marginBottom: SPACING.lg },
  welcomeTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  welcomeDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  welcomeHint: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  bubble: {
    maxWidth: '85%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: { minWidth: 80 },
});
