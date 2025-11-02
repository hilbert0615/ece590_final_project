import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { signIn, signUp } from '../services/authService';

/**
 * LoginScreen - 登录/注册界面
 */

interface LoginScreenProps {
  onLoginSuccess: () => void;  // 登录成功的回调
  onGuestMode: () => void;      // 访客模式的回调
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGuestMode,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);  // 是否为注册模式
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');  // 注册时需要
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 处理登录
   */
  const handleSignIn = async () => {
    // 验证输入
    if (!email || !password) {
      Alert.alert('Alert', 'Please enter your email address and password.');
      return;
    }

    setIsLoading(true);

    const { user, profile, error } = await signIn(email, password);

    setIsLoading(false);

    if (error) {
      Alert.alert('Login failed', error);
      return;
    }

    console.log('Login successful:', profile?.username);
    onLoginSuccess();
  };

  /**
   * 处理注册
   */
  const handleSignUp = async () => {
    // 验证输入
    if (!email || !password || !username) {
      Alert.alert('Alert', 'Please fill in all fields.');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Alert', 'Usernames must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Alert', 'Passwords must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    const { user, profile, error } = await signUp(email, password, username);

    setIsLoading(false);

    if (error) {
      Alert.alert('Register failed', error);
      return;
    }

    Alert.alert(
      'Register successful',
      `Welcome ${username}!`,
      [{ text: 'Start game', onPress: onLoginSuccess }]
    );
  };

  /**
   * 切换登录/注册模式
   */
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    // 清空输入
    setEmail('');
    setPassword('');
    setUsername('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'bottom', 'left']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 标题 */}
          <View style={styles.titleContainer}>
            {/* 使用包裹容器来做旋转，避免 Text 初次渲染偶发不生效 */}
            <View style={styles.tiltLeft}>
              <Text style={styles.title2048}>2048</Text>
            </View>
            <View style={styles.tiltRight}>
              <Text style={styles.titleTilt}>Tilt</Text>
            </View>
          </View>

          {/* 表单 */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isRegisterMode ? 'Create account' : 'Login'}
            </Text>

            {/* 注册模式下显示用户名输入 */}
            {isRegisterMode && (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={COLORS.gray}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
              />
            )}

            {/* 邮箱输入 */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            {/* 密码输入 */}
            <TextInput
              style={styles.input}
              placeholder={isRegisterMode ? "Password" : "Password"}
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            {/* 注册模式下显示要求提示 */}
            {isRegisterMode && (
              <View style={styles.hintsContainer}>
                <View style={styles.passwordHintContainer}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.gray} />
                  <Text style={styles.passwordHint}>
                    Username must be at least 3 characters
                  </Text>
                </View>
                <View style={styles.passwordHintContainer}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.gray} />
                  <Text style={styles.passwordHint}>
                    Password must be at least 6 characters
                  </Text>
                </View>
              </View>
            )}

            {/* 登录/注册按钮 */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={isRegisterMode ? handleSignUp : handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegisterMode ? 'Register' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            {/* 切换模式按钮 */}
            <TouchableOpacity
              style={styles.switchButton}
              onPress={toggleMode}
              disabled={isLoading}
            >
              <Text style={styles.switchText}>
                {isRegisterMode ? 'Already have an account? Login' : 'No account? Register'}
              </Text>
            </TouchableOpacity>

            {/* 访客模式按钮 */}
            <TouchableOpacity
              style={[styles.button, styles.guestButton]}
              onPress={onGuestMode}
              disabled={isLoading}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightYellow,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // 标题样式
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
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

  // 表单样式
  formContainer: {
    width: '100%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#776E65',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#776E65',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#BBADA0',
  },
  hintsContainer: {
    marginBottom: 16,
  },
  passwordHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  passwordHint: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 6,
  },

  // 按钮样式
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.orange,
  },
  guestButton: {
    backgroundColor: '#BBADA0',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 切换模式按钮
  switchButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  switchText: {
    fontSize: 14,
    color: COLORS.gray,
    textDecorationLine: 'underline',
  },
});
