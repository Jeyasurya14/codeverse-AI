import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useVoice, VoiceLanguageCode, VoiceRate } from '../context/VoiceContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';

type ArticleVoiceBarProps = {
  articleId: string;
  content: string;
};

const VOICE_LANGUAGES: { code: VoiceLanguageCode; labelKey: string; comingSoon?: boolean }[] = [
  { code: 'en', labelKey: 'voice.language.en' },
  { code: 'ta', labelKey: 'voice.language.ta' },
  { code: 'thunglish', labelKey: 'voice.language.thunglish' },
  { code: 'hi', labelKey: 'voice.language.hi' },
];

const VOICE_RATES: { rate: VoiceRate; label: string }[] = [
  { rate: 0.5, label: '0.5x' },
  { rate: 1.0, label: '1x' },
  { rate: 1.25, label: '1.25x' },
  { rate: 1.5, label: '1.5x' },
];

export function ArticleVoiceBar({ articleId, content }: ArticleVoiceBarProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    isPlaying,
    isPaused,
    currentChunkIndex,
    totalChunks,
    language,
    rate,
    articleId: activeArticleId,
    error,
    play,
    pause,
    resume,
    stop,
    setLanguage,
    setRate,
    clearError,
  } = useVoice();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const { width } = useWindowDimensions();

  const isActive = activeArticleId === articleId;
  const canPlay = content.trim().length > 0;
  const progress = totalChunks > 0 ? currentChunkIndex / totalChunks : 0;

  const handlePlayPause = () => {
    if (!canPlay) return;
    if (error) clearError();
    if (isActive && (isPlaying || isPaused)) {
      if (isPaused) resume();
      else pause();
    } else if (isActive && !isPlaying && !isPaused && currentChunkIndex > 0) {
      resume();
    } else {
      play(articleId, content);
    }
  };

  const handleStop = () => {
    if (isActive) stop();
  };

  const themedStyles = StyleSheet.create({
    bar: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    playBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playBtnDisabled: {
      backgroundColor: colors.backgroundElevated,
      opacity: 0.6,
    },
    progressBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.backgroundElevated,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      width: `${progress * 100}%`,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.semiBold,
      color: colors.textPrimary,
    },
    errorText: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      color: colors.error,
      marginTop: SPACING.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    modalContent: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.xl,
      width: Math.min(width - SPACING.lg * 4, 320),
      maxHeight: 400,
    },
    modalTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: colors.textPrimary,
      marginBottom: SPACING.lg,
    },
    langOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.xs,
    },
    langOptionActive: {
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    langOptionText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: colors.textPrimary,
    },
    comingSoon: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      color: colors.textMuted,
    },
  });

  return (
    <View style={themedStyles.bar}>
      <View style={themedStyles.row}>
        <TouchableOpacity
          style={[themedStyles.playBtn, !canPlay && themedStyles.playBtnDisabled]}
          onPress={handlePlayPause}
          disabled={!canPlay}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isActive && isPlaying ? 'pause' : isActive && isPaused ? 'play' : 'headset'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <View style={themedStyles.progressBar}>
            <View style={themedStyles.progressFill} />
          </View>
          {totalChunks > 0 && (
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {t('voice.listen')} · {currentChunkIndex + 1}/{totalChunks}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={themedStyles.pill}
          onPress={() => setLangModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="language" size={16} color={colors.primary} />
          <Text style={themedStyles.pillText}>
            {language === 'en' ? 'EN' : language === 'ta' ? 'TA' : language === 'thunglish' ? 'T+E' : 'HI'}
          </Text>
        </TouchableOpacity>

        {(isActive && (isPlaying || isPaused)) && (
          <TouchableOpacity style={themedStyles.pill} onPress={handleStop} activeOpacity={0.7}>
            <Ionicons name="stop" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[themedStyles.row, { marginTop: SPACING.sm }]}>
        {VOICE_RATES.map(({ rate: r, label }) => (
          <TouchableOpacity
            key={r}
            style={[
              themedStyles.pill,
              rate === r && { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
            ]}
            onPress={() => setRate(r)}
            activeOpacity={0.7}
          >
            <Text style={[themedStyles.pillText, rate === r && { color: colors.primary }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && isActive && (
        <Text style={themedStyles.errorText} onPress={clearError}>
          {error}
        </Text>
      )}

      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={themedStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={themedStyles.modalContent}
          >
            <Text style={themedStyles.modalTitle}>{t('voice.language')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {VOICE_LANGUAGES.map(({ code, labelKey, comingSoon }) => (
                <TouchableOpacity
                  key={code}
                  style={[themedStyles.langOption, language === code && themedStyles.langOptionActive]}
                  onPress={() => {
                    if (!comingSoon) {
                      setLanguage(code);
                      setLangModalVisible(false);
                    }
                  }}
                  disabled={comingSoon}
                  activeOpacity={0.7}
                >
                  <Text style={themedStyles.langOptionText}>{t(labelKey)}</Text>
                  {comingSoon ? (
                    <Text style={themedStyles.comingSoon}>{t('voice.comingSoon')}</Text>
                  ) : (
                    language === code && <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
});
