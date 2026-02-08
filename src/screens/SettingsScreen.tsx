import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage, LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { changePassword, deleteAccount } from '../services/api';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../constants/theme';

const TAB_BAR_HEIGHT = 64;

const PRIVACY_URL = 'https://jeyasurya14.github.io/codeverse-privacy-policy/';
const TERMS_URL = 'https://jeyasurya14.github.io/codeverse-privacy-policy/';

export function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { enabled: notificationEnabled, setEnabled: setNotificationEnabled } = useNotification();
  const { theme, setTheme, colors, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [changePwdError, setChangePwdError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setChangePwdError(null);
    if (!currentPassword.trim()) {
      setChangePwdError('Current password is required');
      return;
    }
    if (!newPassword.trim()) {
      setChangePwdError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setChangePwdError('New password must be at least 8 characters');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setChangePwdError('New password must contain uppercase, lowercase, and a number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePwdError('Passwords do not match');
      return;
    }
    setChangePwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully.');
      setChangePasswordVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to change password';
      setChangePwdError(msg);
    } finally {
      setChangePwdLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteAccountVisible(true);
  };

  const handleDeleteAccountConfirm = async () => {
    setDeleteError(null);
    if (!deletePassword.trim()) {
      setDeleteError('Password is required');
      return;
    }
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
      setDeleteAccountVisible(false);
      setDeletePassword('');
      setDeleteConfirm('');
      await signOut();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete account';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), 'Are you sure you want to log out?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {(user?.name ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>{t('settings.title')}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {user?.email ?? ''}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, SPACING.sm) + SPACING.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Languages */}
          <SectionHeader icon="language" title={t('settings.languages')} colors={colors} />
          <SettingsRow
            label={LANGUAGES.find((l) => l.code === language)?.nativeName ?? 'English'}
            onPress={() => setLanguageModalVisible(true)}
            icon="chevron-forward"
            colors={colors}
          />

          {/* Appearance */}
          <SectionHeader icon="color-palette" title={t('settings.appearance')} colors={colors} />
          <View style={[styles.optionGroup, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <OptionRow
              label={t('settings.appearanceLight')}
              selected={theme === 'light'}
              onPress={() => setTheme('light')}
              colors={colors}
            />
            <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />
            <OptionRow
              label={t('settings.appearanceDark')}
              selected={theme === 'dark'}
              onPress={() => setTheme('dark')}
              colors={colors}
            />
            <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />
            <OptionRow
              label={t('settings.appearanceSystem')}
              selected={theme === 'system'}
              onPress={() => setTheme('system')}
              colors={colors}
            />
          </View>

          {/* Notifications */}
          <SectionHeader icon="notifications" title={t('settings.notifications')} colors={colors} />
          <View style={[styles.optionGroup, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <OptionRow
              label={t('settings.engagingReminders')}
              selected={notificationEnabled}
              onPress={() => setNotificationEnabled(!notificationEnabled)}
              colors={colors}
            />
          </View>

          {/* Subscription */}
          <SectionHeader icon="flash" title={t('settings.subscription')} colors={colors} />
          <SettingsRow
            label={t('settings.tokenRecharge')}
            onPress={() => navigation.navigate('RechargeTokens')}
            icon="chevron-forward"
            colors={colors}
          />

          {/* Support */}
          <SectionHeader icon="help-buoy" title={t('settings.support')} colors={colors} />
          <View style={[styles.optionGroup, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <GroupRow
              label={t('settings.contactUs')}
              onPress={() => Linking.openURL('mailto:contact@learn-made.in')}
              icon="open-outline"
              colors={colors}
            />
            <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />
            <GroupRow
              label={t('settings.accountStatus')}
              onPress={() =>
                Alert.alert(
                  t('settings.accountStatus'),
                  `Email: ${user?.email ?? 'N/A'}\nPlan: ${user?.subscriptionPlan ?? 'Free'}`
                )
              }
              icon="chevron-forward"
              colors={colors}
            />
            <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />
            <GroupRow
              label={t('settings.termsAndConditions')}
              onPress={() => Linking.openURL(TERMS_URL)}
              icon="open-outline"
              colors={colors}
            />
            <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />
            <GroupRow
              label={t('settings.privacyPolicy')}
              onPress={() => Linking.openURL(PRIVACY_URL)}
              icon="open-outline"
              colors={colors}
            />
          </View>

          {/* Account */}
          <SectionHeader icon="person" title={t('settings.account')} colors={colors} />
          <View style={[styles.optionGroup, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <GroupRow
              label={t('settings.changePassword')}
              onPress={() => setChangePasswordVisible(true)}
              icon="chevron-forward"
              colors={colors}
            />
            <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />
            <GroupRow
              label={t('settings.deleteAccount')}
              onPress={handleDeleteAccount}
              icon="warning-outline"
              colors={colors}
              danger
            />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Language Picker Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('settings.languages')}
            </Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.modalOption,
                  language === lang.code && { backgroundColor: colors.primaryMuted },
                ]}
                onPress={() => {
                  setLanguage(lang.code as LanguageCode);
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>
                  {lang.nativeName}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.backgroundElevated }]}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setChangePasswordVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboard}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('settings.changePassword')}
              </Text>
              {changePwdError && (
                <Text style={styles.modalError}>{changePwdError}</Text>
              )}
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.backgroundElevated, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Current password"
                placeholderTextColor={colors.textMuted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.backgroundElevated, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="New password"
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.backgroundElevated, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleChangePassword}
                disabled={changePwdLoading}
              >
                {changePwdLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: colors.backgroundElevated }]}
                onPress={() => {
                  setChangePasswordVisible(false);
                  setChangePwdError(null);
                }}
              >
                <Text style={[styles.modalCloseText, { color: colors.primary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteAccountVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteAccountVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteAccountVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboard}
            >
              <Text style={[styles.modalTitle, { color: colors.error }]}>
                {t('settings.deleteAccount')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                This action cannot be undone. Type DELETE and enter your password to confirm.
              </Text>
              {deleteError && (
                <Text style={styles.modalError}>{deleteError}</Text>
              )}
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.backgroundElevated, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Type DELETE to confirm"
                placeholderTextColor={colors.textMuted}
                value={deleteConfirm}
                onChangeText={setDeleteConfirm}
                autoCapitalize="characters"
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.backgroundElevated, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Your password"
                placeholderTextColor={colors.textMuted}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={handleDeleteAccountConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>{t('settings.deleteAccount')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: colors.backgroundElevated }]}
                onPress={() => {
                  setDeleteAccountVisible(false);
                  setDeleteError(null);
                  setDeletePassword('');
                  setDeleteConfirm('');
                }}
              >
                <Text style={[styles.modalCloseText, { color: colors.primary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  colors: typeof COLORS;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );
}

function GroupRow({
  label,
  onPress,
  icon,
  colors,
  danger,
}: {
  label: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  colors: typeof COLORS;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.groupRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.groupRowText, { color: danger ? colors.error : colors.textPrimary }]}>
        {label}
      </Text>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.textMuted} />
    </TouchableOpacity>
  );
}

function SettingsRow({
  label,
  onPress,
  icon,
  colors,
  danger,
}: {
  label: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  colors: typeof COLORS;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.settingsRowText, { color: danger ? colors.error : colors.textPrimary }]}>
        {label}
      </Text>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.textMuted} />
    </TouchableOpacity>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: typeof COLORS;
}) {
  return (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionRowText, { color: colors.textPrimary }]}>{label}</Text>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.border },
          selected && { backgroundColor: colors.primary },
        ]}
      >
        {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    opacity: 0.7,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  optionGroup: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  optionRowText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  optionDivider: {
    height: 1,
    marginLeft: SPACING.md,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  groupRowText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  settingsRowText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    marginTop: SPACING.xl,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl + 24,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalKeyboard: {
    width: '100%',
  },
  modalInput: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
  },
  modalError: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  modalOptionText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  modalClose: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  modalCloseText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
});
