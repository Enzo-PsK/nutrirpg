import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, PIXEL } from './theme';

const PRESETS = {
  warning: { bg: '#fef9c3', accent: '#d97706', text: '#92400e' },
  danger:  { bg: '#fee2e2', accent: COLORS.RED, text: '#991b1b' },
  info:    { bg: '#e0f2fe', accent: COLORS.BLUE, text: '#0c4a6e' },
  success: { bg: '#dcfce7', accent: COLORS.GREEN, text: '#14532d' },
};

/**
 * PixelAlert — 8-bit styled alert banner with left accent border.
 *
 * Props:
 *   variant  — 'warning' | 'danger' | 'info' | 'success'
 *   style    — extra wrapper styles
 */
const PixelAlert = ({ children, variant = 'warning', style }) => {
  const v = PRESETS[variant] || PRESETS.warning;
  return (
    <View
      style={[
        s.alert,
        {
          backgroundColor: v.bg,
          borderColor: COLORS.BLACK,
          borderLeftColor: v.accent,
        },
        style,
      ]}
    >
      <Text style={[s.text, { color: v.text }]}>{children}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  alert: {
    borderWidth: PIXEL.BORDER,
    borderLeftWidth: 5,
    padding: 12,
    marginBottom: 12,
    borderBottomWidth: PIXEL.BORDER + 2,
    borderRightWidth: PIXEL.BORDER + 2,
  },
  text: {
    fontFamily: PIXEL.FONT,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default PixelAlert;
