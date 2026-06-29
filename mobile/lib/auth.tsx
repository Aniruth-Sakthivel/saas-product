import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Membership, Organization } from "@/lib/types";

type AuthState = {
  session: Session | null;
  organization: Organization | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  organization: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Resolve the active organization (first active membership) once signed in.
  useEffect(() => {
    if (!session) {
      setOrganization(null);
      return;
    }
    supabase
      .from("memberships")
      .select("*, organization:organizations(*)")
      .eq("status", "ACTIVE")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const m = data as (Membership & { organization: Organization }) | null;
        setOrganization(m?.organization ?? null);
      });
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        organization,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
