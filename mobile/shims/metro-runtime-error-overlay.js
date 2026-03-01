/**
 * Shim for @expo/metro-runtime/error-overlay when using @expo/metro-runtime 55.x
 * (which no longer exports this subpath). Expo-router expects it in dev.
 * Passthrough: no overlay in Expo Go; errors still show in Metro.
 */
module.exports = {
  withErrorOverlay: (Component) => Component,
};
