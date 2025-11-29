import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { MenuButton } from '../components/MenuButton';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, loadGameState, SavedGameState, } from '../utils/storageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

interface HomeScreenProps {
  onNavigateToGame: () => void;  // 导航到游戏界面的回调（新游戏）
  onResumeGame: (savedState: SavedGameState) => void;  // 导航到游戏界面的回调（Resume）
  onNavigateToProfile: () => void;  // 导航到用户资料界面的回调
  onNavigateToAbout: () => void;  // 导航到关于界面的回调
  onNavigateToRank: () => void;  // 导航到排行榜界面的回调
  onNavigateToLogin: () => void; // 导航到登录界面的回调
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToGame,
  onResumeGame,
  onNavigateToProfile,
  onNavigateToAbout,
  onNavigateToRank,
  onNavigateToLogin,
}) => {
  const { isDarkMode, toggleDarkMode, backgroundColor, textColor } = useTheme();

  // 按钮点击处理函数
  const handleNewGame = () => {
    console.log('New Game button pressed');
    onNavigateToGame();  // 跳转到游戏界面
  };

  const handleResume = async () => {
    console.log('Resume button pressed');

    // 1. 获取当前登录用户
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      Alert.alert('Alert', 'Please log in firstly to resume your game');
      return;
    }

    // 2. 尝试加载该用户的游戏状态
    const savedState = await loadGameState(currentUser);

    if (!savedState) {
      Alert.alert('Alert', 'Resume unavailable\nPlease click "New Game" to start');
      return;
    }

    // 3. 恢复游戏
    console.log(`Recover user: [${currentUser}] 's game, score: ${savedState.score}`);
    onResumeGame(savedState);
  };

  const handleRank = async () => {
    console.log('Rank button pressed');

    // 1. 检查是否登录
    const currentUser = await getCurrentUser();
    const isGuest = await AsyncStorage.getItem('is_guest_mode');

    if (!currentUser || currentUser === 'guest' || isGuest === 'true') {
      Alert.alert(
        'Login Required',
        'Please log in to view rankings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: onNavigateToLogin },
        ]
      );
      return;
    }

    onNavigateToRank();
  };

  const handleAbout = () => {
    console.log('About button pressed');
    onNavigateToAbout();  // 跳转到关于界面
  };

  const handleUserIcon = () => {
    console.log('The user icon was clicked');
    onNavigateToProfile();
  };

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'right', 'bottom', 'left']}>
      {/* 顶部图标区域 - 横屏时绝对定位 */}
      <View style={isLandscape ? styles.topIconsContainerLandscape : styles.topIconsContainer}>
        {/* 左上角 - 暗色模式切换 */}
        <View style={styles.darkModeToggleContainer}>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        {/* 右上角 - 用户图标 */}
        <TouchableOpacity
          onPress={handleUserIcon}
          style={styles.iconButton}
        >
          <Ionicons name="person" size={28} color={isDarkMode ? textColor : COLORS.gray} />
        </TouchableOpacity>
      </View>

      {isLandscape ? (
        <View style={styles.landscapeContent}>
          {/* 左侧：标题 */}
          <View style={styles.landscapeLeft}>
            <View style={styles.titleContainerLandscape}>
              <View style={styles.tiltLeft}>
                <Text style={[styles.title2048, { color: isDarkMode ? textColor : COLORS.darkOrange }]}>2048</Text>
              </View>
              <View style={styles.tiltRight}>
                <Text style={[styles.titleTilt, { color: isDarkMode ? textColor : COLORS.orange }]}>Tilt</Text>
              </View>
            </View>
          </View>

          {/* 右侧：菜单 */}
          <View style={styles.landscapeRight}>
            <View style={styles.menuContainer}>
              <MenuButton
                title="New Game"
                onPress={handleNewGame}
                backgroundColor="#EDC22E"
                textColor="#F9F6F2"
              />
              <MenuButton
                title="Resume"
                onPress={handleResume}
                backgroundColor="#EDC850"
                textColor="#F9F6F2"
              />
              <MenuButton
                title="Rank"
                onPress={handleRank}
                backgroundColor="#F59563"
                textColor="#F9F6F2"
              />
              <MenuButton
                title="About"
                onPress={handleAbout}
                backgroundColor="#F2B179"
                textColor="#F9F6F2"
              />
            </View>
          </View>
        </View>
      ) : (
        <>
          {/* 标题区域 */}
          <View style={styles.titleContainer}>
            <View style={styles.tiltLeft}>
              <Text style={[styles.title2048, { color: isDarkMode ? textColor : COLORS.darkOrange }]}>2048</Text>
            </View>
            <View style={styles.tiltRight}>
              <Text style={[styles.titleTilt, { color: isDarkMode ? textColor : COLORS.orange }]}>Tilt</Text>
            </View>
          </View>

          {/* 菜单按钮区域 */}
          <View style={styles.menuContainer}>
            <MenuButton
              title="New Game"
              onPress={handleNewGame}
              backgroundColor="#EDC22E"
              textColor="#F9F6F2"
            />
            <MenuButton
              title="Resume"
              onPress={handleResume}
              backgroundColor="#EDC850"
              textColor="#F9F6F2"
            />
            <MenuButton
              title="Rank"
              onPress={handleRank}
              backgroundColor="#F59563"
              textColor="#F9F6F2"
            />
            <MenuButton
              title="About"
              onPress={handleAbout}
              backgroundColor="#F2B179"
              textColor="#F9F6F2"
            />
          </View>
        </>
      )}

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: isDarkMode ? textColor : COLORS.gray }]}>Version: 0.0.1</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // 顶部图标样式
  topIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  darkModeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topIconsContainerLandscape: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 标题区域样式
  titleContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  titleContainerLandscape: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  tiltLeft: {
    transform: [{ rotate: '-10deg' }],
  },
  tiltRight: {
    transform: [{ rotate: '10deg' }],
  },
  title2048: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  titleTilt: {
    fontSize: 66,
    fontWeight: 'bold',
  },

  // 菜单区域样式
  menuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  // 横屏布局样式
  landscapeContent: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landscapeRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 版本号区域样式
  versionContainer: {
    position: 'absolute',
    bottom: 20,
    right: 24,
  },
  versionText: {
    fontSize: 12,
  },
});
