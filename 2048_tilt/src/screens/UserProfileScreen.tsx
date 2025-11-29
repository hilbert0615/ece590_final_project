import React, { useState, useEffect } from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { getCurrentUserWithEmail, signOut, updateUserProfile } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';
import { getUserScoreHistory } from '../services/scoreService';
import { UserProfile, GameScore } from '../services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar } from '../services/storageService';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image, useWindowDimensions } from 'react-native';

/**
 * UserProfileScreen - 用户资料界面
 */

interface UserProfileScreenProps {
  onBack: () => void;           // 返回主菜单
  onLogout: () => void;         // 登出后的回调
  onNavigateToLogin: () => void; // 导航到登录页的回调
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  onBack,
  onLogout,
  onNavigateToLogin,
}) => {
  const { backgroundColor, textColor, isDarkMode } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scoreHistory, setScoreHistory] = useState<GameScore[]>([]);
  const [email, setEmail] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  /**
   * 加载用户资料和历史分数
   */
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);

      // 先尝试读取已登录用户；如果有，就优先生效（不被访客标记覆盖）
      const user = await getCurrentUserWithEmail();
      if (user) {
        setProfile(user.profile);
        setEmail(user.email);
        // 清除可能残留的访客标记
        await AsyncStorage.removeItem('is_guest_mode');

        // 获取历史分数
        const { scores } = await getUserScoreHistory(user.profile.id);
        if (scores) {
          setScoreHistory(scores);
        }
      } else {
        // 未登录，再看是否处于访客模式
        const guestMode = await AsyncStorage.getItem('is_guest_mode');
        if (guestMode === 'true') {
          setIsGuestMode(true);
        }
      }

      setIsLoading(false);
    };

    loadUserData();
  }, []);

  /**
   * 处理登出
   */
  const handleLogout = () => {
    Alert.alert(
      'Confirm logout',
      'Are you sure you want to log out? Unfinished games will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Logout failed', error);
              return;
            }
            onLogout();
          },
        },
      ]
    );
  };

  /**
   * 点击头像，弹出选择对话框（相册或相机）
   */
  const handleAvatarPress = () => {
    Alert.alert(
      'Change profile picture',
      'Please select the image source.',
      [
        {
          text: 'Select from photo album',
          onPress: () => handlePickAndUploadAvatar(false),
        },
        {
          text: 'Take a photo and upload it',
          onPress: () => handlePickAndUploadAvatar(true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /**
   * 选择图片（相册/相机）并上传为头像
   */
  const handlePickAndUploadAvatar = async (fromCamera: boolean) => {
    try {
      if (!profile) return;

      // 请求权限
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Insufficient permissions', 'Camera permission is required to take photos and upload your profile picture.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Insufficient permissions', 'Album access permission is required to select a profile picture.');
          return;
        }
      }

      // 选择/拍摄图片
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      setIsUploading(true);
      // 上传到 Supabase Storage
      const { publicUrl, error } = await uploadAvatar(profile.id, uri);
      if (error || !publicUrl) {
        setIsUploading(false);
        Alert.alert('Upload failed', error || 'Please try again later');
        return;
      }

      // 更新 profile 的 avatar_url
      const { profile: updated, error: updateError } = await updateUserProfile(profile.id, { avatar_url: publicUrl });
      setIsUploading(false);
      if (updateError || !updated) {
        Alert.alert('Failed to update avatar', updateError || 'Please try again later');
        return;
      }

      setProfile(updated);
      Alert.alert('Avatar updated successful');
    } catch (e) {
      setIsUploading(false);
      console.error('Upload avatar error:', e);
      Alert.alert('Upload failed', 'Please try again later');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      </SafeAreaView>
    );
  }

  // 访客模式界面
  if (isGuestMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'left', 'right']}>
        {/* 顶部栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={28} color={isDarkMode ? textColor : COLORS.gray} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? textColor : '#776E65' }]}>Guest Mode</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.guestModeContainer}>
          {/* 访客图标 */}
          <View style={styles.guestIconContainer}>
            <Ionicons name="person-circle-outline" size={100} color={isDarkMode ? textColor : COLORS.gray} />
          </View>

          {/* 提示文字 */}
          <Text style={[styles.guestTitle, { color: isDarkMode ? textColor : '#776E65' }]}>You are using Guest mode.</Text>
          <Text style={[styles.guestDescription, { color: isDarkMode ? textColor : COLORS.gray }]}>
            After logging into your account, you can: {'\n'}
            • Save your game progress to the cloud{'\n'}
            • View the global leaderboard{'\n'}
            • Sync your progress across multiple devices{'\n'}
          </Text>

          {/* 登录/注册按钮 */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.loginButtonText}>Login / Register</Text>
          </TouchableOpacity>

          {/* 继续以访客身份游戏 */}
          <TouchableOpacity
            style={styles.continueGuestButton}
            onPress={onBack}
          >
            <Text style={styles.continueGuestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 无法加载用户资料
  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load user profile</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={28} color="#776E65" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? textColor : '#776E65' }]}>User Profile</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLandscape ? (
          <View style={styles.landscapeContainer}>
            <View style={styles.landscapeLeftPanel}>
              {/* 头像和用户名区域 */}
              <View style={styles.topSection}>
                {/* 头像 */}
                <TouchableOpacity
                  style={styles.avatarWrapper}
                  onPress={handleAvatarPress}
                  disabled={isUploading}
                  activeOpacity={0.7}
                >
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={50} color="#BBADA0" />
                    </View>
                  )}
                  {/* 相机图标提示 */}
                  <View style={styles.avatarOverlay}>
                    <Ionicons name="camera" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {isUploading && (
                  <Text style={styles.uploadingText}>Uploading...</Text>
                )}

                {/* 用户名 */}
                <Text style={[styles.username, { color: isDarkMode ? textColor : '#776E65' }]}>{profile.username}</Text>

                {/* 邮箱 */}
                <Text style={[styles.email, { color: isDarkMode ? textColor : COLORS.gray }]}>{email || '-'}</Text>
              </View>
            </View>

            <View style={styles.landscapeRightPanel}>
              {/* 最高分卡片 */}
              <View style={styles.statsCardContainer}>
                <View style={styles.statsCard}>
                  <Ionicons name="trophy" size={32} color={COLORS.orange} />
                  <View style={styles.statsTextContainer}>
                    <Text style={styles.statsLabel}>Highest Score</Text>
                    <Text style={styles.statsValue}>{profile.best_score}</Text>
                  </View>
                </View>
              </View>

              {/* 登出按钮 */}
              <View style={styles.logoutButtonContainer}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* 头像和用户名区域 */}
            <View style={styles.topSection}>
              {/* 头像 */}
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={handleAvatarPress}
                disabled={isUploading}
                activeOpacity={0.7}
              >
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={50} color="#BBADA0" />
                  </View>
                )}
                {/* 相机图标提示 */}
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {isUploading && (
                <Text style={styles.uploadingText}>Uploading...</Text>
              )}

              {/* 用户名 */}
              <Text style={[styles.username, { color: isDarkMode ? textColor : '#776E65' }]}>{profile.username}</Text>

              {/* 邮箱 */}
              <Text style={[styles.email, { color: isDarkMode ? textColor : COLORS.gray }]}>{email || '-'}</Text>
            </View>

            {/* 最高分卡片 */}
            <View style={styles.statsCardContainer}>
              <View style={styles.statsCard}>
                <Ionicons name="trophy" size={32} color={COLORS.orange} />
                <View style={styles.statsTextContainer}>
                  <Text style={styles.statsLabel}>Highest Score</Text>
                  <Text style={styles.statsValue}>{profile.best_score}</Text>
                </View>
              </View>
            </View>

            {/* 登出按钮 */}
            <View style={styles.logoutButtonContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // 顶部栏
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.lightYellow,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // 内容区域
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  // 顶部区域（头像 + 用户名 + 邮箱）
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEE4DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.lightYellow,
  },
  uploadingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  username: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 20,
  },
  email: {
    fontSize: 16,
    marginBottom: 8,
  },

  // 统计卡片
  statsCardContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 200,  // 设置最小宽度
  },
  statsTextContainer: {
    marginLeft: 45,
    alignItems: 'center',  // 文字居中
  },
  statsLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
    textAlign: 'center',
  },
  statsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.orange,
    textAlign: 'center',
  },

  // 登出按钮
  logoutButtonContainer: {
    alignItems: 'center',
    marginTop: 48,  // 增加与上面的间距
  },
  logoutButton: {
    backgroundColor: '#DC6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,  // 固定左右内边距
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 加载/错误状态
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.gray,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 访客模式样式
  guestModeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestIconContainer: {
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  guestDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  continueGuestButton: {
    paddingVertical: 12,
  },
  continueGuestButtonText: {
    fontSize: 14,
    color: COLORS.gray,
    textDecorationLine: 'underline',
  },

  // 横屏模式样式
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeLeftPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    paddingRight: 20,
  },
  landscapeRightPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
});
