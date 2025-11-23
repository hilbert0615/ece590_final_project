import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface AboutScreenProps {
  onBack: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'bottom', 'left']}>
      {/* Back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.darkOrange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={isLandscape ? styles.landscapeContent : styles.portraitContent}>
          {/* Developers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developers</Text>
            <View style={styles.divider} />
            <Text style={styles.developerName}>Hilbert Hu</Text>
            <Text style={styles.developerName}>Dhruva Barua</Text>
          </View>

          {/* Disclaimer section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <View style={styles.divider} />

            <Text style={styles.disclaimerTitle}>Game Disclaimer and Related Terms</Text>
            <Text style={styles.disclaimerSubtitle}>I. Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              This game disclaimer (hereinafter referred to as the "disclaimer") refers to a legal
              document used to clarify the limitations on the scope of liability of game developers,
              game publishers and game platforms. Regardless of the reason for the user to access
              or participate in the game, the user shall agree to the following statement and
              consciously abide by the relevant terms.
            </Text>

            <Text style={styles.disclaimerSubtitle}>1. Game risks are borne by the user:</Text>
            <Text style={styles.disclaimerText}>
              Before using the game, the user should fully understand the risks and uncertainties
              that may exist in the game, including but not limited to the security of virtual items,
              game characters, game accounts, attacks, mistakes, fraud and other issues suffered in
              the game. The participants of the game shall bear the above risks by themselves, and
              the game developers, publishers and platforms are not responsible for this.
            </Text>

            <Text style={styles.disclaimerSubtitle}>2. Security of virtual items and game accounts:</Text>
            <Text style={styles.disclaimerText}>
              Users shall maintain the security of their personal game accounts and virtual items
              by themselves, including but not limited to keeping the account and password confidential,
              and carefully trading virtual items. The game developer, publisher and platform shall
              not bear any responsibility for the loss or theft of game accounts and virtual items
              caused by the user's own reasons.
            </Text>

            <Text style={styles.disclaimerSubtitle}>3. Advertisements and links in the game:</Text>
            <Text style={styles.disclaimerText}>
              There may be advertisements and links in the game, and users shall bear the risks
              brought by clicking on advertisements and links. Any information, products or services
              obtained by users through advertisements and links are personal choices of users, and
              game developers, publishers and platforms do not assume any responsibility for this.
            </Text>
          </View>

          {/* Version info */}
          <View style={styles.versionSection}>
            <Text style={styles.versionText}>2048 Tilt</Text>
            <Text style={styles.versionText}>Version 0.0.1</Text>
            <Text style={styles.versionText}>© 2025 All Rights Reserved</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightYellow,
  },

  // 头部样式
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkOrange,
  },
  placeholder: {
    width: 40,
  },

  // 滚动视图
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  portraitContent: {
    width: '100%',
  },
  landscapeContent: {
    width: '80%',
    maxWidth: 800,
    alignSelf: 'center',
  },

  // 区块样式
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: '#000000',
    marginBottom: 20,
  },

  // 开发者信息
  developerName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginVertical: 8,
    textAlign: 'center',
  },

  // 免责声明样式
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  disclaimerSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    textAlign: 'justify',
  },

  // 版本信息
  versionSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.gray,
    marginVertical: 2,
  },
});
