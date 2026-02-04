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
  getConversations,
  createConversation,
  getConversationMessages,
  deleteConversation,
  getAuthTokens,
  type Conversation,
  type ConversationMessage,
} from '../services/api';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, AI_TOKENS, FONTS, SHADOWS } from '../constants/theme';

const TOKENS_PER_MESSAGE = AI_TOKENS.TOKENS_PER_MESSAGE; // 10 tokens per message

export function AIMentorScreen({ navigation }: any) {
  const { user } = useAuth();
  const { totalAvailable, freeRemaining, refresh } = useTokens();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const canSend = totalAvailable >= TOKENS_PER_MESSAGE && input.trim().length > 0;

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, loadConversations is stable

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversationId]); // Only depend on currentConversationId, loadMessages is stable

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const loadConversations = async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    
    // Check if we have auth token before making request
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) {
      // No auth token, skip API call silently (expected when not authenticated)
      setConversations([]);
      return;
    }
    
    setLoadingConversations(true);
    try {
      const result = await getConversations();
      setConversations(result.conversations || []);
    } catch (e) {
      // Only warn for unexpected errors, not 404/auth errors (expected when not authenticated)
      const errorMsg = e instanceof Error ? e.message : String(e);
      const isExpectedError = 
        errorMsg === 'Not found' ||
        errorMsg.includes('Not found') ||
        errorMsg.includes('404') ||
        errorMsg === 'Authentication required' ||
        errorMsg.includes('Authentication required') ||
        errorMsg.includes('UNAUTHORIZED') ||
        errorMsg.includes('INVALID_TOKEN') ||
        errorMsg.includes('No authentication token') ||
        errorMsg.includes('No authentication');
      
      if (!isExpectedError) {
        __DEV__ && console.warn('Failed to load conversations', e);
      }
      // Set empty array for expected errors (user not authenticated)
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const result = await getConversationMessages(conversationId);
      setMessages(result.messages.map(msg => ({
        role: msg.role,
        text: msg.text,
      })));
    } catch (e) {
      __DEV__ && console.warn('Failed to load messages', e);
      setMessages([]);
    }
  };

  const startNewConversation = async () => {
    try {
      const result = await createConversation();
      setCurrentConversationId(result.conversation.id);
      setMessages([]);
      await loadConversations();
      setSidebarVisible(false);
    } catch (e: any) {
      // Handle conversation limit error (production-grade error handling)
      if (e.message) {
        try {
          const errorData = typeof e.message === 'string' ? JSON.parse(e.message) : e.message;
          if (errorData.error === 'CONVERSATION_LIMIT_REACHED' || errorData.limit !== undefined) {
            const limit = errorData.limit || 2;
            const plan = errorData.plan || 'free';
            const current = errorData.current || limit;
            
            Alert.alert(
              'Conversation Limit Reached',
              `You have reached the maximum of ${limit} conversations for your ${plan} plan (${current}/${limit}). Please delete an existing conversation or upgrade to create more.`,
              [
                { text: 'OK', style: 'cancel' },
                { 
                  text: 'Upgrade Plan', 
                  onPress: () => {
                    // Navigate to upgrade/recharge screen if available
                    try {
                      navigation.navigate('RechargeTokens');
                    } catch {
                      // Screen might not exist, just show OK
                    }
                  },
                  style: 'default',
                },
              ]
            );
            return;
          }
          
          // Handle other structured errors
          if (errorData.error === 'INVALID_INPUT') {
            Alert.alert('Invalid Input', errorData.message || 'Please check your input and try again.');
            return;
          }
          
          if (errorData.error === 'UNAUTHORIZED' || errorData.error === 'INVALID_TOKEN') {
            Alert.alert('Authentication Error', 'Please sign in again.');
            return;
          }
        } catch {
          // Not JSON, continue with regular error handling
        }
      }
      
      // Generic error fallback
      Alert.alert(
        'Error', 
        e.message || 'Failed to create new conversation. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const selectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setSidebarVisible(false);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
              if (currentConversationId === conversationId) {
                setCurrentConversationId(null);
                setMessages([]);
              }
              await loadConversations();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  };

  const sendMessage = async () => {
    if (!canSend || loading) return;
    
    // Input validation
    const text = input.trim();
    if (!text || text.length === 0) {
      return;
    }
    
    // Sanitize input (remove excessive whitespace, limit length)
    const sanitizedText = text.slice(0, 5000); // Max 5000 characters
    
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: sanitizedText }]);
    setLoading(true);
    
    try {
      const result = await sendAIMessage(sanitizedText, undefined, currentConversationId || undefined);
      
      // Validate response
      if (!result || !result.reply) {
        throw new Error('Invalid response from AI');
      }
      
      // Update conversation ID if this was a new conversation
      if (result.conversationId && result.conversationId !== currentConversationId) {
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
      
      setMessages((m) => [...m, { role: 'assistant', text: result.reply }]);
      
      // Reload conversations to update titles/counts (don't block on this)
      loadConversations().catch((loadError) => {
        if (__DEV__) {
          console.warn('Failed to reload conversations:', loadError);
        }
      });
    } catch (e) {
      // Handle insufficient tokens error (402)
      if (e instanceof Error) {
        if (e.message.includes('Insufficient tokens') || e.message.includes('402')) {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              text: `You don't have enough tokens. You need ${TOKENS_PER_MESSAGE} tokens per message. Please recharge to continue.`,
            },
          ]);
        } else if (e.message.includes('CONVERSATION_LIMIT_REACHED')) {
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
        } else {
          setMessages((m) => [...m, { role: 'assistant', text: e.message }]);
        }
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: 'Something went wrong. Try again.' }]);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Ionicons name="menu" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.title}>AI Mentor</Text>
              <Text style={styles.subtitle}>Learning & interview prep</Text>
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

        <ScrollView
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          ref={scrollRef}
        >
          {messages.length === 0 && (
            <Card style={styles.welcome} elevated>
              <View style={styles.welcomeContent}>
                <View style={styles.welcomeIcon}>
                  <Ionicons name="sparkles" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.welcomeTitle}>Your AI Mentor</Text>
                <Text style={styles.welcomeDesc}>
                  Get instant help with coding questions, explanations, and interview preparation. 
                  Each message uses {TOKENS_PER_MESSAGE} tokens.
                </Text>
                <View style={styles.welcomeStats}>
                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Ionicons name="gift" size={14} color={COLORS.secondary} />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Free Tokens</Text>
                      <Text style={styles.statNumber}>
                        {freeRemaining} / {AI_TOKENS.FREE_LIMIT}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Ionicons name="flash" size={14} color={COLORS.warning} />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Total Available</Text>
                      <Text style={styles.statNumber}>{totalAvailable} tokens</Text>
                    </View>
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
                      {msg.text}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.bubbleUser}>
                    <Text style={styles.bubbleTextUser}>
                      {msg.text}
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
            <View style={styles.messageContainer}>
              <View style={styles.avatarBot}>
                <Ionicons name="sparkles" size={18} color={COLORS.primary} />
              </View>
              <View style={[styles.bubble, styles.bubbleBot, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inputRow}
        >
          <View style={styles.inputContainer}>
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
              maxLength={500}
              editable={totalAvailable >= TOKENS_PER_MESSAGE && !loading}
            />
            {input.length > 0 && (
              <Text style={styles.charCount}>{input.length} / 500</Text>
            )}
          </View>
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
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Conversation Sidebar */}
      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebar}>
            <SafeAreaView style={styles.sidebarSafe} edges={['top']}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>Conversations</Text>
                <TouchableOpacity
                  onPress={() => setSidebarVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.newConversationButton}
                onPress={startNewConversation}
                disabled={conversations.length >= 2 && !user} // Disable if free user has 2 conversations
              >
                <Ionicons 
                  name="add" 
                  size={20} 
                  color={conversations.length >= 2 && !user ? COLORS.textMuted : COLORS.primary} 
                />
                <Text style={[
                  styles.newConversationText,
                  conversations.length >= 2 && !user && styles.newConversationTextDisabled,
                ]}>
                  New Conversation
                </Text>
              </TouchableOpacity>
              {conversations.length >= 2 && (
                <View style={styles.limitWarning}>
                  <Ionicons name="information-circle" size={16} color={COLORS.warning} />
                  <Text style={styles.limitWarningText}>
                    Free plan limit: {conversations.length} / 2 conversations
                  </Text>
                </View>
              )}

              <ScrollView style={styles.conversationsList}>
                {loadingConversations ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : conversations.length === 0 ? (
                  <EmptyState
                    icon="chatbubbles-outline"
                    title="No conversations yet"
                    subtitle="Start a new conversation to begin"
                    actionLabel="New conversation"
                    onAction={startNewConversation}
                  />
                ) : (
                  conversations.map((conv) => (
                    <TouchableOpacity
                      key={conv.id}
                      style={[
                        styles.conversationItem,
                        currentConversationId === conv.id && styles.conversationItemActive,
                      ]}
                      onPress={() => selectConversation(conv.id)}
                      onLongPress={() => handleDeleteConversation(conv.id)}
                    >
                      <View style={styles.conversationContent}>
                        <Text 
                          style={[
                            styles.conversationTitle,
                            currentConversationId === conv.id && styles.conversationTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {conv.title}
                        </Text>
                        <Text style={styles.conversationMeta}>
                          {conv.messageCount} messages • {formatDate(conv.updatedAt)}
                        </Text>
                      </View>
                      {currentConversationId === conv.id && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  tokenChipLow: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning + '15',
  },
  tokenInfo: {
    alignItems: 'flex-end',
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
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  welcome: { 
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: SPACING.md,
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
    gap: SPACING.xs,
    justifyContent: 'center',
  },
  welcomeHint: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
    gap: SPACING.xs,
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
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderTopRightRadius: BORDER_RADIUS.sm,
  },
  bubbleBot: {
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignSelf: 'flex-start',
    borderTopLeftRadius: BORDER_RADIUS.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.md + 4,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    maxHeight: 100,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.backgroundCard + '80',
  },
  charCount: {
    position: 'absolute',
    bottom: 6,
    right: SPACING.sm,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: COLORS.background,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
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
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
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
