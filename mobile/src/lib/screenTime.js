/**
 * Screen Time: dummy data only. No native Screen Time API.
 * Provides apps list, today’s total minutes, pickups, and per-app breakdown for development.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const SIMULATE_KEY = '@cibatus/simulate_minutes';
const SIMULATE_PICKUPS_KEY = '@cibatus/simulate_pickups';
const SIMULATE_BREAKDOWN_KEY = '@cibatus/simulate_breakdown';

/** Dummy screen time per app (minutes) – used when real API not available */
const MOCK_BREAKDOWN = [
  { app: 'Instagram', minutes: 45 },
  { app: 'Messages', minutes: 32 },
  { app: 'Twitch', minutes: 28 },
  { app: 'Canvas', minutes: 15 },
  { app: 'TikTok', minutes: 52 },
  { app: 'YouTube', minutes: 38 },
  { app: 'Clash Royale', minutes: 20 },
  { app: 'Brawl Stars', minutes: 18 },
  { app: 'Threads', minutes: 25 },
  { app: 'Snapchat', minutes: 30 },
  { app: 'Gmail', minutes: 22 },
  { app: 'FaceTime', minutes: 12 },
  { app: 'Spotify', minutes: 40 },
];

/** Dummy installed apps list – with bundle IDs for compatibility; includes app icons in assets */
export const DUMMY_INSTALLED_APPS = [
  { bundleIdentifier: 'com.burbn.instagram', displayName: 'Instagram' },
  { bundleIdentifier: 'tv.twitch', displayName: 'Twitch' },
  { bundleIdentifier: 'com.instructure.canvas', displayName: 'Canvas' },
  { bundleIdentifier: 'com.apple.MobileSMS', displayName: 'Messages' },
  { bundleIdentifier: 'com.zhiliaoapp.musically', displayName: 'TikTok' },
  { bundleIdentifier: 'com.google.ios.youtube', displayName: 'YouTube' },
  { bundleIdentifier: 'com.supercell.clashroyale', displayName: 'Clash Royale' },
  { bundleIdentifier: 'com.supercell.brawlstars', displayName: 'Brawl Stars' },
  { bundleIdentifier: 'com.burbn.threads', displayName: 'Threads' },
  { bundleIdentifier: 'com.toyopagroup.picaboo', displayName: 'Snapchat' },
  { bundleIdentifier: 'com.google.Gmail', displayName: 'Gmail' },
  { bundleIdentifier: 'com.apple.facetime', displayName: 'FaceTime' },
  { bundleIdentifier: 'com.spotify.client', displayName: 'Spotify' },
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
    if (!Array.isArray(apps) || apps.length === 0) return [];
    const bundleIdToName = Object.fromEntries(DUMMY_INSTALLED_APPS.map((a) => [a.bundleIdentifier, a.displayName]));
    const toDisplayName = (app) => {
      if (typeof app !== 'string') return app.displayName || app.bundleIdentifier || 'App';
      return bundleIdToName[app] || app;
    };
    const stored = await getStoredBreakdown();
    if (stored && stored.length > 0) {
      return apps.map((app) => {
        const name = toDisplayName(app);
        return { app: name, minutes: stored.find((x) => x.app === name)?.minutes ?? 0 };
      });
    }
    return apps.map((app) => {
      const name = toDisplayName(app);
      return { app: name, minutes: MOCK_BREAKDOWN.find((x) => x.app === name)?.minutes ?? 0 };
    });
  },
};

/** Dummy installed apps – for onboarding when real API not used */
export function getInstalledApplications() {
  return Promise.resolve(DUMMY_INSTALLED_APPS);
}

export async function setSimulatedMinutes(minutes) {
  await AsyncStorage.setItem(SIMULATE_KEY, String(minutes));
}

export async function setSimulatedPickups(pickups) {
  await AsyncStorage.setItem(SIMULATE_PICKUPS_KEY, String(pickups));
}

export async function setSimulatedBreakdown(breakdown) {
  await AsyncStorage.setItem(SIMULATE_BREAKDOWN_KEY, JSON.stringify(breakdown));
}
