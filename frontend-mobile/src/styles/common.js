/**
 * NutriRPG Mobile — Shared StyleSheet patterns
 *
 * Import what you need in each screen:
 *   import { layout, card, form, text, badge } from '../styles/common';
 *
 * These complement theme.js (colours + font) and avoid repeating
 * the same StyleSheet definitions across multiple screens.
 */
import { StyleSheet } from 'react-native';
import { COLORS, PIXEL } from '../components/pixel';

// ── Layout ────────────────────────────────────────────────────────────────────
export const layout = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.BG },
  root:    { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingTop: 20, paddingBottom: 32 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  row:     { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fill:    { flex: 1 },
});

// ── Cards ─────────────────────────────────────────────────────────────────────
export const card = StyleSheet.create({
  base: {
    backgroundColor: COLORS.CARD,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    padding: 16,
    marginBottom: 14,
  },
  accentRed:    { borderLeftWidth: 4, borderLeftColor: COLORS.RED    },
  accentBlue:   { borderLeftWidth: 4, borderLeftColor: COLORS.BLUE   },
  accentGreen:  { borderLeftWidth: 4, borderLeftColor: COLORS.GREEN  },
  accentGold:   { borderLeftWidth: 4, borderLeftColor: COLORS.GOLD   },
  accentPurple: { borderLeftWidth: 4, borderLeftColor: COLORS.PURPLE },
});

// ── Typography ────────────────────────────────────────────────────────────────
export const text = StyleSheet.create({
  title: {
    fontFamily: PIXEL.FONT,
    fontSize: 18,
    color: COLORS.TEXT,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontFamily: PIXEL.FONT,
    fontSize: 13,
    color: COLORS.TEXT,
    letterSpacing: 2,
    marginBottom: 12,
  },
  label: {
    fontFamily: PIXEL.FONT,
    fontSize: 9,
    color: COLORS.MUTED,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  body: {
    fontFamily: PIXEL.FONT,
    fontSize: 13,
    color: COLORS.TEXT,
    lineHeight: 20,
  },
  muted: {
    fontFamily: PIXEL.FONT,
    fontSize: 12,
    color: COLORS.MUTED,
  },
  error: {
    fontFamily: PIXEL.FONT,
    fontSize: 12,
    color: COLORS.RED,
    marginTop: 6,
  },
  loading: {
    fontFamily: PIXEL.FONT,
    fontSize: 13,
    color: COLORS.MUTED,
    letterSpacing: 1,
    marginBottom: 16,
  },
});

// ── Forms ─────────────────────────────────────────────────────────────────────
export const form = StyleSheet.create({
  inputWrapper: { marginBottom: 14 },
  label: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.INPUT,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    padding: 10,
    fontFamily: PIXEL.FONT,
    fontSize: 14,
    color: COLORS.TEXT,
  },
});

// ── Badges ────────────────────────────────────────────────────────────────────
export const badge = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.BLACK,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
  },
  red:    { backgroundColor: COLORS.RED    },
  gold:   { backgroundColor: COLORS.GOLD   },
  blue:   { backgroundColor: COLORS.BLUE   },
  green:  { backgroundColor: COLORS.GREEN  },
  purple: { backgroundColor: COLORS.PURPLE },
});

// ── Accordion (used in Home, Recipes) ─────────────────────────────────────────
export const accordion = StyleSheet.create({
  wrapper: {
    borderLeftWidth: 4,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    marginBottom: 16,
    backgroundColor: COLORS.CARD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  title: {
    fontFamily: PIXEL.FONT,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  chevron: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.WHITE,
  },
});

// ── Empty state ───────────────────────────────────────────────────────────────
export const empty = StyleSheet.create({
  text: {
    fontFamily: PIXEL.FONT,
    fontSize: 12,
    color: COLORS.MUTED,
    fontStyle: 'italic',
    paddingVertical: 8,
    lineHeight: 18,
  },
});
