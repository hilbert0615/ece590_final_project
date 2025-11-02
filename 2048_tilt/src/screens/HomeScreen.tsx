import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { MenuButton } from '../components/MenuButton';
import { Ionicons } from '@expo/vector-icons';
import {
  getCurrentUser,
  loadGameState,
  SavedGameState,
} from '../utils/storageUtils';

/**
 * HomeScreen - 游戏主界面
 * 包含标题、菜单按钮和顶部图标
 */
interface HomeScreenProps {
  onNavigateToGame: () => void;  // 导航到游戏界面的回调（新游戏）
  onResumeGame: (savedState: SavedGameState) => void;  // 导航到游戏界面的回调（Resume）
  onNavigateToProfile: () => void;  // 导航到用户资料界面的回调
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToGame,
  onResumeGame,
  onNavigateToProfile,
}) => {

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

  const handleRecord = () => {
    console.log('Record button pressed');
    // TODO: 后续实现查看记录功能
  };

  const handleAbout = () => {
    console.log('About button pressed');
    // TODO: 后续实现关于页面
  };

  const handleQuit = () => {
    console.log('Quit button pressed');

    Alert.alert(
      'Quit Game',
      'Quit Game?',
      [
        {
          text: 'Canel',
          style: 'cancel',
        },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'android') {
              // Android 可以直接退出应用
              BackHandler.exitApp();
            } else if (Platform.OS === 'ios') {
              // iOS 不允许程序主动退出，显示提示
              Alert.alert(
                'Alert',
                'iOS does not support manually exiting an app.\nPlease press the Home button to return to the home screen.',
                [{ text: 'Got it' }]
              );
            } else {
              // Web 或其他平台
              console.log('The current platform does not support the exit operation.');
            }
          },
        },
      ]
    );
  };

  const handleLocationIcon = () => {
    console.log('位置图标被点击');
    // TODO: 后续实现位置权限请求
  };

  const handleUserIcon = () => {
    console.log('用户图标被点击');
    onNavigateToProfile();  // 导航到用户资料界面
  };

  return (
  <SafeAreaView style={styles.container} edges={['top', 'right', 'bottom', 'left']}>
      {/* 顶部图标区域 */}
      <View style={styles.topIconsContainer}>
        {/* 左上角 - 位置图标 */}
        <TouchableOpacity
          onPress={handleLocationIcon}
          style={styles.iconButton}
        >
          <Ionicons name="location" size={28} color={COLORS.gray} />
        </TouchableOpacity>

        {/* 右上角 - 用户图标 */}
        <TouchableOpacity
          onPress={handleUserIcon}
          style={styles.iconButton}
        >
          <Ionicons name="person" size={28} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      {/* 标题区域 */}
      <View style={styles.titleContainer}>
        {/* 用包裹容器应用旋转，避免 Text 初次渲染偶发不生效 */}
        <View style={styles.tiltLeft}
        >
          <Text style={styles.title2048}>2048</Text>
        </View>
        <View style={styles.tiltRight}
        >
          <Text style={styles.titleTilt}>Tilt</Text>
        </View>
      </View>

      {/* 菜单按钮区域 */}
      <View style={styles.menuContainer}>
        <MenuButton title="New Game" onPress={handleNewGame} />
        <MenuButton title="Resume" onPress={handleResume} />
        <MenuButton title="Record" onPress={handleRecord} />
        <MenuButton title="About" onPress={handleAbout} />
        <MenuButton title="Quit" onPress={handleQuit} />
      </View>

      {/* 底部版本号 */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version: 0.0.1</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightYellow,
  },

  // 顶部图标样式
  topIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
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

  tiltLeft: {
    transform: [{ rotate: '-10deg' }],
  },
  tiltRight: {
    transform: [{ rotate: '10deg' }],
  },
  title2048: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.darkOrange,
    marginBottom: 10,
  },
  titleTilt: {
    fontSize: 66,
    fontWeight: 'bold',
    color: COLORS.orange,
  },

  // 菜单区域样式
  menuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  // 版本号区域样式
  versionContainer: {
    position: 'absolute',
    bottom: 20,
    right: 24,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.gray,
  },
});
