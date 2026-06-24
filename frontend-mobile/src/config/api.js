/**
 * Centralized API configuration.
 *
 * HOW TO CHANGE THE BACKEND URL:
 *   Edit app.json → "extra" → "apiUrl"
 *   Set it to your machine's local IP:  http://<YOUR_IP>:3000
 *   (run `ipconfig` on Windows to find your IP)
 *
 * Current machine IP: 192.168.1.85
 * - Web browser (same machine): http://localhost:3000  ✓
 * - Android/iOS via Expo Go:    http://192.168.1.85:3000  ✓
 * - Android Emulator:           http://10.0.2.2:3000  ✓
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const configured = Constants.expoConfig?.extra?.apiUrl;

export const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : (configured || 'http://192.168.1.85:3000');

export default API_URL;
