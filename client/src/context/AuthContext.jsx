import { createContext, useContext, useEffect, useState } from 'react';

import { supabase, supabaseEnabled } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  function signUp(email, password) {
    if (!supabase) throw new Error('Supabase yapilandirilmamis.');
    return supabase.auth.signUp({ email, password });
  }

  function signIn(email, password) {
    if (!supabase) throw new Error('Supabase yapilandirilmamis.');
    return supabase.auth.signInWithPassword({ email, password });
  }

  function signOut() {
    if (!supabase) return Promise.resolve();
    return supabase.auth.signOut();
  }

  // Sifre sifirlama e-postasi gonderir; kullanici linke tiklayinca /reset-password acilir.
  function resetPassword(email) {
    if (!supabase) throw new Error('Supabase yapilandirilmamis.');
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }

  // Recovery oturumu acikken yeni sifreyi kaydeder.
  function updatePassword(password) {
    if (!supabase) throw new Error('Supabase yapilandirilmamis.');
    return supabase.auth.updateUser({ password });
  }

  // Backend istekleri icin guncel access token.
  function getToken() {
    return session?.access_token ?? null;
  }

  const value = {
    user,
    session,
    loading,
    supabaseEnabled,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
