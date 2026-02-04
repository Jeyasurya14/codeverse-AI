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
  ActivityIndicator,
  Modal,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from '../context/TokenContext';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import {
  sendAIMessage,
  getAuthTokens,
} from '../services/api';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, AI_TOKENS, FONTS, SHADOWS } from '../constants/theme';

const TOKENS_PER_MESSAGE = AI_TOKENS.TOKENS_PER_MESSAGE; // 10 tokens per message

// Security and validation constants
const MAX_INPUT_LENGTH = 500;
const MAX_SANITIZED_LENGTH = 5000;
const MIN_INPUT_LENGTH = 1;
const MESSAGE_SEND_DEBOUNCE_MS = 500; // Prevent rapid-fire requests
const MAX_MESSAGES_PER_MINUTE = 10; // Rate limiting

const SUGGESTION_PROMPTS = [
  'Explain recursion simply',
  'Common interview question',
  'Help me debug this code',
  'Best practices for async',
] as const;

// Input sanitization utility
const sanitizeInput = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars except \n, \r, \t
  
  // Trim and normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  // Limit length
  sanitized = sanitized.slice(0, MAX_SANITIZED_LENGTH);
  
  return sanitized;
};

// Sanitize message text for display (prevent XSS)
const sanitizeMessageText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // React Native Text component automatically escapes HTML, but we'll be extra safe
  // Remove any potential script tags or dangerous patterns
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

interface AIMentorScreenProps {
  navigation: any;
}

