/**
 * Real logos: PNG from programming-languages-logos, SVG from assets/logos (frameworks & AI/ML).
 * Static require() so Metro can bundle. getLocalLogo returns image source or SVG component.
 */
import type { ComponentType } from 'react';
import type { ImageSourcePropType } from 'react-native';

// PNG (programming-languages-logos)
const PNG: Record<string, ImageSourcePropType> = {
  javascript: require('programming-languages-logos/src/javascript/javascript.png'),
  python: require('programming-languages-logos/src/python/python.png'),
  typescript: require('programming-languages-logos/src/typescript/typescript.png'),
  java: require('programming-languages-logos/src/java/java.png'),
  cpp: require('programming-languages-logos/src/cpp/cpp.png'),
  go: require('programming-languages-logos/src/go/go.png'),
};

// SVG (src/assets/logos – frameworks & AI/ML); transformer exports default
const ReactLogo = require('../assets/logos/react.svg').default;
const VueLogo = require('../assets/logos/vue.svg').default;
const AngularLogo = require('../assets/logos/angular.svg').default;
const NextjsLogo = require('../assets/logos/nextjs.svg').default;
const ExpressLogo = require('../assets/logos/express.svg').default;
const DjangoLogo = require('../assets/logos/django.svg').default;
const TensorflowLogo = require('../assets/logos/tensorflow.svg').default;
const PytorchLogo = require('../assets/logos/pytorch.svg').default;
const ScikitlearnLogo = require('../assets/logos/scikitlearn.svg').default;
const OpenaiLogo = require('../assets/logos/openai.svg').default;

type SvgComponent = ComponentType<{ width?: number; height?: number }>;
const SVG: Record<string, SvgComponent> = {
  react: ReactLogo,
  vue: VueLogo,
  angular: AngularLogo,
  nextjs: NextjsLogo,
  express: ExpressLogo,
  django: DjangoLogo,
  tensorflow: TensorflowLogo,
  pytorch: PytorchLogo,
  'scikit-learn': ScikitlearnLogo,
  openai: OpenaiLogo,
};

export type LogoSource = ImageSourcePropType | SvgComponent;

export function getLocalLogo(slug: string): LogoSource | null {
  return PNG[slug] ?? SVG[slug] ?? null;
}
