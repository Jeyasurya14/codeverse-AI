/**
 * CodeVerse design system — typography, color, spacing, elevation
 */
export const COLORS = {
  // Primary brand colors - refined blue
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  primaryMuted: 'rgba(59, 130, 246, 0.1)',
  
  // Secondary accent - refined gold/yellow
  secondary: '#F59E0B',
  secondaryDark: '#D97706',
  secondaryLight: '#FBBF24',
  secondaryMuted: 'rgba(245, 158, 11, 0.15)',

  // Background hierarchy - subtle depth
  background: '#0F172A',
  backgroundCard: '#1E293B',
  backgroundElevated: '#334155',
  backgroundAuth: '#0F172A',
  backgroundOverlay: 'rgba(15, 23, 42, 0.8)',

  // Gradient accents - professional gradients
  gradientAccent: ['#3B82F6', '#8B5CF6'] as [string, string],
  gradientPrimary: ['#3B82F6', '#2563EB'] as [string, string],
  gradientSecondary: ['#F59E0B', '#D97706'] as [string, string],

  // Text hierarchy - improved contrast
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',

  // Borders - subtle and refined
  border: 'rgba(148, 163, 184, 0.08)',
  borderLight: 'rgba(148, 163, 184, 0.04)',
  borderFocus: 'rgba(59, 130, 246, 0.4)',
  borderHover: 'rgba(148, 163, 184, 0.16)',

  // Code block styling
  codeBackground: '#0F172A',
  codeBorder: 'rgba(59, 130, 246, 0.15)',
  codeText: '#E2E8F0',

  // Accent colors
  neonBlue: '#3B82F6',
  neonYellow: '#FBBF24',
  glowBlue: 'rgba(59, 130, 246, 0.25)',
  glowYellow: 'rgba(245, 158, 11, 0.25)',

  // Status colors
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.15)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

/** Type scale — use with fontFamily: FONTS.primary */
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  title: 26,
  hero: 30,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.5,
} as const;

export const FONTS = {
  primary: 'PlusJakartaSans_600SemiBold',
  medium: 'PlusJakartaSans_500Medium',
  regular: 'PlusJakartaSans_400Regular',
  bold: 'PlusJakartaSans_700Bold',
  /** Reading / article body — friendlier for long text */
  reading: 'DMSans_400Regular',
  readingMedium: 'DMSans_500Medium',
} as const;

/** Professional shadows with depth */
export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  glow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 0,
  },
} as const;

export const AI_TOKENS = {
  FREE_LIMIT: 300, // Match backend constant
  TOKENS_PER_MESSAGE: 10, // Fixed cost per AI message
  MIN_TOKENS_TO_SEND: 10, // Minimum tokens required to send a message
  RECHARGE_PACKS: [
    { id: 'starter', tokens: 500, price: 0.99, label: 'Starter', popular: false },
    { id: 'learner', tokens: 1500, price: 2.99, label: 'Learner', popular: true },
    { id: 'pro', tokens: 5000, price: 7.99, label: 'Pro', popular: false },
    { id: 'unlimited', tokens: 15000, price: 14.99, label: 'Unlimited', popular: false },
  ],
} as const;

export const STORAGE_KEYS = {
  REMEMBER_ME: '@codeverse/remember_me',
  USER: '@codeverse/user',
  TOKENS_USED: '@codeverse/tokens_used',
  TOKENS_PURCHASED: '@codeverse/tokens_purchased',
  ONBOARDING_DONE: '@codeverse/onboarding_done',
  AUTH_TOKEN: '@codeverse/auth_token',
  LAST_READ_ARTICLE: '@codeverse/last_read_article',
  BOOKMARKS: '@codeverse/bookmarks',
  PENDING_OAUTH: '@codeverse/pending_oauth',
} as const;
