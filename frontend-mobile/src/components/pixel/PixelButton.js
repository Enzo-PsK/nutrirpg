import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { COLORS, PIXEL } from './theme';

const VARIANTS = {
  primary:     { bg: COLORS.RED,    text: COLORS.WHITE,  borderColor: COLORS.BLACK },
  secondary:   { bg: COLORS.PURPLE, text: COLORS.WHITE,  borderColor: COLORS.BLACK },
  blue:        { bg: COLORS.BLUE,   text: COLORS.WHITE,  borderColor: COLORS.BLACK },
  gold:        { bg: COLORS.GOLD,   text: COLORS.WHITE,  borderColor: COLORS.BLACK },
  success:     { bg: COLORS.GREEN,  text: COLORS.WHITE,  borderColor: COLORS.BLACK },
  destructive: { bg: '#dc2626',     text: COLORS.WHITE,  borderColor: COLORS.BLACK },
  outline:     { bg: COLORS.CARD,   text: COLORS.TEXT,   borderColor: COLORS.BLACK },
  ghost:       { bg: 'transparent', text: COLORS.MUTED,  borderColor: COLORS.MUTED },
  dark:        { bg: '#222222',     text: COLORS.WHITE,  borderColor: COLORS.BLACK },
};

const SIZE_MAP = {
  sm:  { pv: 7,  ph: 12, fontSize: 11 },
  md:  { pv: 12, ph: 18, fontSize: 13 },
  lg:  { pv: 16, ph: 24, fontSize: 16 },
};

/** Normaliza children para string quando o conteúdo é só texto (incl. multilinha em JSX). */
const toLabel = (children) => {
  if (children == null || children === false) return null;
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children).trim();
  }
  if (Array.isArray(children)) {
    const text = children
      .filter(c => typeof c === 'string' || typeof c === 'number')
      .join('')
      .trim();
    return text || null;
  }
  return null;
};

const PixelButton = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const sz = SIZE_MAP[size] || SIZE_MAP.md;
  const label = toLabel(children);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[fullWidth && s.fullWidth, style]}
    >
      {({ pressed }) => (
        <View
          style={[
            s.btn,
            {
              backgroundColor: v.bg,
              borderColor: v.borderColor,
              paddingVertical: sz.pv,
              paddingHorizontal: sz.ph,
              borderBottomWidth: pressed ? PIXEL.BORDER : PIXEL.BORDER + PIXEL.SHADOW,
              borderRightWidth:  pressed ? PIXEL.BORDER : PIXEL.BORDER + PIXEL.SHADOW,
              transform: pressed
                ? [{ translateX: PIXEL.SHADOW }, { translateY: PIXEL.SHADOW }]
                : [],
              opacity: disabled ? 0.45 : 1,
            },
          ]}
        >
          {label != null ? (
            <Text style={[s.text, { color: v.text, fontSize: sz.fontSize }, textStyle]}>
              {label}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
};

const s = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  btn: {
    borderTopWidth: PIXEL.BORDER,
    borderLeftWidth: PIXEL.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: PIXEL.FONT,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default PixelButton;
