import { ProgrammingLanguage, Article } from '../types';
import { ARTICLE_CONTENT } from './articleContent';

export const MOCK_LANGUAGES: ProgrammingLanguage[] = [
  // Programming Languages
  { 
    id: '1', 
    name: 'JavaScript', 
    slug: 'javascript', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', 
    description: 'Web and Node.js', 
    topicCount: 14, 
    category: 'language' 
  },
  { 
    id: '2', 
    name: 'Python', 
    slug: 'python', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', 
    description: 'General purpose & data', 
    topicCount: 14, 
    category: 'language' 
  },
  { 
    id: '3', 
    name: 'TypeScript', 
    slug: 'typescript', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg', 
    description: 'Typed JavaScript', 
    topicCount: 10, 
    category: 'language' 
  },
  { 
    id: '5', 
    name: 'Java', 
    slug: 'java', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg', 
    description: 'Enterprise applications', 
    topicCount: 12, 
    category: 'language' 
  },
  { 
    id: '6', 
    name: 'C++', 
    slug: 'cpp', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg', 
    description: 'System programming', 
    topicCount: 10, 
    category: 'language' 
  },
  { 
    id: '7', 
    name: 'Go', 
    slug: 'go', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg', 
    description: 'Concurrent programming', 
    topicCount: 8, 
    category: 'language' 
  },
  
  // Frameworks
  { 
    id: '4', 
    name: 'React', 
    slug: 'react', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', 
    description: 'UI library', 
    topicCount: 8, 
    category: 'framework' 
  },
  { 
    id: '8', 
    name: 'Vue.js', 
    slug: 'vue', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg', 
    description: 'Progressive framework', 
    topicCount: 7, 
    category: 'framework' 
  },
  { 
    id: '9', 
    name: 'Angular', 
    slug: 'angular', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg', 
    description: 'Full-featured framework', 
    topicCount: 9, 
    category: 'framework' 
  },
  { 
    id: '10', 
    name: 'Next.js', 
    slug: 'nextjs', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', 
    description: 'React framework', 
    topicCount: 6, 
    category: 'framework' 
  },
  { 
    id: '11', 
    name: 'Express.js', 
    slug: 'express', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', 
    description: 'Node.js framework', 
    topicCount: 5, 
    category: 'framework' 
  },
  { 
    id: '12', 
    name: 'Django', 
    slug: 'django', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg', 
    description: 'Python web framework', 
    topicCount: 7, 
    category: 'framework' 
  },
  
  // AI/ML
  { 
    id: '13', 
    name: 'TensorFlow', 
    slug: 'tensorflow', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg', 
    description: 'Machine learning', 
    topicCount: 8, 
    category: 'aiml' 
  },
  { 
    id: '14', 
    name: 'PyTorch', 
    slug: 'pytorch', 
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg', 
    description: 'Deep learning', 
    topicCount: 7, 
    category: 'aiml' 
  },
  { 
    id: '15', 
    name: 'Scikit-learn', 
    slug: 'scikit-learn', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Scikit_learn_logo_small.svg', 
    description: 'ML algorithms', 
    topicCount: 6, 
    category: 'aiml' 
  },
  { 
    id: '16', 
    name: 'OpenAI API', 
    slug: 'openai', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', 
    description: 'AI integration', 
    topicCount: 5, 
    category: 'aiml' 
  },
];

const fallbackContent = `Content for this article is being prepared. Check back soon!

**Key points:**
- More learning material is on the way.
- Use other articles in this track in the meantime.`;

function getContent(languageId: string, slug: string): string {
  return ARTICLE_CONTENT[`${languageId}-${slug}`] ?? fallbackContent;
}

