import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const defaultState = {
  first_name: '',
  goalHours: 2,
  appsToTrack: [],
  scannedPlantUid: null,
  plantName: '',
  plantImageUri: null,
};

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [state, setState] = useState(defaultState);

  const setFirstName = useCallback((first_name) => {
    setState((s) => ({ ...s, first_name }));
  }, []);
  const setGoalHours = useCallback((goalHours) => {
    setState((s) => ({ ...s, goalHours }));
  }, []);
  const setAppsToTrack = useCallback((appsToTrack) => {
    setState((s) => ({ ...s, appsToTrack }));
  }, []);
  const setScannedPlantUid = useCallback((scannedPlantUid) => {
    setState((s) => ({ ...s, scannedPlantUid }));
  }, []);
  const setPlantName = useCallback((plantName) => {
    setState((s) => ({ ...s, plantName }));
  }, []);
  const setPlantImageUri = useCallback((plantImageUri) => {
    setState((s) => ({ ...s, plantImageUri }));
  }, []);
  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setFirstName,
      setGoalHours,
      setAppsToTrack,
      setScannedPlantUid,
      setPlantName,
      setPlantImageUri,
      reset,
    }),
    [state, setFirstName, setGoalHours, setAppsToTrack, setScannedPlantUid, setPlantName, setPlantImageUri, reset]
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
