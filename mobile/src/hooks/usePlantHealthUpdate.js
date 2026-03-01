import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { minutesToHealthTier } from '@/features/plant/health';
import { getLatestTimeHistory, insertPlantCharacter } from '@/lib/db';
import { DEFAULT_CHARACTER_IMAGE_URI } from '@/types/database';
import { useUserProfile } from '@/hooks/useUserProfile';

export function usePlantHealthUpdate() {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  const update = useCallback(async () => {
    if (!profile?.plant_uid || profile.daily_time_goal == null) return;
    const latest = await getLatestTimeHistory(profile.user_id);
    if (!latest) return;
    const health = minutesToHealthTier(latest.daily_total, profile.daily_time_goal);
    await insertPlantCharacter(profile.plant_uid, health, DEFAULT_CHARACTER_IMAGE_URI);
    queryClient.invalidateQueries({ queryKey: ['plant-character', profile.plant_uid] });
  }, [profile?.plant_uid, profile?.user_id, profile?.daily_time_goal, queryClient]);

  useEffect(() => {
    if (!profile?.plant_uid) return;
    update();
  }, [profile?.plant_uid, update]);
}