export const MOCK_ARTICLES: Record<string, Article[]> = {
  '1': [
    { id: '1-1', languageId: '1', title: 'Introduction to JavaScript', slug: 'intro-js', level: 'beginner', content: getContent('1', 'intro-js'), readTimeMinutes: 5, order: 1 },
    { id: '1-2', languageId: '1', title: 'Variables and Data Types', slug: 'variables', level: 'beginner', content: getContent('1', 'variables'), readTimeMinutes: 7, order: 2 },
    { id: '1-3', languageId: '1', title: 'Functions and Scope', slug: 'functions', level: 'intermediate', content: getContent('1', 'functions'), readTimeMinutes: 10, order: 3 },
    { id: '1-4', languageId: '1', title: 'Control Flow: Conditionals and Loops', slug: 'control-flow', level: 'beginner', content: getContent('1', 'control-flow'), readTimeMinutes: 8, order: 4 },
    { id: '1-5', languageId: '1', title: 'Arrays and Array Methods', slug: 'arrays', level: 'beginner', content: getContent('1', 'arrays'), readTimeMinutes: 12, order: 5 },
    { id: '1-6', languageId: '1', title: 'Objects and Prototypes', slug: 'objects-prototypes', level: 'intermediate', content: getContent('1', 'objects-prototypes'), readTimeMinutes: 11, order: 6 },
    { id: '1-7', languageId: '1', title: 'ES6+: Arrow Functions and Destructuring', slug: 'es6-basics', level: 'intermediate', content: getContent('1', 'es6-basics'), readTimeMinutes: 9, order: 7 },
    { id: '1-8', languageId: '1', title: 'Promises and Async/Await', slug: 'async-await', level: 'intermediate', content: getContent('1', 'async-await'), readTimeMinutes: 14, order: 8 },
    { id: '1-9', languageId: '1', title: 'Closures and Higher-Order Functions', slug: 'closures', level: 'intermediate', content: getContent('1', 'closures'), readTimeMinutes: 10, order: 9 },
    { id: '1-10', languageId: '1', title: 'Error Handling and Debugging', slug: 'error-handling', level: 'intermediate', content: getContent('1', 'error-handling'), readTimeMinutes: 8, order: 10 },
    { id: '1-11', languageId: '1', title: 'Modules: import and export', slug: 'modules', level: 'intermediate', content: getContent('1', 'modules'), readTimeMinutes: 7, order: 11 },
    { id: '1-12', languageId: '1', title: 'Classes and OOP in JavaScript', slug: 'classes-oop', level: 'intermediate', content: getContent('1', 'classes-oop'), readTimeMinutes: 11, order: 12 },
    { id: '1-13', languageId: '1', title: 'The Event Loop and Concurrency', slug: 'event-loop', level: 'advanced', content: getContent('1', 'event-loop'), readTimeMinutes: 15, order: 13 },
    { id: '1-14', languageId: '1', title: 'Working with the DOM', slug: 'dom', level: 'intermediate', content: getContent('1', 'dom'), readTimeMinutes: 12, order: 14 },
  ],
  '2': [
    { id: '2-1', languageId: '2', title: 'Introduction to Python', slug: 'intro-python', level: 'beginner', content: getContent('2', 'intro-python'), readTimeMinutes: 5, order: 1 },
    { id: '2-2', languageId: '2', title: 'Lists and Dictionaries', slug: 'lists-dicts', level: 'beginner', content: getContent('2', 'lists-dicts'), readTimeMinutes: 8, order: 2 },
    { id: '2-3', languageId: '2', title: 'Variables, Types, and Operators', slug: 'variables-types', level: 'beginner', content: getContent('2', 'variables-types'), readTimeMinutes: 6, order: 3 },
    { id: '2-4', languageId: '2', title: 'Control Flow: if, elif, and Loops', slug: 'control-flow', level: 'beginner', content: getContent('2', 'control-flow'), readTimeMinutes: 8, order: 4 },
    { id: '2-5', languageId: '2', title: 'Functions and Arguments', slug: 'functions', level: 'beginner', content: getContent('2', 'functions'), readTimeMinutes: 9, order: 5 },
    { id: '2-6', languageId: '2', title: 'Strings and Formatting', slug: 'strings', level: 'beginner', content: getContent('2', 'strings'), readTimeMinutes: 7, order: 6 },
    { id: '2-7', languageId: '2', title: 'Tuples, Sets, and Comprehensions', slug: 'tuples-sets', level: 'intermediate', content: getContent('2', 'tuples-sets'), readTimeMinutes: 10, order: 7 },
    { id: '2-8', languageId: '2', title: 'Modules and the Standard Library', slug: 'modules', level: 'intermediate', content: getContent('2', 'modules'), readTimeMinutes: 8, order: 8 },
    { id: '2-9', languageId: '2', title: 'File I/O and Working with Paths', slug: 'file-io', level: 'intermediate', content: getContent('2', 'file-io'), readTimeMinutes: 9, order: 9 },
    { id: '2-10', languageId: '2', title: 'Classes and Object-Oriented Python', slug: 'classes-oop', level: 'intermediate', content: getContent('2', 'classes-oop'), readTimeMinutes: 12, order: 10 },
    { id: '2-11', languageId: '2', title: 'Error Handling: try and except', slug: 'error-handling', level: 'intermediate', content: getContent('2', 'error-handling'), readTimeMinutes: 7, order: 11 },
    { id: '2-12', languageId: '2', title: 'Decorators and Generators', slug: 'decorators-generators', level: 'intermediate', content: getContent('2', 'decorators-generators'), readTimeMinutes: 11, order: 12 },
    { id: '2-13', languageId: '2', title: 'Virtual Environments and pip', slug: 'venv-pip', level: 'intermediate', content: getContent('2', 'venv-pip'), readTimeMinutes: 6, order: 13 },
    { id: '2-14', languageId: '2', title: 'Introduction to Data Structures and Algorithms', slug: 'ds-algo', level: 'advanced', content: getContent('2', 'ds-algo'), readTimeMinutes: 14, order: 14 },
  ],
  '3': [
    { id: '3-1', languageId: '3', title: 'TypeScript Basics', slug: 'ts-basics', level: 'beginner', content: getContent('3', 'ts-basics'), readTimeMinutes: 6, order: 1 },
    { id: '3-2', languageId: '3', title: 'Types and Type Annotations', slug: 'types-annotations', level: 'beginner', content: getContent('3', 'types-annotations'), readTimeMinutes: 8, order: 2 },
    { id: '3-3', languageId: '3', title: 'Interfaces and Type Aliases', slug: 'interfaces-aliases', level: 'beginner', content: getContent('3', 'interfaces-aliases'), readTimeMinutes: 9, order: 3 },
    { id: '3-4', languageId: '3', title: 'Functions and Function Types', slug: 'functions', level: 'beginner', content: getContent('3', 'functions'), readTimeMinutes: 7, order: 4 },
    { id: '3-5', languageId: '3', title: 'Unions, Literals, and Narrowing', slug: 'unions-literals', level: 'intermediate', content: getContent('3', 'unions-literals'), readTimeMinutes: 10, order: 5 },
    { id: '3-6', languageId: '3', title: 'Generics Basics', slug: 'generics', level: 'intermediate', content: getContent('3', 'generics'), readTimeMinutes: 11, order: 6 },
    { id: '3-7', languageId: '3', title: 'Utility Types: Partial, Pick, Omit', slug: 'utility-types', level: 'intermediate', content: getContent('3', 'utility-types'), readTimeMinutes: 8, order: 7 },
    { id: '3-8', languageId: '3', title: 'Classes and Inheritance in TS', slug: 'classes', level: 'intermediate', content: getContent('3', 'classes'), readTimeMinutes: 9, order: 8 },
    { id: '3-9', languageId: '3', title: 'Configuring tsconfig.json', slug: 'tsconfig', level: 'intermediate', content: getContent('3', 'tsconfig'), readTimeMinutes: 7, order: 9 },
    { id: '3-10', languageId: '3', title: 'Advanced Types and Conditional Types', slug: 'advanced-types', level: 'advanced', content: getContent('3', 'advanced-types'), readTimeMinutes: 13, order: 10 },
  ],
  '4': [
    { id: '4-1', languageId: '4', title: 'Components and JSX', slug: 'components-jsx', level: 'beginner', content: getContent('4', 'components-jsx'), readTimeMinutes: 8, order: 1 },
    { id: '4-2', languageId: '4', title: 'Props and Component Composition', slug: 'props-composition', level: 'beginner', content: getContent('4', 'props-composition'), readTimeMinutes: 7, order: 2 },
    { id: '4-3', languageId: '4', title: 'State and useState', slug: 'state-usestate', level: 'beginner', content: getContent('4', 'state-usestate'), readTimeMinutes: 9, order: 3 },
    { id: '4-4', languageId: '4', title: 'Handling Events and Forms', slug: 'events-forms', level: 'beginner', content: getContent('4', 'events-forms'), readTimeMinutes: 8, order: 4 },
    { id: '4-5', languageId: '4', title: 'useEffect and Side Effects', slug: 'useeffect', level: 'intermediate', content: getContent('4', 'useeffect'), readTimeMinutes: 11, order: 5 },
    { id: '4-6', languageId: '4', title: 'Custom Hooks', slug: 'custom-hooks', level: 'intermediate', content: getContent('4', 'custom-hooks'), readTimeMinutes: 10, order: 6 },
    { id: '4-7', languageId: '4', title: 'Context API and Global State', slug: 'context', level: 'intermediate', content: getContent('4', 'context'), readTimeMinutes: 9, order: 7 },
    { id: '4-8', languageId: '4', title: 'Performance: memo, useMemo, useCallback', slug: 'performance', level: 'advanced', content: getContent('4', 'performance'), readTimeMinutes: 12, order: 8 },
  ],
};
