/**
 * Region detection for country-based pricing.
 * Uses device locale (Intl) to infer region; fallback to US.
 */
import type { PricingRegion } from '../constants/theme';

/** Locale-to-region mapping (e.g. en-IN -> IN, en-US -> US) */
const LOCALE_TO_REGION: Record<string, PricingRegion> = {
  IN: 'IN',
  US: 'US',
  GB: 'GB',
  UK: 'GB',
  IE: 'EU',
  DE: 'EU',
  FR: 'EU',
  IT: 'EU',
  ES: 'EU',
  NL: 'EU',
  BE: 'EU',
  AT: 'EU',
  PT: 'EU',
  PL: 'EU',
  SE: 'EU',
  FI: 'EU',
};

/**
 * Detect pricing region from device locale.
 * Uses Intl.DateTimeFormat().resolvedOptions().locale (e.g. en-IN, en-US).
 */
export function detectPricingRegion(): PricingRegion {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parts = locale.split('-');
    const regionCode = parts[1]?.toUpperCase() ?? 'US';
    return LOCALE_TO_REGION[regionCode] ?? 'US';
  } catch {
    return 'US';
  }
}
