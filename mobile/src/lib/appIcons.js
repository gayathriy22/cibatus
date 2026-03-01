/**
 * Map app display name to local icon asset. Used in onboarding, home, stats, profile.
 * Assets live in mobile/assets/ (require relative to this file: ../../assets/).
 */
const APP_ICONS = {
  Instagram: require('../../assets/instagram.png'),
  Twitch: require('../../assets/twitch.png'),
  Canvas: require('../../assets/canvas.png'),
  Messages: require('../../assets/messages.png'),
  TikTok: require('../../assets/tiktok.png'),
  YouTube: require('../../assets/youtube.png'),
  'Clash Royale': require('../../assets/clashroyale.png'),
  'Brawl Stars': require('../../assets/brawlstars.png'),
  Threads: require('../../assets/threads.png'),
  Snapchat: require('../../assets/snapchat.png'),
  Gmail: require('../../assets/gmail.png'),
  FaceTime: require('../../assets/facetime.png'),
  Spotify: require('../../assets/spotify.png'),
};

export function getAppIconSource(displayName) {
  if (!displayName) return null;
  return APP_ICONS[displayName] || null;
}
