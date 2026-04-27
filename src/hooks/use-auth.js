import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { adminSupabase } from "../lib/supabase-admin";
import { getCurrentAdminProfile } from "../services/admin-users";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAuthState = async (sessionUser) => {
      if (!isMounted) return;

      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setUser(sessionUser);
        const currentProfile = await getCurrentAdminProfile(sessionUser);
        if (!isMounted) return;
        setProfile(currentProfile);
      } catch (error) {
        if (!isMounted) return;
        console.error("No se pudo cargar perfil admin:", error);
        setUser(null);
        setProfile(null);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    adminSupabase.auth.getUser().then(({ data }) => {
      loadAuthState(data.user ?? null);
    });

    const { data: listener } = adminSupabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoading(true);
        loadAuthState(session?.user ?? null);
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    const { data } = await adminSupabase.auth.getUser();
    if (!data.user) return;
    try {
      const updated = await getCurrentAdminProfile(data.user);
      setProfile(updated);
    } catch (err) {
      console.error("No se pudo refrescar el perfil:", err);
    }
  };

  const value = useMemo(
    () => ({ user, profile, loading, refreshProfile }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, loading],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}
