// src/screens/HomeScreen.js — NutriRPG 8-bit Edition
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, Alert, Pressable, RefreshControl,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sortMeals = (list) => [...list].sort((a, b) => {
  if (!a.meal_time) return 1;
  if (!b.meal_time) return -1;
  return a.meal_time.localeCompare(b.meal_time);
});
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PixelButton, PixelCard, PixelProgress, PixelBadge, PixelDivider,
  COLORS, PIXEL, RPG,
} from '../components/pixel';
import API_URL from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import { useRegisterRefresh, usePullToRefresh } from '../context/AppRefreshContext';

const MealAccordion = ({ meal, isFirst }) => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={[s.mealBlock, !isFirst && { borderTopWidth: 1, borderTopColor: COLORS.INPUT, marginTop: 8, paddingTop: 8 }]}>
      <Pressable onPress={toggle} style={({ pressed }) => [s.mealHeader, pressed && { opacity: 0.7 }]}>
        <View style={s.mealTimeBadge}>
          <Text style={s.mealTimeText}>{meal.meal_time}</Text>
        </View>
        <Text style={s.mealName}>{meal.name}</Text>
        <Text style={[s.mealChevron]}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open && meal.items?.length > 0 && (
        <View style={s.mealItems}>
          {meal.items.map(item => (
            <View key={item.id} style={s.mealItemRow}>
              <Text style={s.mealItemDot}>▸</Text>
              <Text style={s.mealItemText}>{item.description}</Text>
            </View>
          ))}
        </View>
      )}
      {open && (!meal.items || meal.items.length === 0) && (
        <Text style={[s.mealItemText, { color: COLORS.MUTED, fontStyle: 'italic', paddingTop: 6 }]}>
          Sem itens definidos.
        </Text>
      )}
    </View>
  );
};

const WATER_OPTIONS = [
  { amount: 150, label: 'COPO (S)' },
  { amount: 250, label: 'COPO (L)' },
  { amount: 500, label: 'GARRAFA'  },
];

