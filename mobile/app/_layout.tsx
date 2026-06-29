import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";

/** Redirects between the auth screen and the app based on session state. */
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inApp = segments[0] === "(tabs)";
    if (!session && inApp) router.replace("/login");
    else if (session && !inApp) router.replace("/(tabs)");
  }, [session, loading, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
