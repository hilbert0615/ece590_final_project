import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { getTileStyle } from '../constants/tileColors';

/**
 * Tile 组件 - 单个方块
 * @param value - 方块的数值（0 表示空方块）
 */
interface TileProps {
  value: number;
}

export const Tile: React.FC<TileProps> = ({ value }) => {
  const tileStyle = getTileStyle(value);

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: tileStyle.backgroundColor }
      ]}
    >
      {value !== 0 && (
        <Text
          style={[
            styles.tileText,
            {
              color: tileStyle.textColor,
              fontSize: tileStyle.fontSize,
            }
          ]}
        >
          {value}
        </Text>
      )}
    </View>
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
  },
});
