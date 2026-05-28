import { useMemo, useState } from 'react';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState({
    full_name: 'Demo Admin',
    email: 'admin@leasepro.local',
    role: 'owner'
  });
  const [loading] = useState(false);

  // AUTH SETUP LATER:
  // This provider is currently in demo mode so the dashboard can run without
  // Supabase Auth. Restore the Supabase session bootstrap/sign-in logic here
  // when you are ready to require owner/staff login.

  async function signIn(email, _password) {
    // AUTH SETUP LATER:
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // if (error) throw error;
    // setSession(data.session);
    // const response = await api('/auth/me');
    // setProfile(response.user);
    setSession({ user: { email } });
    setProfile({ full_name: email, email, role: 'owner' });
  }

  async function signOut() {
    // AUTH SETUP LATER:
    // await supabase.auth.signOut();
    setSession(null);
    setProfile({ full_name: 'Demo Admin', email: 'admin@leasepro.local', role: 'owner' });
  }

  const value = useMemo(() => ({ session, profile, loading, signIn, signOut }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
