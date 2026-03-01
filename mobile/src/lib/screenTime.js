/**
 * ScreenTimeService abstraction. Mock in Expo Go; swap for real native later.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const SIMULATE_KEY = '@cibatus/simulate_minutes';
const SIMULATE_PICKUPS_KEY = '@cibatus/simulate_pickups';
const SIMULATE_BREAKDOWN_KEY = '@cibatus/simulate_breakdown';

const MOCK_BREAKDOWN = [
  { app: 'Instagram', minutes: 45 },
  { app: 'Messages', minutes: 32 },
  { app: 'Twitch', minutes: 28 },
  { app: 'Canvas', minutes: 15 },
];

async function getStoredNumber(key, fallback) {
  try {
    const v = await AsyncStorage.getItem(key);
    if (v != null) return Number(v);
  } catch (_) {}
  return fallback;
}

async function getStoredBreakdown() {
  try {
    const v = await AsyncStorage.getItem(SIMULATE_BREAKDOWN_KEY);
    if (v) return JSON.parse(v);
  } catch (_) {}
  return null;
}

export const screenTimeService = {
  async getTodayTotalMinutes() {
    const simulated = await getStoredNumber(SIMULATE_KEY, -1);
    if (simulated >= 0) return simulated;
    return 120;
  },

  async getTodayPickups() {
    const simulated = await getStoredNumber(SIMULATE_PICKUPS_KEY, -1);
    if (simulated >= 0) return simulated;
    return 18;
  },

  async getPerAppBreakdown(apps) {
    const stored = await getStoredBreakdown();
    if (stored && stored.length > 0) {
      return apps.map((app) => ({
        app,
        minutes: stored.find((x) => x.app === app)?.minutes ?? 0,
      }));
    }
    return apps.map((app) => ({
      app,
      minutes: MOCK_BREAKDOWN.find((x) => x.app === app)?.minutes ?? 0,
    }));
  },
};

export async function setSimulatedMinutes(minutes) {
  await AsyncStorage.setItem(SIMULATE_KEY, String(minutes));
}

export async function setSimulatedPickups(pickups) {
  await AsyncStorage.setItem(SIMULATE_PICKUPS_KEY, String(pickups));
}

export async function setSimulatedBreakdown(breakdown) {
  await AsyncStorage.setItem(SIMULATE_BREAKDOWN_KEY, JSON.stringify(breakdown));
}
