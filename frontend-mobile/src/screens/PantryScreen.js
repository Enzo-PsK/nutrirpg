// src/screens/PantryScreen.js — NutriRPG 8-bit Edition
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Alert, Modal, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PixelButton, PixelCard, PixelInput, PixelBadge, PixelAlert, PixelDivider, PixelPicker,
  COLORS, PIXEL,
} from '../components/pixel';
import API_URL from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import { useRegisterRefresh, usePullToRefresh } from '../context/AppRefreshContext';

const EMPTY_ITEM = { product_id: null, name: '', quantity: '', unit: 'g', category: '' };

function quantityStep(unit) {
  switch (unit) {
    case 'un': return 1;
    case 'ml': return 100;
    case 'kg': return 1;
    case 'g':  return 100;
    default:   return 1;
  }
}

function formatQuantity(qty) {
  return Number.isInteger(qty) ? String(qty) : String(parseFloat(qty.toFixed(2)));
}

function lowAlertNames(items) {
  return items.filter((i) => i.quantity <= i.low_stock_threshold).map((i) => i.name);
}

function sortByName(list) {
  return [...list].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'pt', { sensitivity: 'base' }),
  );
}

const PantryScreen = ({ user }) => {
  const [items, setItems]         = useState([]);
  const [lowAlerts, setLowAlerts] = useState([]);
  const [products, setProducts]   = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem]     = useState(EMPTY_ITEM);
  const { refreshing, onRefresh, refreshKeys } = usePullToRefresh();
  const adjustQueuesRef = useRef(new Map());
  const recipeRefreshTimerRef = useRef(null);

  const authHeaders = {
    Authorization: `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/products`, { headers: authHeaders });
      const data = await res.json();
      setProducts(sortByName(Array.isArray(data) ? data : []));
    } catch (e) { console.error(e); }
  }, [user.token]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/pantry`, { headers: authHeaders });
      const data = await res.json();
      setItems(sortByName(data.items || []));
      setLowAlerts(data.low_stock_alerts || []);
    } catch (e) { console.error(e); }
  }, [user.token]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchItems(), fetchProducts()]);
  }, [fetchItems, fetchProducts]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRegisterRefresh('pantry', fetchAll);

  useEffect(() => () => {
    if (recipeRefreshTimerRef.current) clearTimeout(recipeRefreshTimerRef.current);
  }, []);

  const scheduleRecipeRefresh = useCallback(() => {
    if (recipeRefreshTimerRef.current) clearTimeout(recipeRefreshTimerRef.current);
    recipeRefreshTimerRef.current = setTimeout(() => {
      refreshKeys('recipes');
    }, 600);
  }, [refreshKeys]);

  const applyItemUpdate = useCallback((itemId, patch) => {
    setItems((prev) => {
      const next = sortByName(prev.map((i) => (
        i.id === itemId ? { ...i, ...patch } : i
      )));
      setLowAlerts(lowAlertNames(next));
      return next;
    });
  }, []);

  const addItem = async () => {
    if (!newItem.name || !newItem.quantity) {
      Alert.alert('[ ERRO ]', 'Seleciona um ingrediente e indica a quantidade');
      return;
    }
    try {
      await apiFetch(`${API_URL}/api/pantry`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: newItem.name,
          quantity: parseFloat(newItem.quantity),
          unit: newItem.unit,
          category: newItem.category,
          product_id: newItem.product_id || undefined,
        }),
      });
      setModalVisible(false);
      setNewItem(EMPTY_ITEM);
      await refreshKeys('pantry', 'recipes');
    } catch (e) { console.error(e); }
  };

  const deleteItem = (id, name) => {
    Alert.alert('[ CONFIRMAR ]', `Remover ${name} da dispensa?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          const prevItems = items;
          const nextItems = items.filter((i) => i.id !== id);
          setItems(nextItems);
          setLowAlerts(lowAlertNames(nextItems));
          try {
            const res = await apiFetch(`${API_URL}/api/pantry/${id}`, {
              method: 'DELETE',
              headers: authHeaders,
            });
            if (!res.ok) throw new Error('delete failed');
            await refreshKeys('pantry', 'recipes');
          } catch (e) {
            setItems(prevItems);
            setLowAlerts(lowAlertNames(prevItems));
            Alert.alert('[ ERRO ]', 'Não foi possível remover o item');
          }
        },
      },
    ]);
  };

  const adjustQuantity = (item, direction) => {
    const step = quantityStep(item.unit);
    const delta = direction * step;

    setItems((prev) => {
      const current = prev.find((i) => i.id === item.id);
      if (!current) return prev;
      const newQty = Math.max(0, current.quantity + delta);
      if (newQty === current.quantity) return prev;
      const next = sortByName(prev.map((i) => (
        i.id === item.id ? { ...i, quantity: newQty } : i
      )));
      setLowAlerts(lowAlertNames(next));
      return next;
    });

    const prevQueue = adjustQueuesRef.current.get(item.id) || Promise.resolve();
    const nextQueue = prevQueue
      .then(async () => {
        const res = await apiFetch(`${API_URL}/api/pantry/${item.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ delta }),
        });
        if (!res.ok) throw new Error('update failed');
        const updated = await res.json();
        applyItemUpdate(item.id, updated);
        scheduleRecipeRefresh();
      })
      .catch(async () => {
        await fetchItems();
        Alert.alert('[ ERRO ]', 'Não foi possível actualizar a quantidade');
      });

    adjustQueuesRef.current.set(item.id, nextQueue);
    nextQueue.finally(() => {
      if (adjustQueuesRef.current.get(item.id) === nextQueue) {
        adjustQueuesRef.current.delete(item.id);
      }
    });
  };

  const set = (key) => (val) => setNewItem((n) => ({ ...n, [key]: val }));

  const closeModal = () => {
    setModalVisible(false);
    setNewItem(EMPTY_ITEM);
  };

  const renderItem = ({ item }) => {
    const isLow = item.quantity <= item.low_stock_threshold;
    const step = quantityStep(item.unit);
    const wouldDelete = item.quantity <= step;

    return (
      <PixelCard
        accentColor={isLow ? COLORS.GOLD : COLORS.MUTED}
        style={s.itemCard}
        innerStyle={{ padding: 12 }}
      >
        <Text style={s.itemName}>{item.name}</Text>
        <View style={s.qtyRow}>
          <PixelButton
            variant={wouldDelete ? 'destructive' : 'outline'}
            size="sm"
            fullWidth={false}
            style={s.qtyBtn}
            onPress={() => (
              wouldDelete
                ? deleteItem(item.id, item.name)
                : adjustQuantity(item, -1)
            )}
          >
            {wouldDelete ? 'X' : '−'}
          </PixelButton>
          <PixelBadge
            variant={isLow ? 'warning' : 'default'}
            style={s.qtyBadge}
            textStyle={s.qtyBadgeText}
          >
            {formatQuantity(item.quantity)} {item.unit}
          </PixelBadge>
          <PixelButton
            variant="outline"
            size="sm"
            fullWidth={false}
            style={s.qtyBtn}
            onPress={() => adjustQuantity(item, +1)}
          >
            +
          </PixelButton>
        </View>
        {isLow && (
          <PixelBadge
            variant="warning"
            style={s.lowStockBadge}
            textStyle={s.lowStockBadgeText}
          >
            ⚠ STOCK BAIXO
          </PixelBadge>
        )}
      </PixelCard>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Text style={s.screenTitle}>DISPENSA</Text>

      {lowAlerts.length > 0 && (
        <PixelAlert variant="warning">
          ⚠ STOCK BAIXO: {lowAlerts.join(' · ')}
        </PixelAlert>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.RED]}
            tintColor={COLORS.RED}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyText}>DISPENSA VAZIA</Text>
            <Text style={s.emptyHint}>Adiciona itens para começar!</Text>
          </View>
        }
      />

      <View style={s.fabArea}>
        <PixelButton variant="primary" size="lg" onPress={() => setModalVisible(true)}>
          + ADICIONAR INGREDIENTE
        </PixelButton>
      </View>

      {/* ── Add Item Modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={closeModal}>
          <Pressable style={s.modalWrap} onPress={(e) => e.stopPropagation()}>
            <PixelCard accentColor={COLORS.RED} accentTop style={{ margin: 0 }}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>[ NOVO INGREDIENTE ]</Text>
                <Pressable
                  onPress={closeModal}
                  style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
                  hitSlop={8}
                  accessibilityLabel="Fechar"
                >
                  <Text style={s.closeBtnText}>×</Text>
                </Pressable>
              </View>

              <PixelDivider color={COLORS.RED} style={{ marginBottom: 16, marginTop: 4 }} />

              <PixelPicker
                label="Ingrediente"
                placeholder="Selecionar ingrediente..."
                value={newItem.product_id}
                items={products.map(p => ({
                  id: p.id,
                  label: p.name,
                  sublabel: `${p.unit}${p.category ? ' · ' + p.category : ''}`,
                }))}
                onSelect={(item) => {
                  const product = products.find(p => p.id === item.id);
                  setNewItem(n => ({
                    ...n,
                    product_id: product.id,
                    name:       product.name,
                    unit:       product.unit,
                    category:   product.category || '',
                  }));
                }}
              />
              <PixelInput
                label="Quantidade"
                placeholder={`ex: 500 ${newItem.unit}`}
                keyboardType="numeric"
                value={newItem.quantity}
                onChangeText={set('quantity')}
              />
              <UnitSelector value={newItem.unit} onChange={set('unit')} />

              <View style={{ marginTop: 8 }}>
                <PixelButton variant="primary" size="lg" onPress={addItem}>
                  GUARDAR
                </PixelButton>
              </View>
            </PixelCard>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG, padding: 16 },
  screenTitle: {
    fontFamily: PIXEL.FONT,
    fontSize: 18,
    color: COLORS.TEXT,
    letterSpacing: 2,
    marginBottom: 14,
  },

  list: { paddingBottom: 80 },
  itemCard: { marginBottom: 10 },
  itemName: {
    fontFamily: PIXEL.FONT,
    fontSize: 14,
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  qtyBtn: { minWidth: 44 },
  qtyBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  qtyBadgeText: {
    fontSize: 13,
    textAlign: 'center',
  },
  lowStockBadge: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  lowStockBadgeText: {
    textAlign: 'center',
  },

  emptyBox: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontFamily: PIXEL.FONT, fontSize: 16, color: COLORS.MUTED, letterSpacing: 2 },
  emptyHint: { fontFamily: PIXEL.FONT, fontSize: 11, color: COLORS.MUTED, opacity: 0.6 },

  fabArea: { position: 'absolute', bottom: 20, left: 16, right: 16 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalWrap: {},
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 28,
  },
  modalTitle: {
    fontFamily: PIXEL.FONT,
    fontSize: 15,
    color: COLORS.TEXT,
    textAlign: 'center',
    letterSpacing: 2,
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: -4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: PIXEL.FONT,
    fontSize: 28,
    lineHeight: 28,
    color: COLORS.MUTED,
  },
});

// ── Unit selector ─────────────────────────────────────────────────────────────
const UNITS = ['g', 'ml', 'kg', 'un'];

const UnitSelector = ({ value, onChange }) => (
  <View style={us.wrapper}>
    <Text style={us.label}>UNIDADE</Text>
    <View style={us.row}>
      {UNITS.map((unit) => {
        const active = value === unit;
        return (
          <Pressable key={unit} style={us.btnWrap} onPress={() => onChange(unit)}>
            {({ pressed }) => (
              <View style={[
                us.btn,
                active && us.btnActive,
                {
                  borderBottomWidth: pressed ? 2 : 4,
                  borderRightWidth:  pressed ? 2 : 4,
                  transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
                },
              ]}>
                <Text style={[us.btnText, active && us.btnTextActive]}>{unit}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  </View>
);

const us = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  row: { flexDirection: 'row', gap: 8 },
  btnWrap: { flex: 1 },
  btn: {
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    backgroundColor: COLORS.INPUT,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: COLORS.RED,
  },
  btnText: {
    fontFamily: PIXEL.FONT,
    fontSize: 13,
    color: COLORS.MUTED,
  },
  btnTextActive: {
    color: COLORS.WHITE,
  },
});

export default PantryScreen;
