// App.js — NutriRPG Mobile · 8-bit Edition
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import store from './src/store';
import { AppRefreshProvider } from './src/context/AppRefreshContext';
import HomeScreen    from './src/screens/HomeScreen';
import PantryScreen  from './src/screens/PantryScreen';
import RecipeScreen  from './src/screens/RecipeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen   from './src/screens/LoginScreen';
import { COLORS, PIXEL } from './src/components/pixel';
import { saveSession, clearSession, restoreSession } from './src/utils/authStorage';
import {
  registerSessionHandler, resetSessionGuard, apiFetch, showSessionEndedAlert,
} from './src/utils/apiFetch';
import API_URL from './src/config/api';

const Tab = createBottomTabNavigator();

// ── Custom tab bar icon ──────────────────────────────────────────────────────
const TabIcon = ({ label, focused }) => (
  <View style={tab.iconWrap}>
    <Text style={[tab.label, focused && tab.labelFocused]}>{label}</Text>
    <View style={[tab.indicator, focused && tab.indicatorActive]} />
  </View>
);

const tab = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
    gap: 4,
  },
  label: {
    fontFamily: PIXEL.FONT,
    fontSize: 9,
    color: COLORS.MUTED,
    letterSpacing: 1,
  },
  labelFocused: { color: COLORS.TEXT, letterSpacing: 1.5 },
  indicator: {
    height: 2,
    width: '80%',
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: COLORS.RED,
  },
});

// ── Tab Navigator ────────────────────────────────────────────────────────────
const MainTabs = ({ user, onLogout }) => (
  <AppRefreshProvider>
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      lazy: false,
      tabBarStyle: {
        backgroundColor: COLORS.CARD,
        borderTopWidth: 2,
        borderTopColor: COLORS.BLACK,
        height: 64,
        paddingBottom: 4,
      },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Home"
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="INÍCIO" focused={focused} />
        ),
      }}
    >
      {(props) => <HomeScreen {...props} user={user} />}
    </Tab.Screen>

    <Tab.Screen
      name="Pantry"
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="DISPENSA" focused={focused} />
        ),
      }}
    >
      {(props) => <PantryScreen {...props} user={user} />}
    </Tab.Screen>

    <Tab.Screen
      name="Recipes"
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="RECEITAS" focused={focused} />
        ),
      }}
    >
      {(props) => <RecipeScreen {...props} user={user} />}
    </Tab.Screen>

    <Tab.Screen
      name="Profile"
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="PERFIL" focused={focused} />
        ),
      }}
    >
      {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
    </Tab.Screen>
  </Tab.Navigator>
  </AppRefreshProvider>
);

// ── Boot splash (fonts + validação de sessão) ───────────────────────────────
const BootScreen = () => (
  <View style={boot.container}>
    <View style={boot.logo}>
      <Text style={boot.logoText}>⚔️</Text>
    </View>
    <Text style={boot.label}>[ A CARREGAR... ]</Text>
    <View style={boot.barTrack}>
      <View style={boot.barFill} />
    </View>
  </View>
);

const boot = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logo: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.RED,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 26 },
  label: {
    fontFamily: PIXEL.FONT,
    fontSize: 14,
    color: COLORS.TEXT,
    letterSpacing: 3,
  },
  barTrack: {
    width: 160,
    height: 6,
    backgroundColor: COLORS.BORDER,
    borderWidth: 2,
    borderColor: COLORS.BLACK,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    width: '60%',
    backgroundColor: COLORS.RED,
  },
});

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const [fontsLoaded] = useFonts({
    ByteBounce: require('./assets/fonts/ByteBounce.ttf'),
    VT323: require('./assets/fonts/VT323-Regular.ttf'),
  });

  useEffect(() => {
    registerSessionHandler(async () => {
      await clearSession();
      setUser(null);
      showSessionEndedAlert();
    });
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    let cancelled = false;
    restoreSession()
      .then((session) => {
        if (!cancelled && session) {
          resetSessionGuard();
          setUser(session);
        }
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => { cancelled = true; };
  }, [fontsLoaded]);

  useEffect(() => {
    if (!user?.token) return undefined;

    const checkSession = async () => {
      const res = await apiFetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) resetSessionGuard();
    };

    checkSession();
    const id = setInterval(checkSession, 45000);
    return () => clearInterval(id);
  }, [user?.token]);

  const handleLogin = async (session) => {
    resetSessionGuard();
    await saveSession(session);
    setUser(session);
  };

  const handleLogout = async () => {
    await clearSession();
    setUser(null);
  };

  if (!fontsLoaded || booting) return <BootScreen />;

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <StatusBar style="dark" backgroundColor={COLORS.BG} />
        <NavigationContainer>
          {user ? (
            <MainTabs user={user} onLogout={handleLogout} />
          ) : (
            <LoginScreen onLogin={handleLogin} />
          )}
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  );
}
