/**
 * Expo app config – production-grade.
 * EXPO_PUBLIC_* from .env (dev) or EAS Environment (production builds).
 * Do not put secrets here; use EAS secrets and backend env.
 */
const appJson = require('./app.json');

const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const isProduction = appEnv === 'production';

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    appEnv,
    isProduction,
  },
};
