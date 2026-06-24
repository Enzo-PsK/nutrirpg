import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, PIXEL } from './theme';

const PRESETS = {
  default:     { bg: COLORS.CARD_ALT, text: COLORS.TEXT,   border: COLORS.BLACK },
  primary:     { bg: COLORS.RED,      text: COLORS.WHITE,  border: COLORS.BLACK },
  secondary:   { bg: COLORS.PURPLE,   text: COLORS.WHITE,  border: COLORS.BLACK },
  success:     { bg: '#dcfce7',       text: '#16a34a',     border: COLORS.BLACK },
  warning:     { bg: '#fef9c3',       text: '#92400e',     border: COLORS.BLACK },
  danger:      { bg: '#fee2e2',       text: '#991b1b',     border: COLORS.BLACK },
  info:        { bg: '#e0f2fe',       text: '#0284c7',     border: COLORS.BLACK },
  gold:        { bg: '#fef3c7',       text: '#d97706',     border: COLORS.BLACK },
  level:       { bg: COLORS.RED,      text: COLORS.WHITE,  border: COLORS.BLACK },
  xp:          { bg: '#ede9fe',       text: '#7c3aed',     border: COLORS.BLACK },
};

/**
 * PixelBadge — compact 8-bit styled label/chip.
 *
 * Props:
 *   variant  — one of the preset keys above
 *   style    — outer wrapper styles
 *   textStyle — text styles
 */
const PixelBadge = ({ children, variant = 'default', style, textStyle }) => {
  const v = PRESETS[variant] || PRESETS.default;
  return (
    <View style={[s.badge, { backgroundColor: v.bg, borderColor: v.border }, style]}>
      <Text style={[s.text, { color: v.text }, textStyle]}>{children}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  badge: {
    borderWidth: PIXEL.BORDER,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: PIXEL.FONT,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

export default PixelBadge;
