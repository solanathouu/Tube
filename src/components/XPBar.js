import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme, XP_LEVELS } from '../theme/theme';
import { calculateLevel, calculateXPProgress } from '../utils/helpers';

const XPBar = ({ currentXP }) => {
  const level = calculateLevel(currentXP);
  const progress = calculateXPProgress(currentXP);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.levelText}>
          {level.badge} {level.name}
        </Text>
        <Text style={styles.xpText}>
          {currentXP} / {level.maxXP === Infinity ? '∞' : level.maxXP} XP
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: widthInterpolated, backgroundColor: level.color },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  xpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.round,
  },
});

export default XPBar;
