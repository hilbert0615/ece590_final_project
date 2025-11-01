import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

/**
 * MenuButton 组件 - 主菜单的可复用按钮
 * @param title - 按钮显示的文字
 * @param onPress - 点击按钮时触发的函数
 */
interface MenuButtonProps {
  title: string;
  onPress: () => void;
}

export const MenuButton: React.FC<MenuButtonProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7} // 按下时的透明度效果
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 200,
    paddingVertical: 12,
    marginVertical: 8,
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 10,  // 圆角
    // 添加阴影效果 (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // 添加阴影效果 (Android)
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.blue,
    fontSize: 30,
    fontWeight: '600',
  },
});
