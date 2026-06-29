import { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

type Stats = { rooms: number; arrivals: number; inHouse: number };

export default function DashboardScreen() {
  const { organization, signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({ rooms: 0, arrivals: 0, inHouse: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [rooms, arrivals, inHouse] = await Promise.all([
      supabase.from("rooms").select("id", { count: "exact", head: true }),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("check_in", today),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("status", "CHECKED_IN"),
    ]);
    setStats({
      rooms: rooms.count ?? 0,
      arrivals: arrivals.count ?? 0,
      inHouse: inHouse.count ?? 0,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.org}>{organization?.name ?? "Your hotel"}</Text>

      <View style={styles.grid}>
        <Kpi label="Rooms" value={stats.rooms} />
        <Kpi label="Arrivals today" value={stats.arrivals} />
        <Kpi label="In-house" value={stats.inHouse} />
      </View>

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  org: { fontSize: 20, fontWeight: "700", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpi: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  kpiValue: { fontSize: 26, fontWeight: "700", color: colors.text },
  kpiLabel: { fontSize: 13, color: colors.muted, marginTop: 4 },
  signOut: { paddingVertical: 12, alignItems: "center" },
  signOutText: { color: colors.danger, fontWeight: "600" },
});
