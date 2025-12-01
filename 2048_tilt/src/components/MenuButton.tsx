import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

/**
 * MenuButton 组件 - 主菜单的可复用按钮
 * @param title - 按钮显示的文字
 * @param onPress - 点击按钮时触发的函数
 * @param backgroundColor - 背景颜色
 * @param textColor - 文字颜色
 */
interface MenuButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  title,
  onPress,
  backgroundColor = '#EDC22E',
  textColor = '#F9F6F2',
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor } as ViewStyle]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 220,
    height: 65,
    marginVertical: 10,
    borderRadius: 8,
    // 添加阴影效果 (iOS) 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // 添加阴影效果 (Android)
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
