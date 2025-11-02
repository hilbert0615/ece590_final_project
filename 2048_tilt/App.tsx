import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { SavedGameState } from './src/utils/storageUtils';
import { getCurrentUser } from './src/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from './src/constants/colors';

/**
 * App 主入口组件
 * 实现屏幕导航：登录 -> 主菜单 <-> 游戏界面 <-> 用户资料
 */

type ScreenType = 'login' | 'home' | 'game' | 'profile';

export default function App() {
  // 当前显示的屏幕
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  // 传递给 GameScreen 的初始游戏状态（用于 Resume 功能）
  const [initialGameState, setInitialGameState] = useState<SavedGameState | null>(null);
  // 是否正在检查登录状态
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /**
   * App 启动时检查是否已登录
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 检查是否有登录用户
        const user = await getCurrentUser();

        if (user) {
          console.log('已登录用户:', user.username);
          // 确保清理访客标记
          try { await AsyncStorage.removeItem('is_guest_mode'); } catch {}
          setCurrentScreen('home');
        } else {
          // 检查是否使用访客模式
          const isGuest = await AsyncStorage.getItem('is_guest_mode');
          if (isGuest === 'true') {
            console.log('访客模式');
            setCurrentScreen('home');
          } else {
            setCurrentScreen('login');
          }
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
        setCurrentScreen('login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * 登录成功处理
   */
  const handleLoginSuccess = () => {
    // 登录成功后，确保清理访客标记
    AsyncStorage.removeItem('is_guest_mode').catch(() => {});
    setCurrentScreen('home');
  };

  /**
   * 访客模式处理
   */
  const handleGuestMode = async () => {
    await AsyncStorage.setItem('is_guest_mode', 'true');
    await AsyncStorage.setItem('current_user', 'guest');
    setCurrentScreen('home');
  };

  /**
   * 导航到游戏界面（新游戏）
   */
  const handleNewGame = () => {
    setInitialGameState(null);  // 清空初始状态，开始新游戏
    setCurrentScreen('game');
  };

  /**
   * 导航到游戏界面（Resume）
   */
  const handleResumeGame = (savedState: SavedGameState) => {
    setInitialGameState(savedState);  // 传入已保存的状态
    setCurrentScreen('game');
  };

  /**
   * 导航到用户资料界面
   */
  const handleNavigateToProfile = () => {
    setCurrentScreen('profile');
  };

  /**
   * 登出处理
   */
  const handleLogout = async () => {
    await AsyncStorage.removeItem('is_guest_mode');
    setCurrentScreen('login');
  };

  // 显示加载界面
  if (isCheckingAuth) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {currentScreen === 'login' && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onGuestMode={handleGuestMode}
        />
      )}

      {currentScreen === 'home' && (
        <HomeScreen
          onNavigateToGame={handleNewGame}
          onResumeGame={handleResumeGame}
          onNavigateToProfile={handleNavigateToProfile}
        />
      )}

      {currentScreen === 'game' && (
        <GameScreen
          onBack={() => setCurrentScreen('home')}
          initialGameState={initialGameState}
        />
      )}

      {currentScreen === 'profile' && (
        <UserProfileScreen
          onBack={() => setCurrentScreen('home')}
          onLogout={handleLogout}
          onNavigateToLogin={() => setCurrentScreen('login')}
        />
      )}

      {/* StatusBar 控制顶部状态栏样式 */}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightYellow,
  },
});
