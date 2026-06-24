import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, PIXEL } from './theme';

/**
 * PixelCard — 8-bit styled panel with black pixel shadow.
 *
 * Props:
 *   accentColor  — colors the left accent bar (e.g. RPG.XP, COLORS.BLUE)
 *   accentTop    — colors the top accent bar instead of the left bar
 *   noPadding    — skip internal padding
 *   style        — extra styles for outer wrapper
 *   innerStyle   — extra styles for the card surface
 */
const PixelCard = ({
  children,
  style,
  innerStyle,
  accentColor,
  accentTop = false,
  noPadding = false,
}) => (
  <View style={[s.wrapper, style]}>
    <View
      style={[
        s.card,
        accentColor && !accentTop && { borderLeftColor: accentColor, borderLeftWidth: 4 },
        accentColor && accentTop  && { borderTopColor: accentColor,  borderTopWidth: 4  },
        noPadding && { padding: 0 },
        innerStyle,
      ]}
    >
      {children}
    </View>
  </View>
);

const s = StyleSheet.create({
  wrapper: {
    marginBottom: PIXEL.SHADOW + 2,
    marginRight: PIXEL.SHADOW + 2,
  },
  card: {
    backgroundColor: COLORS.CARD,
    borderWidth: PIXEL.BORDER,
    borderColor: COLORS.BLACK,
    borderBottomWidth: PIXEL.BORDER + PIXEL.SHADOW,
    borderRightWidth:  PIXEL.BORDER + PIXEL.SHADOW,
    padding: 16,
  },
});

export default PixelCard;