const HomeScreen = ({ navigation, user }) => {
  const [xp,          setXp]          = useState({ level: 1, xp_total: 0, progress_to_next_level: 0 });
  const [hyd,         setHyd]         = useState({ today_total_ml: 0, daily_goal_ml: 2000, percentage: 0 });
  const [plan,        setPlan]        = useState([]);
  const [accordionKey, setAccordionKey] = useState(0);
  const goalAlertShown = useRef(false);
  const { refreshing, onRefresh, refreshKeys } = usePullToRefresh();

  useFocusEffect(useCallback(() => {
    setAccordionKey(k => k + 1);
  }, []));

  const authHeaders = {
    Authorization: `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };

  const fetchAll = useCallback(async () => {
    try {
      const [xpRes, hydRes, planRes] = await Promise.all([
        apiFetch(`${API_URL}/api/xp/status`,       { headers: authHeaders }),
        apiFetch(`${API_URL}/api/hydration/today`, { headers: authHeaders }),
        apiFetch(`${API_URL}/api/meal-plan/mine`,  { headers: authHeaders }),
      ]);
      const [xpData, hydData, planData] = await Promise.all([xpRes.json(), hydRes.json(), planRes.json()]);
      setXp(xpData);
      setHyd(hydData);
      setPlan(Array.isArray(planData) ? sortMeals(planData) : []);
      if (hydData.goal_reached) goalAlertShown.current = true;
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    }
  }, [user.token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRegisterRefresh('home', fetchAll);

  const logWater = async (amount) => {
    try {
      const res = await apiFetch(`${API_URL}/api/hydration/log`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ amount_ml: amount }),
      });
      const data = await res.json();
      setHyd(data);
      if (data.goal_reached && !goalAlertShown.current) {
        goalAlertShown.current = true;
        Alert.alert('🏆 META ATINGIDA!', 'Hidratação diária completa! Bónus de XP desbloqueado.');
      }
      await awardXP('drink_water');
    } catch (e) { console.error(e); }
  };

  const awardXP = async (action) => {
    try {
      const res = await apiFetch(`${API_URL}/api/xp/award`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.leveled_up) {
        Alert.alert('⚔️ LEVEL UP!', data.message || `Subiste para o Nível ${(data.level ?? xp.level)}!`);
      }
      await refreshKeys('home', 'profile');
    } catch (e) { console.error(e); }
  };

  const hydPct = Math.min(100, Math.max(0, hyd.percentage || 0));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.RED]}
          tintColor={COLORS.RED}
        />
      }
    >

      {/* ── Character Card ── */}
      <PixelCard accentColor={COLORS.RED} accentTop>
        <View style={s.charHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.charName}>⚔️ {user?.username || 'Herói'}</Text>
            <Text style={s.charEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
          <PixelBadge variant="level">LVL {xp.level}</PixelBadge>
        </View>

        <View style={{ height: 12 }} />

        {/* XP Bar */}
        <Text style={s.barLabel}>▸ XP — {xp.xp_total} total</Text>
        <PixelProgress
          value={xp.progress_to_next_level}
          max={100}
          color={RPG.XP}
          height={20}
          sublabel={`${xp.progress_to_next_level}% para próximo nível`}
        />

      </PixelCard>

      {/* ── Meal Plan ── */}
      {plan.length > 0 && (
        <PixelCard accentColor={COLORS.GREEN} accentTop>
          <Text style={s.widgetTitle}>PLANO NUTRICIONAL</Text>
          {plan.map((meal, mi) => (
            <MealAccordion key={`${accordionKey}-${meal.id}`} meal={meal} isFirst={mi === 0} />
          ))}
        </PixelCard>
      )}

      {/* ── Hydration Widget ── */}
      <PixelCard accentColor={COLORS.BLUE} accentTop>
        <Text style={s.widgetTitle}>💧 HIDRATAÇÃO HOJE</Text>

        <PixelProgress
          value={hyd.today_total_ml}
          max={hyd.daily_goal_ml}
          color={COLORS.BLUE}
          height={22}
          sublabel={`${hyd.today_total_ml} ml / ${hyd.daily_goal_ml} ml  (${hydPct}%)`}
        />

        <View style={{ height: 12 }} />
        <Text style={s.sectionLabel}>REGISTAR ÁGUA</Text>
        <View style={s.waterRow}>
          {WATER_OPTIONS.map(({ amount, label }) => (
            <Pressable key={amount} style={s.waterBtn} onPress={() => logWater(amount)}>
              {({ pressed }) => (
                <View style={[
                  s.waterBtnInner,
                  {
                    borderBottomWidth: pressed ? 2 : 6,
                    borderRightWidth:  pressed ? 2 : 6,
                    transform: pressed ? [{ translateX: 4 }, { translateY: 4 }] : [],
                  },
                ]}>
                  <Text style={s.waterLabel}>{label}</Text>
                  <Text style={s.waterAmount}>+{amount} ml</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </PixelCard>

      {/* ── Quick Actions ── */}
      <PixelCard accentColor={COLORS.GOLD} accentTop>
        <Text style={s.widgetTitle}>🎯 AÇÕES RÁPIDAS</Text>

        <View style={{ gap: 10 }}>
          <PixelButton variant="primary" onPress={() => awardXP('eat_fruit')}>
            COMI FRUTA (+25 XP)
          </PixelButton>
          <PixelButton variant="secondary" onPress={() => navigation.navigate('Pantry')}>
            DISPENSA
          </PixelButton>
          <PixelButton variant="dark" onPress={() => navigation.navigate('Recipes')}>
            RECEITAS
          </PixelButton>
        </View>
      </PixelCard>

    </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG },
  root: { flex: 1, backgroundColor: COLORS.BG },
  content: { padding: 16, paddingTop: 20, paddingBottom: 32 },

  charHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  charName: {
    fontFamily: PIXEL.FONT,
    fontSize: 20,
    color: COLORS.RED,
    letterSpacing: 1,
  },
  charEmail: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    marginTop: 2,
  },

  barLabel: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    color: COLORS.MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  widgetTitle: {
    fontFamily: PIXEL.FONT,
    fontSize: 13,
    color: COLORS.TEXT,
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: PIXEL.FONT,
    fontSize: 9,
    color: COLORS.MUTED,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  waterRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  waterBtn: { flex: 1 },
  waterBtnInner: {
    backgroundColor: COLORS.BLUE,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  waterLabel: {
    fontFamily: PIXEL.FONT,
    fontSize: 9,
    color: COLORS.WHITE,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  waterAmount: {
    fontFamily: PIXEL.FONT,
    fontSize: 12,
    color: COLORS.WHITE,
  },

  mealBlock:    {},
  mealHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  mealName:     { fontFamily: PIXEL.FONT, fontSize: 13, color: COLORS.GREEN, flex: 1 },
  mealChevron:  { fontFamily: PIXEL.FONT, fontSize: 9, color: COLORS.MUTED },
  mealTimeBadge:{ backgroundColor: COLORS.INPUT, borderWidth: 1, borderColor: COLORS.BORDER, paddingHorizontal: 6, paddingVertical: 2, minWidth: 46, alignItems: 'center' },
  mealTimeText: { fontFamily: PIXEL.FONT, fontSize: 10, color: COLORS.BLUE, textAlign: 'center' },
  mealItems:    { gap: 4, paddingTop: 8, paddingLeft: 4 },
  mealItemRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  mealItemDot:  { fontFamily: PIXEL.FONT, fontSize: 10, color: COLORS.MUTED, marginTop: 2 },
  mealItemText: { fontFamily: PIXEL.FONT, fontSize: 12, color: COLORS.TEXT, flex: 1, lineHeight: 18 },
});

export default HomeScreen;