export function AIMentorScreen({ navigation }: AIMentorScreenProps) {
  const { user, signOut } = useAuth();
  const { totalAvailable, freeRemaining, refresh } = useTokens();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [messageCount, setMessageCount] = useState<number>(0);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const canSend = totalAvailable >= TOKENS_PER_MESSAGE && 
                  input.trim().length >= MIN_INPUT_LENGTH && 
                  input.trim().length <= MAX_INPUT_LENGTH &&
                  !loading;

  // Reset messages when user changes
  useEffect(() => {
    if (!user) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  // Scroll to bottom when keyboard shows
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to check if error is token-related
  const isTokenError = (error: any): boolean => {
    if (!error) return false;
    
    // Check error message string
    const errorMsg = error instanceof Error ? error.message : String(error);
    const lowerMsg = errorMsg.toLowerCase();
    
    // Check if it's a token-related error
    const isTokenErrorMsg = 
      lowerMsg.includes('invalid or expired token') ||
      lowerMsg.includes('invalid token') ||
      lowerMsg.includes('expired token') ||
      lowerMsg.includes('unauthorized') ||
      lowerMsg.includes('invalid_token') ||
      lowerMsg.includes('authentication required') ||
      lowerMsg.includes('no authentication token') ||
      lowerMsg.includes('token expired') ||
      lowerMsg === '401' ||
      errorMsg === '401';
    
    // Check error object structure
    if (typeof error === 'object') {
      const errorObj = error as any;
      if (errorObj.error === 'UNAUTHORIZED' || 
          errorObj.error === 'INVALID_TOKEN' ||
          errorObj.message?.toLowerCase().includes('token') ||
          errorObj.message?.toLowerCase().includes('unauthorized')) {
        return true;
      }
    }
    
    return isTokenErrorMsg;
  };

  // Handle token expiration by logging out and redirecting
  const handleTokenExpiration = async () => {
    try {
      await signOut();
      // Small delay to ensure state is cleared
      setTimeout(() => {
        if (navigation) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }, 100);
    } catch (e) {
      if (__DEV__) {
        console.warn('Failed to sign out on token expiration:', e);
      }
    }
  };

  // Rate limiting check
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Reset counter if more than a minute has passed
    if (lastMessageTime < oneMinuteAgo) {
      setMessageCount(0);
      setLastMessageTime(now);
      return true;
    }
    
    // Check if rate limit exceeded
    if (messageCount >= MAX_MESSAGES_PER_MINUTE) {
      Alert.alert(
        'Rate Limit Exceeded',
        'Please wait a moment before sending another message.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  const sendMessage = async () => {
    if (!canSend || loading) return;
    
    // Rate limiting check
    if (!checkRateLimit()) {
      return;
    }
    
    // Input validation
    const rawText = input.trim();
    if (!rawText || rawText.length < MIN_INPUT_LENGTH || rawText.length > MAX_INPUT_LENGTH) {
      Alert.alert(
        'Invalid Input',
        `Message must be between ${MIN_INPUT_LENGTH} and ${MAX_INPUT_LENGTH} characters.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Sanitize input
    const sanitizedText = sanitizeInput(rawText);
    
    if (!sanitizedText || sanitizedText.length < MIN_INPUT_LENGTH) {
      Alert.alert('Invalid Input', 'Please enter a valid message.');
      return;
    }
    
    // Clear any pending debounce
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }
    
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: sanitizedText }]);
    setLoading(true);
    setMessageCount((prev) => prev + 1);
    setLastMessageTime(Date.now());
    
    try {
      const result = await sendAIMessage(sanitizedText, undefined, currentConversationId || undefined);
      
      // Validate response
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format');
      }
      
      if (!result.reply || typeof result.reply !== 'string') {
        throw new Error('Invalid response content');
      }
      
      // Sanitize AI response before displaying
      const sanitizedReply = sanitizeMessageText(result.reply);
      
      if (!sanitizedReply || sanitizedReply.length === 0) {
        throw new Error('Empty response received');
      }
      
      // Update conversation ID if this was a new conversation
      if (result.conversationId && typeof result.conversationId === 'string' && result.conversationId !== currentConversationId) {
        setCurrentConversationId(result.conversationId);
      }
      
      // Backend already consumed tokens, just refresh our local state
      try {
        await refresh();
      } catch (refreshError) {
        // Don't fail the whole operation if refresh fails
        if (__DEV__) {
          console.warn('Failed to refresh tokens:', refreshError);
        }
      }
      
      setMessages((m) => [...m, { role: 'assistant', text: sanitizedReply }]);
    } catch (e) {
      // Handle errors securely - don't expose internal error details
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
      
      // Handle insufficient tokens error (402)
      if (e instanceof Error) {
        if (errorMessage.includes('Insufficient tokens') || errorMessage.includes('402')) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: `You don't have enough tokens. You need ${TOKENS_PER_MESSAGE} tokens per message. Please recharge to continue.`,
            },
          ]);
        } else if (errorMessage.includes('CONVERSATION_LIMIT_REACHED')) {
          // Handle conversation limit error
          try {
            const errorData = JSON.parse(e.message);
            const limit = errorData.limit || 2;
            const plan = errorData.plan || 'free';
            setMessages((m) => [
              ...m,
              {
                role: 'assistant',
                text: `You have reached the maximum of ${limit} conversations for your ${plan} plan. Please delete an existing conversation or upgrade to create more.`,
              },
            ]);
            Alert.alert(
              'Conversation Limit Reached',
              `You have reached the maximum of ${limit} conversations for your ${plan} plan. Please delete an existing conversation or upgrade to create more.`,
              [
                { text: 'OK' },
                { 
                  text: 'Upgrade', 
                  onPress: () => navigation.navigate('RechargeTokens'),
                  style: 'default',
                },
              ]
            );
          } catch {
            setMessages((m) => [
              ...m,
              {
                role: 'assistant',
                text: 'You have reached the maximum number of conversations for your plan. Please delete an existing conversation or upgrade.',
              },
            ]);
          }
        } else if (isTokenError(e)) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: 'Your session has expired. Please sign in again.',
            },
          ]);
          // Show alert and redirect to login
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please sign in again.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await handleTokenExpiration();
                },
              },
            ]
          );
        } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: 'Network error. Please check your connection and try again.',
            },
          ]);
        } else {
          // Generic error - don't expose internal error details
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: 'Sorry, something went wrong. Please try again later.',
            },
          ]);
          
          // Log error for debugging in dev mode only
          if (__DEV__) {
            console.error('AI Message Error:', errorMessage);
          }
        }
      } else {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text: 'Sorry, something went wrong. Please try again later.',
          },
        ]);
      }
      
      // Refresh token balance even on error (in case backend consumed tokens)
      try {
        await refresh();
      } catch (refreshError) {
        // Don't fail if refresh fails
        if (__DEV__) {
          console.warn('Failed to refresh tokens after error:', refreshError);
        }
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '18' }]}>
              <Ionicons name="sparkles" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.title} numberOfLines={1}>AI Mentor</Text>
              <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
                Coding help & interview prep
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.tokenChip,
              totalAvailable < TOKENS_PER_MESSAGE && styles.tokenChipLow,
            ]}
            onPress={() => navigation.navigate('RechargeTokens')}
          >
            <Ionicons 
              name="flash" 
              size={16} 
              color={totalAvailable >= TOKENS_PER_MESSAGE ? COLORS.primary : COLORS.warning} 
            />
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenValue}>{totalAvailable}</Text>
              <Text style={styles.tokenLabel}>tokens</Text>
            </View>
          </TouchableOpacity>
        </View>

        {totalAvailable < TOKENS_PER_MESSAGE && (
          <Card accentColor={COLORS.warning} style={styles.banner}>
            <View style={styles.bannerContent}>
              <Ionicons name="warning" size={20} color={COLORS.warning} />
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Insufficient Tokens</Text>
                <Text style={styles.bannerText}>
                  You need at least {TOKENS_PER_MESSAGE} tokens to send a message. You have {totalAvailable} tokens remaining.
                </Text>
              </View>
            </View>
            <NeonButton
              title="Recharge Now"
              onPress={() => navigation.navigate('RechargeTokens')}
              style={styles.bannerBtn}
            />
          </Card>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            style={styles.chat}
            contentContainerStyle={styles.chatContent}
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {messages.length === 0 && (
              <Card style={styles.welcome} elevated>
              <View style={styles.welcomeContent}>
                <View style={[styles.welcomeIcon, styles.welcomeIconCircle]}>
                  <Ionicons name="sparkles" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.welcomeTitle}>Ask anything</Text>
                <Text style={styles.welcomeDesc}>
                  Get explanations, code help, or practice interview questions. {TOKENS_PER_MESSAGE} tokens per message. Max {MAX_INPUT_LENGTH} characters per message.
                </Text>
                <View style={styles.welcomeStats}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.secondary + '18' }]}>
                      <Ionicons name="gift" size={14} color={COLORS.secondary} />
                    </View>
                    <View style={styles.statItemText}>
                      <Text style={styles.statLabel}>Free</Text>
                      <Text style={styles.statNumber}>{freeRemaining} / {AI_TOKENS.FREE_LIMIT}</Text>
                    </View>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '18' }]}>
                      <Ionicons name="flash" size={14} color={COLORS.warning} />
                    </View>
                    <View style={styles.statItemText}>
                      <Text style={styles.statLabel}>Available</Text>
                      <Text style={styles.statNumber}>{totalAvailable}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsLabel}>Try asking</Text>
                  <View style={styles.suggestionChips}>
                    {SUGGESTION_PROMPTS.map((prompt) => (
                      <TouchableOpacity
                        key={prompt}
                        style={[
                          styles.suggestionChip,
                          totalAvailable < TOKENS_PER_MESSAGE && styles.suggestionChipDisabled,
                        ]}
                        onPress={() => setInput(prompt)}
                        activeOpacity={0.7}
                        disabled={totalAvailable < TOKENS_PER_MESSAGE}
                      >
                        <Text 
                          style={[
                            styles.suggestionChipText,
                            totalAvailable < TOKENS_PER_MESSAGE && styles.suggestionChipTextDisabled,
                          ]} 
                          numberOfLines={1}
                        >
                          {prompt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              </Card>
            )}
            {messages.map((msg, i) => (
              <View
              key={i}
              style={[
                styles.messageContainer, 
                msg.role === 'user' ? styles.messageUser : styles.messageBot
              ]}
            >
              {msg.role === 'assistant' ? (
                <>
                  <View style={styles.avatarBot}>
                    <Ionicons name="sparkles" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.bubbleBot}>
                    <Text style={styles.bubbleText}>
                      {sanitizeMessageText(msg.text)}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.bubbleUser}>
                    <Text style={styles.bubbleTextUser}>
                      {sanitizeMessageText(msg.text)}
                    </Text>
                  </View>
                  <View style={styles.avatarUser}>
                    <Ionicons name="person" size={18} color={COLORS.background} />
                  </View>
                </>
              )}
              </View>
            ))}
            {loading && (
              <View style={[styles.messageContainer, styles.messageBot]}>
              <View style={styles.avatarBot}>
                <Ionicons name="sparkles" size={18} color={COLORS.primary} />
              </View>
              <View style={[styles.bubbleBot, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputRowInner}>
                <TextInput
                  style={[
                    styles.input,
                    !canSend && styles.inputDisabled,
                  ]}
                  placeholder="Ask about concepts, code, or interviews..."
                  placeholderTextColor={COLORS.textMuted}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={MAX_INPUT_LENGTH}
                  editable={totalAvailable >= TOKENS_PER_MESSAGE && !loading}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  spellCheck={true}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={!canSend || loading}
                  style={[
                    styles.sendButton,
                    (!canSend || loading) && styles.sendButtonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.background} />
                  ) : (
                    <Ionicons 
                      name="send" 
                      size={20} 
                      color={canSend ? COLORS.background : COLORS.textMuted} 
                    />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>
                  {input.length} / {MAX_INPUT_LENGTH}
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginRight: SPACING.xs,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
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
    flexShrink: 1,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs + 2,
    flexShrink: 0,
    marginLeft: SPACING.xs,
  },
  tokenChipLow: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning + '15',
  },
  tokenInfo: {
    justifyContent: 'center',
  },
  tokenValue: { 
    fontSize: FONT_SIZES.lg, 
    fontFamily: FONTS.bold, 
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  tokenLabel: { 
    fontSize: FONT_SIZES.xs, 
    fontFamily: FONTS.regular, 
    color: COLORS.textMuted,
  },
  banner: { 
    marginHorizontal: SPACING.lg, 
    marginBottom: SPACING.md,
  },
  bannerContent: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  bannerText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bannerBtn: { alignSelf: 'flex-start' },
  chat: { flex: 1 },
  chatContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + 20,
    flexGrow: 1,
  },
  welcome: { 
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: SPACING.md,
  },
  welcomeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContent: {
    width: '100%',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  welcomeDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
    textAlign: 'center',
  },
  welcomeStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    justifyContent: 'center',
    minWidth: 0,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statItemText: {
    minWidth: 0,
    justifyContent: 'center',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 2,
  },
  statNumber: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  welcomeHint: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  suggestionsSection: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  suggestionsLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  suggestionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  suggestionChipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  suggestionChipDisabled: {
    opacity: 0.5,
  },
  suggestionChipTextDisabled: {
    color: COLORS.textMuted,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  messageUser: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageBot: {
    justifyContent: 'flex-start',
  },
  avatarBot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarUser: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '85%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  bubbleUser: {
    maxWidth: '82%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  bubbleBot: {
    maxWidth: '82%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    borderTopLeftRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignSelf: 'flex-start',
    ...SHADOWS.card,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  bubbleText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.reading,
    color: COLORS.textPrimary,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  bubbleTextUser: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.reading,
    color: COLORS.background,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  inputRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  inputWrapper: {
    flex: 1,
  },
  inputRowInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.backgroundCard + '80',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: SPACING.xs + 2,
    paddingBottom: SPACING.xs,
    paddingRight: SPACING.xs + 44 + SPACING.sm, // Align with input (account for button width + gap)
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.backgroundCard,
    opacity: 0.5,
  },
  // Sidebar styles
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    flex: 1,
    width: '85%',
    maxWidth: 360,
    backgroundColor: COLORS.background,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    ...SHADOWS.card,
  },
  sidebarSafe: {
    flex: 1,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sidebarTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  newConversationText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  conversationsList: {
    flex: 1,
    paddingVertical: SPACING.sm,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  conversationItemActive: {
    backgroundColor: COLORS.backgroundCard,
  },
  conversationContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  conversationTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  conversationTitleActive: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  conversationMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  newConversationTextDisabled: {
    color: COLORS.textMuted,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.warning + '15',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  limitWarningText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.warning,
    flex: 1,
  },
});
