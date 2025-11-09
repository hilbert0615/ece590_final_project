import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { getTileStyle } from '../constants/tileColors';

/**
 * Tile 组件 - 单个方块（带动画效果）
 * @param value - 方块的数值（0 表示空方块）
 * @param isNew - 是否是新生成的方块（用于播放出现动画）
 */
interface TileProps {
  value: number;
  isNew?: boolean;
}

export const Tile: React.FC<TileProps> = ({ value, isNew = false }) => {
  const tileStyle = getTileStyle(value);

  // 动画值：缩放效果
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // 动画值：透明度效果
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // 当方块是新生成的时候，播放出现动画
  useEffect(() => {
    if (isNew && value !== 0) {
      // 初始状态：缩小并透明
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      // 动画：放大并显示
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value, isNew]);

  // 当方块值改变时（合并），播放弹跳动画
  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current !== 0 && value !== prevValue.current && value !== 0) {
      // 播放弹跳动画
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevValue.current = value;
  }, [value]);

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          backgroundColor: tileStyle.backgroundColor,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      {value !== 0 && (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={[
            styles.tileText,
            {
              color: tileStyle.textColor,
              fontSize: tileStyle.fontSize,
              // 仅在 Android 设置 lineHeight，避免 iOS 视觉偏上
              lineHeight: Platform.OS === 'android' ? Math.round(tileStyle.fontSize * 1.15) : undefined,
              // iOS 轻微下移 1px，抵消系统字体基线的偏上观感
              paddingTop: Platform.OS === 'ios' ? 1 : 0,
            }
          ]}
        >
          {value}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: 75,   // 方块宽度
    height: 75,  // 方块高度
    margin: 4,   // 方块之间的间距
    borderRadius: 8,  // 圆角
    justifyContent: 'center',
    alignItems: 'center',
    // 阴影效果 (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // 阴影效果 (Android)
    elevation: 3,
  },
  tileText: {
    fontWeight: 'bold',
    textAlign: 'center',      // 水平居中
    textAlignVertical: 'center',  // 垂直居中 (Android)
    includeFontPadding: false,    // 移除 Android 字体内边距，确保真正居中
  },
});
