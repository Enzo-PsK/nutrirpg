// src/screens/RecipeScreen.js — NutriRPG 8-bit Edition
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, LayoutAnimation, Platform, UIManager, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PixelButton, PixelCard, PixelBadge, PixelProgress, PixelDivider,
  COLORS, PIXEL,
} from '../components/pixel';
import API_URL from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import { useRegisterRefresh, usePullToRefresh } from '../context/AppRefreshContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Accordion component ──────────────────────────────────────────────────────
const Accordion = ({ title, subtitle, accentColor, count, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={[acc.wrapper, { borderLeftColor: accentColor }]}>
      {/* Header (tap to toggle) */}
      <Pressable onPress={toggle} style={({ pressed }) => [acc.header, pressed && { opacity: 0.75 }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[acc.title, { color: accentColor }]}>{title}</Text>
            {count > 0 && (
              <View style={[acc.countBadge, { backgroundColor: accentColor }]}>
                <Text style={acc.countText}>{count}</Text>
              </View>
            )}
          </View>
          {subtitle ? <Text style={acc.subtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={[acc.chevron, { color: accentColor }]}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {/* Content */}
      {open && (
        <View style={acc.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const acc = StyleSheet.create({
  wrapper: {
    borderLeftWidth: 4,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    marginBottom: 16,
    backgroundColor: COLORS.CARD,
    boxShadow: '3px 3px 0 #000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  title: {
    fontFamily: PIXEL.FONT, fontSize: 12,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: PIXEL.FONT, fontSize: 10, color: COLORS.MUTED, marginTop: 2,
  },
  chevron: {
    fontFamily: PIXEL.FONT, fontSize: 10,
  },
  countBadge: {
    paddingHorizontal: 6, paddingVertical: 1,
    minWidth: 20, alignItems: 'center',
  },
  countText: {
    fontFamily: PIXEL.FONT, fontSize: 10, color: '#fff',
  },
  content: {
    paddingHorizontal: 12, paddingBottom: 12,
  },
});

// ── Per-recipe accordion ─────────────────────────────────────────────────────
const RecipeAccordion = ({ item, accentColor, onCook, cookLabel, children }) => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  // Always use item from props so the cook handler is never stale
  const handleCook = () => onCook(item);

  return (
    <View style={[ra.wrapper, { borderLeftColor: accentColor }]}>
      <Pressable onPress={toggle} style={({ pressed }) => [ra.header, pressed && { opacity: 0.75 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[ra.name, { color: COLORS.TEXT }]} numberOfLines={open ? undefined : 1}>
            {item.name}
          </Text>
        </View>
        <PixelBadge variant="xp">+{item.xp_reward || 30} XP</PixelBadge>
        <Text style={[ra.chevron, { color: accentColor }]}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open && (
        <View style={ra.body}>
          {children}
          <View style={{ height: 10 }} />
          <PixelButton variant="secondary" onPress={handleCook}>
            {cookLabel || 'COZINHAR ESTA RECEITA'}
          </PixelButton>
        </View>
      )}
    </View>
  );
};

const ra = StyleSheet.create({
  wrapper: {
    borderLeftWidth: 4,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    marginBottom: 10,
    backgroundColor: COLORS.CARD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  name: {
    fontFamily: PIXEL.FONT,
    fontSize: 13,
    flex: 1,
  },
  chevron: {
    fontFamily: PIXEL.FONT,
    fontSize: 10,
    marginLeft: 4,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.INPUT,
  },
});

// ── Main screen ──────────────────────────────────────────────────────────────

const RecipeScreen = ({ user }) => {
  const [myRecipes, setMyRecipes] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const { refreshing, onRefresh, refreshKeys } = usePullToRefresh();

  const authHeaders = {
    Authorization: `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };

  const fetchAll = useCallback(async () => {
    try {
      const [mineRes, suggestRes] = await Promise.all([
        apiFetch(`${API_URL}/api/recipes/mine`,    { headers: authHeaders }),
        apiFetch(`${API_URL}/api/recipes/suggest`, { headers: authHeaders }),
      ]);
      const [mine, suggest] = await Promise.all([mineRes.json(), suggestRes.json()]);
      setMyRecipes(Array.isArray(mine)    ? mine    : []);
      setSuggested(Array.isArray(suggest) ? suggest : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRegisterRefresh('recipes', fetchAll);

  const cookRecipe = async (recipe) => {
    try {
      const res = await apiFetch(`${API_URL}/api/user/complete-recipe/${recipe.id}`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();

      if (!res.ok) {
        Alert.alert('ERRO', data.error || 'Não foi possível concluir a receita.');
        return;
      }

      const xp = data.xp_gained ?? data.xp_reward ?? recipe.xp_reward ?? 50;

      Alert.alert(
        'RECEITA PREPARADA!',
        `${recipe.name}\n+${xp} XP ganhos!${data.leveled_up ? '\nLEVEL UP!' : ''}`
      );
      await refreshKeys('home', 'profile', 'recipes');
    } catch (e) { console.error(e); }
  };

  const matchBarColor = (pct) => pct >= 75 ? COLORS.GREEN : pct >= 50 ? COLORS.GOLD : COLORS.RED;
  const matchVariant  = (pct) => pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger';

  const renderMyRecipe = (item) => (
    <RecipeAccordion
      key={item.id}
      item={item}
      accentColor={COLORS.PURPLE}
      onCook={cookRecipe}
      cookLabel="COZINHAR ESTA RECEITA"
    >
      {item.description ? <Text style={s.description}>{item.description}</Text> : null}
      {item.ingredients?.length > 0 && (
        <>
          <Text style={s.ingredientLabel}>INGREDIENTES</Text>
          <View style={s.ingredientList}>
            {item.ingredients.map((ing, i) => (
              <View key={i} style={s.ingredientRow}>
                <Text style={s.ingredientName}>{ing.product_name}</Text>
                <PixelBadge variant="default">{ing.quantity} {ing.unit}</PixelBadge>
              </View>
            ))}
          </View>
        </>
      )}
      {item.instructions ? (
        <>
          <PixelDivider color={COLORS.INPUT} style={{ marginVertical: 10 }} />
          <Text style={s.ingredientLabel}>INSTRUCOES</Text>
          <Text style={s.instructions}>{item.instructions}</Text>
        </>
      ) : null}
    </RecipeAccordion>
  );

  const renderSuggested = (item, i) => (
    <RecipeAccordion
      key={item.id || i}
      item={item}
      accentColor={matchBarColor(item.match_percentage)}
      onCook={cookRecipe}
      cookLabel="COZINHAR"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 6 }}>
        <PixelBadge variant={matchVariant(item.match_percentage)}>
          {item.match_percentage}% compativel
        </PixelBadge>
      </View>
      <PixelProgress
        value={item.match_percentage}
        max={100}
        color={matchBarColor(item.match_percentage)}
        height={10}
        showTicks={false}
      />
      {item.description ? <Text style={s.description}>{item.description}</Text> : null}
      <Text style={s.ingredientLabel}>INGREDIENTES DISPONIVEIS</Text>
      <Text style={s.ingredients}>{item.matched_ingredients?.join(' · ') || '—'}</Text>
      {item.missing_ingredients?.length > 0 && (
        <>
          <Text style={[s.ingredientLabel, { color: COLORS.MUTED, marginTop: 8 }]}>EM FALTA</Text>
          <Text style={[s.ingredients, { color: COLORS.MUTED }]}>
            {item.missing_ingredients.join(' · ')}
          </Text>
        </>
      )}
      {item.instructions ? (
        <>
          <PixelDivider color={COLORS.INPUT} style={{ marginVertical: 10 }} />
          <Text style={s.ingredientLabel}>INSTRUCOES</Text>
          <Text style={s.instructions}>{item.instructions}</Text>
        </>
      ) : null}
    </RecipeAccordion>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.center}>
          <Text style={s.loadingText}>[ A CARREGAR RECEITAS... ]</Text>
          <PixelProgress value={50} max={100} color={COLORS.PURPLE} height={14} showTicks={false} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.RED]}
            tintColor={COLORS.RED}
          />
        }
      >
        <Text style={s.screenTitle}>RECEITAS</Text>

        {/* Accordion 1 — Nutritionist recipes (open by default) */}
        <Accordion
          title="Do meu Nutricionista"
          subtitle={myRecipes.length > 0
            ? `${myRecipes.length} receita${myRecipes.length !== 1 ? 's' : ''} atribuida${myRecipes.length !== 1 ? 's' : ''}`
            : 'Sem receitas atribuidas ainda'}
          accentColor={COLORS.PURPLE}
          count={myRecipes.length}
          defaultOpen
        >
          {myRecipes.length === 0 ? (
            <Text style={s.emptyText}>
              O teu nutricionista ainda nao criou receitas para ti.
            </Text>
          ) : (
            myRecipes.map(renderMyRecipe)
          )}
        </Accordion>

        {/* Accordion 2 — Pantry suggestions (closed by default) */}
        <Accordion
          key={`pantry-suggestions-${suggested.length}`}
          title="Sugestoes da Dispensa"
          subtitle="Receitas compativeis com os teus ingredientes"
          accentColor={COLORS.GOLD}
          count={suggested.length}
          defaultOpen={suggested.length > 0}
        >
          {suggested.length === 0 ? (
            <Text style={s.emptyText}>
              Adiciona ingredientes do catalogo a dispensa. As sugestoes comparam
              com todas as receitas criadas no sistema.
            </Text>
          ) : (
            suggested.map(renderSuggested)
          )}
        </Accordion>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  list: { padding: 16, paddingBottom: 40 },

  screenTitle: {
    fontFamily: PIXEL.FONT, fontSize: 18,
    color: COLORS.TEXT, letterSpacing: 2, marginBottom: 20,
  },

  card: { marginBottom: 12 },

  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  recipeName: {
    fontFamily: PIXEL.FONT, fontSize: 15,
    color: COLORS.TEXT, flex: 1,
  },
  description: {
    fontFamily: PIXEL.FONT, fontSize: 12, color: COLORS.MUTED,
    marginTop: 6, marginBottom: 4, lineHeight: 18,
  },
  ingredientLabel: {
    fontFamily: PIXEL.FONT, fontSize: 10, color: COLORS.BLUE,
    letterSpacing: 1, marginBottom: 6, marginTop: 10,
  },
  ingredientList: { gap: 6 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ingredientName: { fontFamily: PIXEL.FONT, fontSize: 13, color: COLORS.TEXT, flex: 1 },
  instructions: { fontFamily: PIXEL.FONT, fontSize: 12, color: COLORS.TEXT, lineHeight: 20 },
  ingredients: { fontFamily: PIXEL.FONT, fontSize: 12, color: COLORS.TEXT, lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },

  emptyText: {
    fontFamily: PIXEL.FONT, fontSize: 12, color: COLORS.MUTED,
    fontStyle: 'italic', paddingVertical: 8, lineHeight: 18,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: {
    fontFamily: PIXEL.FONT, fontSize: 13, color: COLORS.MUTED,
    letterSpacing: 1, marginBottom: 16,
  },
});

export default RecipeScreen;
