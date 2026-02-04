/**
 * CodeVerse design system — typography, color, spacing, elevation
 */
export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#EAB308',
  secondaryDark: '#CA8A04',
  secondaryMuted: 'rgba(234, 179, 8, 0.15)',

  background: '#0B1120',
  backgroundCard: '#151D2E',
  backgroundElevated: '#1E293B',
  backgroundAuth: '#0B1120',

  gradientAccent: ['#2563EB', '#EAB308'] as [string, string],

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  border: 'rgba(148, 163, 184, 0.12)',
  borderFocus: 'rgba(37, 99, 235, 0.5)',

  /** Code block in articles */
  codeBackground: '#0F172A',
  codeBorder: 'rgba(59, 130, 246, 0.2)',
  codeText: '#E2E8F0',

  neonBlue: '#3B82F6',
  neonYellow: '#FACC15',
  glowBlue: 'rgba(59, 130, 246, 0.35)',
  glowYellow: 'rgba(234, 179, 8, 0.3)',

  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
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

/** Subtle elevation for cards */
export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

export const AI_TOKENS = {
  FREE_LIMIT: 300,
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
