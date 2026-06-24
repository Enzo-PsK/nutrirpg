// PixelPicker — searchable product/item picker modal for 8-bit UI
import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, TextInput, FlatList,
  Pressable, StyleSheet,
} from 'react-native';
import { COLORS, PIXEL } from './theme';

/**
 * PixelPicker
 *
 * Props:
 *   items        — array of { id, label, sublabel? } to pick from
 *   value        — currently selected item id
 *   onSelect     — (item) => void — called with the full item object
 *   placeholder  — text shown when nothing is selected
 *   label        — field label shown above the picker
 *   style        — outer wrapper style
 */
const PixelPicker = ({ items = [], value, onSelect, placeholder = 'Selecionar...', label, style }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = items.find(i => i.id === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(i =>
      i.label.toLowerCase().includes(q) ||
      (i.sublabel && i.sublabel.toLowerCase().includes(q))
    );
  }, [items, query]);

  const handleSelect = (item) => {
    onSelect(item);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={[s.wrapper, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}

      {/* Field trigger */}
      <Pressable onPress={() => setOpen(true)}>
        {({ pressed }) => (
          <View style={[
            s.field,
            {
              borderBottomWidth: pressed ? 2 : 6,
              borderRightWidth:  pressed ? 2 : 6,
              transform: pressed ? [{ translateX: 4 }, { translateY: 4 }] : [],
            },
          ]}>
            <Text style={[s.fieldText, !selected && s.placeholder]} numberOfLines={1}>
              {selected ? selected.label : placeholder}
            </Text>
            {selected?.sublabel ? (
              <Text style={s.fieldSub}>{selected.sublabel}</Text>
            ) : null}
            <Text style={s.chevron}>▼</Text>
          </View>
        )}
      </Pressable>

      {/* Search modal */}
      <Modal visible={open} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={() => { setOpen(false); setQuery(''); }}>
          <Pressable style={s.modal} onPress={e => e.stopPropagation()}>
            {/* Search input */}
            <View style={s.searchRow}>
              <TextInput
                style={s.search}
                placeholder="Pesquisar ingrediente..."
                placeholderTextColor={COLORS.MUTED}
                value={query}
                onChangeText={setQuery}
                autoFocus
                color={COLORS.TEXT}
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={i => i.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => {
                const active = item.id === value;
                return (
                  <Pressable onPress={() => handleSelect(item)}>
                    {({ pressed }) => (
                      <View style={[s.option, active && s.optionActive, pressed && s.optionPressed]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.optionLabel, active && s.optionLabelActive]}>
                            {item.label}
                          </Text>
                          {item.sublabel ? (
                            <Text style={s.optionSub}>{item.sublabel}</Text>
                          ) : null}
                        </View>
                        {active && <Text style={s.checkmark}>✓</Text>}
                      </View>
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={s.empty}>Sem resultados para "{query}"</Text>
              }
            />

            <Pressable onPress={() => { setOpen(false); setQuery(''); }}>
              <Text style={s.cancel}>CANCELAR</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

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

  // Trigger field
  field: {
    backgroundColor: COLORS.INPUT,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldText: {
    fontFamily: PIXEL.FONT,
    fontSize: 14,
    color: COLORS.TEXT,
    flex: 1,
  },
  fieldSub: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    marginRight: 8,
  },
  placeholder: { color: COLORS.MUTED },
  chevron: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    marginLeft: 6,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.BG,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    borderBottomWidth: 6,
    borderRightWidth: 6,
  },
  searchRow: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BLACK,
    backgroundColor: COLORS.CARD,
  },
  search: {
    fontFamily: PIXEL.FONT,
    fontSize: 14,
    color: COLORS.TEXT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.CARD,
  },

  // Options
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.INPUT,
  },
  optionActive: { backgroundColor: COLORS.CARD },
  optionPressed: { backgroundColor: COLORS.INPUT },
  optionLabel: {
    fontFamily: PIXEL.FONT,
    fontSize: 14,
    color: COLORS.TEXT,
  },
  optionLabelActive: { color: COLORS.RED, letterSpacing: 0.5 },
  optionSub: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    marginTop: 1,
  },
  checkmark: {
    fontFamily: PIXEL.FONT,
    fontSize: 14,
    color: COLORS.RED,
    marginLeft: 8,
  },

  empty: {
    fontFamily: PIXEL.FONT,
    fontSize: 12,
    color: COLORS.MUTED,
    textAlign: 'center',
    padding: 24,
  },
  cancel: {
    fontFamily: PIXEL.FONT,
    fontSize: 12,
    color: COLORS.MUTED,
    textAlign: 'center',
    paddingVertical: 14,
    borderTopWidth: 2,
    borderTopColor: COLORS.INPUT,
    letterSpacing: 1,
  },
});

export default PixelPicker;
