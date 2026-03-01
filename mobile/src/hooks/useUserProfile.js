import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export function useUserProfile() {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const session = sessionQuery.data;
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

  const isSessionLoading = sessionQuery.isLoading || sessionQuery.isFetching;
  const isProfileLoading = profileQuery.isLoading;
  const isLoading = isSessionLoading || (!!authUid && isProfileLoading);

  return {
    session,
    authUid,
    profile: profileQuery.data ?? null,
    isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    invalidate,
  };
}
