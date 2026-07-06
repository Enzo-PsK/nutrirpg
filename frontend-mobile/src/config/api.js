/**
 * Centralized API configuration.
 *
 * - Development (__DEV__): http://localhost:3000
 *   For physical device testing, update DEV_URL to your machine's local IP.
 *
 * - Production: reads app.json → "extra" → "apiUrl"
 *   Currently: https://nutrirpg-be-production.up.railway.app
 */
import Constants from 'expo-constants';

const PROD_URL = Constants.expoConfig?.extra?.apiUrl || 'https://nutrirpg-be-production.up.railway.app';
const DEV_URL  = 'http://localhost:3000';

export const API_URL = __DEV__ ? DEV_URL : PROD_URL;

export default API_URL;
