import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Pressable,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from '../context/TokenContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { MessageContent } from '../components/MessageContent';
import {
  sendAIMessage,
  getAuthTokens,
  getConversations,
  getConversationMessages,
} from '../services/api';
import type { Conversation } from '../services/api';
import { SPACING, FONT_SIZES, BORDER_RADIUS, AI_TOKENS, FONTS, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const TOKENS_PER_MESSAGE = AI_TOKENS.TOKENS_PER_MESSAGE; // 10 tokens per message

const MIN_INPUT_HEIGHT = 40;
const MAX_INPUT_HEIGHT = 200;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// MNC-grade suggested prompts for first-time and empty state
const SUGGESTED_PROMPTS = [
  'Explain time complexity of this approach and suggest optimizations',
  'How would you design a rate limiter for a high-traffic API?',
  'Review this code and suggest cleaner, more maintainable patterns',
  'Walk me through a solid answer for: "Design a URL shortener"',
];

// Security and validation constants
const MAX_INPUT_LENGTH = 500;
const MAX_SANITIZED_LENGTH = 5000;
const MIN_INPUT_LENGTH = 1;
const MESSAGE_SEND_DEBOUNCE_MS = 500; // Prevent rapid-fire requests
const MAX_MESSAGES_PER_MINUTE = 10; // Rate limiting

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

const TAB_BAR_HEIGHT = 64;

export function AIMentorScreen({ navigation }: AIMentorScreenProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { totalAvailable, freeRemaining, refresh } = useTokens();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; createdAt?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
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
      setInitialLoadDone(false);
    }
  }, [user]);

  // Load most recent conversation history when user is available
  useEffect(() => {
    if (!user || initialLoadDone) return;

    let cancelled = false;

    async function loadInitialHistory() {
      try {
        const result = await getConversations();
        const list = result?.conversations ?? [];
        if (cancelled || list.length === 0) {
          setInitialLoadDone(true);
          return;
        }
        const mostRecent = list[0];
        const msgResult = await getConversationMessages(mostRecent.id);
        const msgs = msgResult?.messages ?? [];
        if (cancelled) return;
        setCurrentConversationId(mostRecent.id);
        setMessages(msgs.map((m) => ({ role: m.role, text: m.text, createdAt: m.createdAt })));
      } catch {
        if (!cancelled) {
          if (__DEV__) console.warn('Failed to load conversation history');
        }
      } finally {
        if (!cancelled) setInitialLoadDone(true);
      }
    }

    loadInitialHistory();
    return () => { cancelled = true; };
  }, [user, initialLoadDone]);

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

  const openHistoryModal = async () => {
    setHistoryModalVisible(true);
    setLoadingHistory(true);
    try {
      const result = await getConversations();
      setConversations(result?.conversations ?? []);
    } catch {
      setConversations([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setHistoryModalVisible(false);
    setLoading(true);
    try {
      const msgResult = await getConversationMessages(conv.id);
      const msgs = msgResult?.messages ?? [];
      setCurrentConversationId(conv.id);
      setMessages(msgs.map((m) => ({ role: m.role, text: m.text })));
    } catch {
      Alert.alert('Error', 'Could not load this conversation.');
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setHistoryModalVisible(false);
  };

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
    setInputHeight(MIN_INPUT_HEIGHT);
    setMessages((m) => [...m, { role: 'user', text: sanitizedText, createdAt: new Date().toISOString() }]);
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
      
      setMessages((m) => [...m, { role: 'assistant', text: sanitizedReply, createdAt: new Date().toISOString() }]);
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
        } else if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('Unable to reach')) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: 'Network error. Please check your internet connection and try again.',
            },
          ]);
        } else if (errorMessage.includes('Server error') || errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('temporarily unavailable')) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: 'Server is temporarily unavailable. Please try again in a moment.',
            },
          ]);
        } else if (errorMessage.includes('took too long') || errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: 'Request timed out. Please check your connection and try again.',
            },
          ]);
        } else if (errorMessage.includes('after multiple attempts') || errorMessage.includes('Request failed after')) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: 'Unable to connect after multiple attempts. Please check your connection and try again later.',
            },
          ]);
        } else if (errorMessage.includes('session has expired') || errorMessage.includes('sign in again')) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: 'Your session has expired. Please sign in again.',
            },
          ]);
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
        } else {
          // Generic error - show more helpful message
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: `Sorry, I encountered an error: ${errorMessage}. Please try again or check your connection.`,
            },
          ]);
          
          // Log error for debugging in dev mode only
          if (__DEV__) {
            console.error('AI Message Error:', errorMessage, e);
          }
        }
      } else {
        // Non-Error object - provide helpful message
        const errorStr = String(e);
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            text: `Sorry, something went wrong: ${errorStr}. Please check your connection and try again.`,
          },
        ]);
        
        if (__DEV__) {
          console.error('AI Message Error (non-Error):', e);
        }
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

  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Minimal header */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.headerLogo}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>{t('aiMentor.title')}</Text>
            <View style={styles.headerStatus}>
              <View style={[styles.headerStatusDot, { backgroundColor: colors.success }]} />
              <Text style={styles.headerStatusText}>Online</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerHistoryBtn}
            onPress={openHistoryModal}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Ionicons name="list" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {totalAvailable < TOKENS_PER_MESSAGE && (
          <View style={styles.banner}>
            <View style={styles.bannerInner}>
              <Ionicons name="flash-outline" size={18} color={colors.warning} />
              <Text style={styles.bannerText}>
                {totalAvailable} tokens · Need {TOKENS_PER_MESSAGE} to chat
              </Text>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => navigation.navigate('RechargeTokens')}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerBtnText}>{t('home.recharge')}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              <View style={styles.welcome}>
                <Animated.View entering={FadeInDown.delay(0).springify().damping(18)} style={styles.welcomeHeader}>
                  <View style={styles.welcomeIconBox}>
                    <Ionicons name="school-outline" size={36} color={colors.primary} />
                  </View>
                  <Text style={styles.welcomeTitle}>{t('aiMentor.askAnything')}</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Algorithms · System design · Code review · Interview prep
                  </Text>
                  <View style={styles.welcomeTokens}>
                    <Text style={styles.welcomeTokensText}>{totalAvailable} {t('aiMentor.tokensAvailable')}</Text>
                  </View>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(80).springify().damping(18)} style={styles.promptsGrid}>
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <Pressable
                      key={idx}
                      style={({ pressed }) => [
                        styles.promptChip,
                        pressed && styles.promptChipPressed,
                      ]}
                      onPress={() => setInput(prompt)}
                      disabled={totalAvailable < TOKENS_PER_MESSAGE || loading}
                    >
                      <Text style={styles.promptChipText} numberOfLines={2}>{prompt}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                    </Pressable>
                  ))}
                </Animated.View>
              </View>
            )}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <View key={i} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
                  {!isUser && (
                    <View style={styles.msgAvatar}>
                      <Ionicons name="school-outline" size={16} color={colors.primary} />
                    </View>
                  )}
                  <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleBot]}>
                    <MessageContent text={sanitizeMessageText(msg.text)} isUser={isUser} />
                  </View>
                </View>
              );
            })}
            {loading && (
              <View style={[styles.msgRow, styles.msgRowBot]}>
                <View style={styles.msgAvatar}>
                  <Ionicons name="school-outline" size={16} color={colors.primary} />
                </View>
                <View style={[styles.msgBubble, styles.msgBubbleBot, styles.loadingBubble]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>{t('aiMentor.thinking')}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
                <View style={[styles.inputContainer, { minHeight: inputHeight }]}>
                  <TextInput
                    style={[
                      styles.input,
                      !canSend && styles.inputDisabled,
                      { height: Math.max(MIN_INPUT_HEIGHT, Math.min(MAX_INPUT_HEIGHT, inputHeight)) },
                    ]}
                    placeholder={t('aiMentor.placeholder')}
                    placeholderTextColor={colors.textMuted}
                    value={input}
                    onChangeText={setInput}
                    onContentSizeChange={(e) => {
                      const h = e.nativeEvent.contentSize.height + 24;
                      setInputHeight(Math.max(MIN_INPUT_HEIGHT, Math.min(MAX_INPUT_HEIGHT, h)));
                    }}
                    multiline
                    maxLength={MAX_INPUT_LENGTH}
                    editable={totalAvailable >= TOKENS_PER_MESSAGE && !loading}
                    autoCapitalize="sentences"
                    autoCorrect={true}
                    spellCheck={true}
                    scrollEnabled={true}
                  />
                  <Text style={styles.inputCharCount}>
                    {input.length}/{MAX_INPUT_LENGTH}
                  </Text>
                </View>
                {canSend && !loading ? (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      sendMessage();
                    }}
                    style={styles.sendBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="send" size={20} color={colors.background} />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.sendBtn, styles.sendBtnDisabled]}>
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.textMuted} />
                    ) : (
                      <Ionicons name="send" size={22} color={colors.textMuted} />
                    )}
                  </View>
                )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Conversation history modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setHistoryModalVisible(false)}
        >
          <View style={[styles.historyModalContent, SHADOWS.cardElevated]} onStartShouldSetResponder={() => true}>
            <View style={styles.historyModalHeader}>
              <Text style={styles.historyModalTitle}>{t('aiMentor.conversationHistory')}</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {loadingHistory ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.historyLoadingText}>{t('aiMentor.loadingConversations')}</Text>
                <Text style={styles.historyLoadingSub}>One moment please</Text>
              </View>
            ) : conversations.length === 0 ? (
              <View style={styles.historyEmpty}>
                <View style={styles.historyEmptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={56} color={colors.textMuted} />
                </View>
                <Text style={styles.historyEmptyTitle}>{t('aiMentor.noConversations')}</Text>
                <Text style={styles.historyEmptyText}>{t('aiMentor.startNewChat')}</Text>
              </View>
            ) : (
              <ScrollView style={styles.historyList} keyboardShouldPersistTaps="handled">
                {conversations.map((conv) => (
                  <TouchableOpacity
                    key={conv.id}
                    style={[
                      styles.historyItem,
                      SHADOWS.card,
                      currentConversationId === conv.id && styles.historyItemActive,
                    ]}
                    onPress={() => selectConversation(conv)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.historyItemTitle} numberOfLines={1}>{conv.title}</Text>
                    <Text style={styles.historyItemMeta}>
                      {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: { background: string; backgroundCard: string; border: string; textPrimary: string; [key: string]: string }, safeBottom: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: colors.textPrimary,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.success + '20',
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerStatusText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: colors.success,
  },
  headerHistoryBtn: {
    padding: SPACING.sm,
  },
  banner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  bannerText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: colors.textPrimary,
  },
  bannerBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: colors.warning,
  },
  bannerBtnText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: colors.background,
  },
  chat: { flex: 1 },
  chatContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl + 24,
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT - 180,
  },
  welcome: {
    flex: 1,
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  welcomeIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  welcomeTokens: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.backgroundCard,
    alignSelf: 'center',
  },
  welcomeTokensText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: colors.textMuted,
  },
  promptsGrid: {
    gap: SPACING.sm,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptChipPressed: {
    opacity: 0.85,
  },
  promptChipText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: colors.textPrimary,
    marginRight: SPACING.sm,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  msgRowBot: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  msgBubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 18,
  },
  msgBubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleBot: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: TAB_BAR_HEIGHT + Math.max(safeBottom, SPACING.sm) + SPACING.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    minWidth: 0,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'column',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.borderHover,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    minHeight: 44,
    minWidth: 100,
  },
  input: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: colors.textPrimary,
    minHeight: 24,
    textAlignVertical: 'top',
  },
  inputCharCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  micButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: SPACING.xs,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  historyModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
    paddingBottom: SPACING.xl,
  },
  historyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: colors.textPrimary,
  },
  historyLoading: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  historyLoadingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: colors.textPrimary,
  },
  historyLoadingSub: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: colors.textMuted,
  },
  historyEmpty: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  historyEmptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  historyEmptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: colors.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  historyEmptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
  historyList: {
    maxHeight: 400,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  historyItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  historyItemTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: colors.textPrimary,
  },
  historyItemMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: colors.textMuted,
    marginTop: SPACING.xs,
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
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
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
    borderBottomColor: colors.border,
  },
  sidebarTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: colors.textPrimary,
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
    borderBottomColor: colors.border,
  },
  newConversationText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: colors.primary,
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
    borderBottomColor: colors.border,
  },
  conversationItemActive: {
    backgroundColor: colors.backgroundCard,
  },
  conversationContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  conversationTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: colors.textPrimary,
    marginBottom: SPACING.xs,
  },
  conversationTitleActive: {
    fontFamily: FONTS.bold,
    color: colors.primary,
  },
  conversationMeta: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: colors.textMuted,
  },
  newConversationTextDisabled: {
    color: colors.textMuted,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: colors.warning + '15',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  limitWarningText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: colors.warning,
    flex: 1,
  },
});
