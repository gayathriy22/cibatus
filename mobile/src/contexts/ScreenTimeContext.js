import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  getInstalledApplications,
  screenTimeService,
  setSimulatedBreakdown,
  setSimulatedMinutes,
  setSimulatedPickups,
} from '@/lib/screenTime';

const ScreenTimeContext = createContext(null);

export function ScreenTimeProvider({ children }) {
  const [, invalidation] = useState(0);

  const invalidate = useCallback(() => {
    invalidation((n) => n + 1);
  }, []);

  const getTodayTotalMinutes = useCallback(() => screenTimeService.getTodayTotalMinutes(), []);
  const getTodayPickups = useCallback(() => screenTimeService.getTodayPickups(), []);
  const getPerAppBreakdown = useCallback((apps) => screenTimeService.getPerAppBreakdown(apps), []);
  const getInstalledApps = useCallback(() => getInstalledApplications(), []);

  const simulateMinutes = useCallback(async (minutes) => {
    await setSimulatedMinutes(minutes);
    invalidate();
  }, [invalidate]);

  const simulatePickups = useCallback(async (pickups) => {
    await setSimulatedPickups(pickups);
    invalidate();
  }, [invalidate]);

  const simulateBreakdown = useCallback(
    async (breakdown) => {
      await setSimulatedBreakdown(breakdown);
      invalidate();
    },
    [invalidate]
  );

  const value = useMemo(
    () => ({
      getTodayTotalMinutes,
      getTodayPickups,
      getPerAppBreakdown,
      getInstalledApplications: getInstalledApps,
      simulateMinutes,
      simulatePickups,
      simulateBreakdown,
      invalidate,
    }),
    [
      getTodayTotalMinutes,
      getTodayPickups,
      getPerAppBreakdown,
      getInstalledApps,
      simulateMinutes,
      simulatePickups,
      simulateBreakdown,
      invalidate,
    ]
  );

  return (
    <ScreenTimeContext.Provider value={value}>{children}</ScreenTimeContext.Provider>
  );
}

export function useScreenTime() {
  const ctx = useContext(ScreenTimeContext);
  if (!ctx) throw new Error('useScreenTime must be used within ScreenTimeProvider');
  return ctx;
}
