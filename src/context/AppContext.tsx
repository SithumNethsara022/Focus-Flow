import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Theme } from '../types';

interface AppContextValue {
  user: User | null;
  profile: Profile | null;
  theme: Theme;
  loading: boolean;
  setTheme: (t: Theme) => void;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextValue>({
  user: null,
  profile: null,
  theme: 'dark',
  loading: true,
  setTheme: () => {},
  refreshProfile: async () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setThemeState] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
      setThemeState(data.theme as Theme);
    }
  };

  const ensureProfile = async (u: User) => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', u.id)
      .maybeSingle();
    if (!data) {
      const name = u.email?.split('@')[0] ?? 'User';
      await supabase.from('profiles').insert({
        id: u.id,
        display_name: name,
      });
    }
    await fetchProfile(u.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        ensureProfile(u).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        (async () => {
          await ensureProfile(u);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    if (user) {
      await supabase.from('profiles').update({ theme: t }).eq('id', user.id);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AppContext.Provider value={{ user, profile, theme, loading, setTheme, refreshProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
