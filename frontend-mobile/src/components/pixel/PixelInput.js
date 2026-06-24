import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { COLORS, PIXEL } from './theme';

const PixelInput = ({ label, style, containerStyle, ...props }) => (
  <View style={[s.wrapper, containerStyle]}>
    {label ? <Text style={s.label}>{label}</Text> : null}
    <View style={s.inputWrapper}>
      <TextInput
        style={[s.input, style]}
        placeholderTextColor={COLORS.MUTED}
        selectionColor={COLORS.RED}
        {...props}
        color={COLORS.TEXT}
      />
    </View>
  </View>
);

const s = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  inputWrapper: {
    borderWidth: PIXEL.BORDER,
    borderColor: COLORS.BLACK,
    borderBottomWidth: PIXEL.BORDER + PIXEL.SHADOW,
    borderRightWidth: PIXEL.BORDER + PIXEL.SHADOW,
  },
  input: {
    backgroundColor: COLORS.INPUT,
    color: COLORS.TEXT,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: PIXEL.FONT,
    fontSize: 14,
  },
});

export default PixelInput;
