import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function AuthSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return null;
}
