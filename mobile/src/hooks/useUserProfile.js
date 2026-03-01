import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export function useUserProfile() {
  const queryClient = useQueryClient();
  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const authUid = session?.user?.id ?? null;

  const profileQuery = useQuery({
    queryKey: ['user-profile', authUid],
    queryFn: async () => {
      if (!authUid) return null;
      return getUserProfile(authUid);
    },
    enabled: !!authUid,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile', authUid] });
  };

  return {
    session,
    authUid,
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    invalidate,
  };
}
