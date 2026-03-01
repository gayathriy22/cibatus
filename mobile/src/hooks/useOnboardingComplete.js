/**
 * User has completed onboarding when they have goal, apps_to_track, plant_uid, first_name.
 */
export function isOnboardingComplete(profile) {
  if (!profile) return false;
  const hasGoal = profile.daily_time_goal != null && profile.daily_time_goal > 0;
  const hasApps = Array.isArray(profile.apps_to_track) && profile.apps_to_track.length > 0;
  const hasPlant = !!profile.plant_uid;
  const hasName = !!profile.first_name?.trim();
  return !!(hasGoal && hasApps && hasPlant && hasName);
}
