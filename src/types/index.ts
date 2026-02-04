export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'email';
  mfaEnabled?: boolean;
  emailVerified?: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
};

export type ProgrammingLanguage = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  topicCount: number;
  category: 'language' | 'framework' | 'aiml';
};

export type Article = {
  id: string;
  languageId: string;
  title: string;
  slug: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  readTimeMinutes: number;
  order: number;
};

export type TokenBalance = {
  freeUsed: number;
  purchased: number;
  purchasedUsed: number;
};
