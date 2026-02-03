export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'github';
};

export type ProgrammingLanguage = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  topicCount: number;
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
