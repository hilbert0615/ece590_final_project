/**
 * 位置服务 - 处理 GPS 定位和反向地理编码
 *
 * 注意：需要手动安装依赖
 * npx expo install expo-location
 */

// 位置信息接口
export interface LocationInfo {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

/**
 * 请求位置权限并获取当前位置
 * @returns 位置信息或错误
 */
export const getCurrentLocation = async (): Promise<{
  location?: LocationInfo;
  error?: string;
}> => {
  try {
    // 动态导入 expo-location（需要先安装）
    const Location = require('expo-location');

    // 1. 请求前台位置权限
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return { error: 'Location permission denied' };
    }

    // 2. 获取当前位置
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // 平衡精度和速度
    });

    const { latitude, longitude } = location.coords;
    console.log(`获取到位置: ${latitude}, ${longitude}`);

    // 3. 反向地理编码（GPS -> 城市名）
    const geocode = await reverseGeocode(latitude, longitude);

    return {
      location: {
        latitude,
        longitude,
        city: geocode.city,
        country: geocode.country,
      },
    };
  } catch (error: any) {
    console.error('获取位置失败:', error);

    // 检查是否是模块未安装的错误
    if (error.message?.includes('Cannot find module')) {
      return { error: 'Please install expo-location package' };
    }

    return { error: 'Failed to get location' };
  }
};

/**
 * 反向地理编码 - 将经纬度转换为城市名
 * @param latitude - 纬度
 * @param longitude - 经度
 * @returns 城市和国家信息
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<{ city?: string; country?: string }> => {
  try {
    const Location = require('expo-location');

    // 使用 Expo Location 的反向地理编码
    const geocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (geocode && geocode.length > 0) {
      const place = geocode[0];

      // 提取城市和国家信息
      const city = place.city || place.subregion || place.region;
      const country = place.country || place.isoCountryCode;

      console.log(`反向地理编码结果: ${city}, ${country}`);

      return {
        city: city || undefined,
        country: country || undefined,
      };
    }

    return {};
  } catch (error) {
    console.error('反向地理编码失败:', error);
    return {};
  }
};

/**
 * 检查位置权限状态
 * @returns 是否已授权
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const Location = require('expo-location');
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('检查位置权限失败:', error);
    return false;
  }
};
