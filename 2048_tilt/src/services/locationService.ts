/**
 * 位置服务 - 处理 GPS 定位和反向地理编码
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
    const Location = require('expo-location');

    // 1. 请求前台位置权限
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.log('位置权限被拒绝');
      return { error: 'Location permission denied' };
    }

    // 2. 获取当前位置（添加超时处理）
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // 平衡精度和速度
      timeInterval: 5000, // 5秒超时
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
    // 静默处理位置错误，不影响主功能
    console.log('Location services are unavailable (possibly due to using an emulator or weak GPS signal), and location information will not be included.');

    // 检查是否是模块未安装的错误
    if (error.message?.includes('Cannot find module')) {
      return { error: 'Please install expo-location package' };
    }

    // 其他位置错误（模拟器、信号弱等）返回友好提示
    return { error: 'Location unavailable' };
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

      console.log(`Reverse geocoding results: ${city}, ${country}`);

      return {
        city: city || undefined,
        country: country || undefined,
      };
    }

    return {};
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
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
    console.error('Failed to check location permissions.:', error);
    return false;
  }
};
