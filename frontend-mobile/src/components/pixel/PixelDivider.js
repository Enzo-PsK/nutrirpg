import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, PIXEL } from './theme';

/**
 * PixelDivider — retro-styled horizontal separator.
 * Renders a dashed line of "─ ─ ─" characters for the 8-bit look.
 *
 * Props:
 *   label   — optional centered label
 *   color   — line color (default COLORS.MUTED)
 *   style   — wrapper styles
 */
const PixelDivider = ({ label, color = COLORS.MUTED, style }) => {
  if (label) {
    return (
      <View style={[s.row, style]}>
        <View style={[s.line, { backgroundColor: color }]} />
        <Text style={[s.label, { color }]}>{label}</Text>
        <View style={[s.line, { backgroundColor: color }]} />
      </View>
    );
  }
  return <View style={[s.simpleLine, { backgroundColor: color }, style]} />;
};

const s = StyleSheet.create({
  simpleLine: { height: 2, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  line: { flex: 1, height: 2 },
  label: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    letterSpacing: 2,
    marginHorizontal: 8,
    textTransform: 'uppercase',
  },
});

export default PixelDivider;
