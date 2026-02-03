/**
 * Expo app config – reads from app.json and env.
 * EXPO_PUBLIC_* vars from .env or EAS environment are available at build time.
 */
const appJson = require('./app.json');

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  },
};
