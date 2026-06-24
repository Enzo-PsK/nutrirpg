// src/store/index.js - Redux Toolkit Store
import { configureStore, createSlice } from '@reduxjs/toolkit';

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, isAuthenticated: false },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

// XP Slice
const xpSlice = createSlice({
  name: 'xp',
  initialState: { level: 1, xp_total: 0, progress: 0 },
  reducers: {
    updateXP: (state, action) => {
      state.level = action.payload.level;
      state.xp_total = action.payload.xp_total;
      state.progress = action.payload.progress_to_next_level;
    },
  },
});

// Pantry Slice
const pantrySlice = createSlice({
  name: 'pantry',
  initialState: { items: [], lowStockAlerts: [] },
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload.items;
      state.lowStockAlerts = action.payload.low_stock_alerts;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const { updateXP } = xpSlice.actions;
export const { setItems } = pantrySlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    xp: xpSlice.reducer,
    pantry: pantrySlice.reducer,
  },
});

export default store;
