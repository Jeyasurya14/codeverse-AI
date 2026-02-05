declare module '*.svg' {
  import type { ComponentType } from 'react';
  const content: ComponentType<{ width?: number; height?: number }>;
  export default content;
}
