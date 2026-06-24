import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, PIXEL } from './theme';

/**
 * PixelProgress — chunky 8-bit progress bar.
 *
 * Looks like the XP Bar / Health Bar / Mana Bar from 8bitcn.
 * Renders segmented "pixel" fill with vertical tick marks every 25%.
 *
 * Props:
 *   value        — current value
 *   max          — maximum value (default 100)
 *   color        — fill color (default COLORS.RED)
 *   label        — text above bar (optional)
 *   sublabel     — text below bar (optional)
 *   height       — bar height (default 18)
 *   showTicks    — render 25/50/75% ticks (default true)
 */
const PixelProgress = ({
  value = 0,
  max = 100,
  color = COLORS.RED,
  label,
  sublabel,
  height = 18,
  showTicks = true,
}) => {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  return (
    <View style={s.container}>
      {label ? (
        <View style={s.labelRow}>
          <Text style={s.label}>{label}</Text>
        </View>
      ) : null}

      {/* Track */}
      <View style={[s.track, { height }]}>
        {/* Fill */}
        <View style={[s.fill, { width: `${pct}%`, backgroundColor: color }]} />

        {/* Shine stripe on fill */}
        {pct > 5 && (
          <View style={[s.shine, { width: `${pct}%` }]} />
        )}

        {/* Tick marks */}
        {showTicks && [25, 50, 75].map(tick => (
          tick < pct
            ? <View key={tick} style={[s.tickDark, { left: `${tick}%` }]} />
            : <View key={tick} style={[s.tickLight, { left: `${tick}%` }]} />
        ))}
      </View>

      {sublabel ? (
        <Text style={s.sublabel}>{sublabel}</Text>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginVertical: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  track: {
    backgroundColor: COLORS.INPUT,
    borderWidth: PIXEL.BORDER,
    borderColor: COLORS.BLACK,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
  },
  shine: {
    position: 'absolute',
    top: 1,
    left: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tickDark: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tickLight: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sublabel: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default PixelProgress;
