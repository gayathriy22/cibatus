import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useScreenTime } from '@/contexts/ScreenTimeContext';
import { appendTimeHistory } from '@/lib/db';
import { useUserProfile } from '@/hooks/useUserProfile';

const LAST_SYNC_KEY = '@cibatus/last_time_history_date';

export function useTimeHistorySync() {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { getTodayTotalMinutes, getTodayPickups } = useScreenTime();
  const didRun = useRef(false);

  const sync = useCallback(async () => {
    if (!profile?.user_id) return;
    const today = new Date().toISOString().slice(0, 10);
    const minutes = await getTodayTotalMinutes();
    const pickups = await getTodayPickups();
    await appendTimeHistory(profile.user_id, minutes, pickups, new Date().toISOString());
    await AsyncStorage.setItem(LAST_SYNC_KEY, today);
    queryClient.invalidateQueries({ queryKey: ['time-history', profile.user_id] });
  }, [profile?.user_id, getTodayTotalMinutes, getTodayPickups, queryClient]);

  useEffect(() => {
    if (!profile?.user_id || didRun.current) return;
    (async () => {
      const last = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const today = new Date().toISOString().slice(0, 10);
      if (last !== today) {
        didRun.current = true;
        await sync();
      }
    })();
  }, [profile?.user_id, sync]);

  return { sync };
}
