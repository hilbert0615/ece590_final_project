import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { MenuButton } from '../components/MenuButton';
 import { Ionicons } from '@expo/vector-icons';

/**
 * HomeScreen - 游戏主界面
 * 包含标题、菜单按钮和顶部图标
 */
export const HomeScreen: React.FC = () => {

  // 按钮点击处理函数
  const handleNewGame = () => {
    console.log('New Game 按钮被点击');
    // TODO: 后续实现跳转到游戏界面
  };

  const handleResume = () => {
    console.log('Resume 按钮被点击');
    // TODO: 后续实现恢复游戏功能
  };

  const handleRecord = () => {
    console.log('Record 按钮被点击');
    // TODO: 后续实现查看记录功能
  };

  const handleAbout = () => {
    console.log('About 按钮被点击');
    // TODO: 后续实现关于页面
  };

  const handleQuit = () => {
    console.log('Quit 按钮被点击');
    // TODO: 后续实现退出确认对话框
  };

  const handleLocationIcon = () => {
    console.log('位置图标被点击');
    // TODO: 后续实现位置权限请求
  };

  const handleUserIcon = () => {
    console.log('用户图标被点击');
    // TODO: 后续实现登录/用户资料功能
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
        {/* "2048" 标题，向左倾斜 10 度 */}
        <Text style={[styles.title2048, { transform: [{ rotate: '-10deg' }] }]}>
          2048
        </Text>
        {/* "Tilt" 标题，向右倾斜 10 度 */}
        <Text style={[styles.titleTilt, { transform: [{ rotate: '10deg' }] }]}>
          Tilt
        </Text>
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
