import { useEffect, useState, useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import type { Reservation } from "@/lib/types";
import { colors, statusColor } from "@/theme";

export default function ReservationsScreen() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .order("check_in", { ascending: true })
      .limit(50);
    setItems((data ?? []) as Reservation[]);
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
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      data={items}
      keyExtractor={(r) => r.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <Text style={styles.empty}>No reservations yet.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.dates}>
              {item.check_in} → {item.check_out} · {item.guests_count} guest
              {item.guests_count === 1 ? "" : "s"}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: (statusColor[item.status] ?? colors.muted) + "22" },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: statusColor[item.status] ?? colors.muted },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  code: { fontSize: 15, fontWeight: "600", color: colors.text },
  dates: { fontSize: 13, color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
});
