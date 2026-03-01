import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { minutesToHealthTier } from '@/features/plant/health';
import { getLatestTimeHistory, getPlantCharacter, insertPlantCharacter } from '@/lib/db';
import { useUserProfile } from '@/hooks/useUserProfile';

export function usePlantHealthUpdate() {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  const update = useCallback(async () => {
    if (!profile?.plant_uid || profile.daily_time_goal == null) return;
    const latest = await getLatestTimeHistory(profile.user_id);
    if (!latest) return;
    const health = minutesToHealthTier(latest.daily_total, profile.daily_time_goal);
    // Preserve current character image; only health should change here.
    const currentCharacter = await getPlantCharacter(profile.plant_uid);
    const imageUri =
      (typeof currentCharacter?.plant_img_uri === 'string' && currentCharacter.plant_img_uri.trim()) ||
      (typeof currentCharacter?.character_image_uri === 'string' && currentCharacter.character_image_uri.trim()) ||
      null;
    if (!imageUri) return;
    await insertPlantCharacter(profile.plant_uid, health, imageUri);
    queryClient.invalidateQueries({ queryKey: ['plant-character', profile.plant_uid] });
  }, [profile?.plant_uid, profile?.user_id, profile?.daily_time_goal, queryClient]);

  useEffect(() => {
    if (!profile?.plant_uid) return;
    update();
  }, [profile?.plant_uid, update]);
}
