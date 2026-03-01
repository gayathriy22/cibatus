/**
 * Map daily total minutes vs goal (in hours) to plant health tier.
 */
export function minutesToHealthTier(dailyTotalMinutes, goalHours) {
  const goalMinutes = goalHours * 60;
  const okayThreshold = goalMinutes * 1.25;
  if (dailyTotalMinutes <= goalMinutes) return 'very healthy';
  if (dailyTotalMinutes <= okayThreshold) return 'okay';
  return 'dying';
}

export function healthToDisplayCopy(health) {
  switch (health) {
    case 'very healthy':
      return 'is feeling very healthy!';
    case 'okay':
      return 'is feeling okay.';
    case 'dying':
      return 'needs your help — too much screen time!';
    default:
      return 'is feeling okay.';
  }
}
