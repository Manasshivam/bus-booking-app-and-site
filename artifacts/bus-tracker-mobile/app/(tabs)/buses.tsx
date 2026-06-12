import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListBuses } from "@workspace/api-client-react";
import BusCard from "@/components/BusCard";
import { useColors } from "@/hooks/useColors";

export default function BusesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fromParam = from.trim() || undefined;
  const toParam = to.trim() || undefined;

  const { data: buses, isLoading, refetch, isRefetching } = useListBuses(
    { from: fromParam, to: toParam },
    { query: { enabled: true } }
  );

  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          All Buses
        </Text>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchInput,
              {
                borderColor: colors.input,
                borderRadius: colors.radius - 2,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Feather name="map-pin" size={14} color={colors.mutedForeground} />
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="From"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            />
          </View>
          <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
          <View
            style={[
              styles.searchInput,
              {
                borderColor: colors.input,
                borderRadius: colors.radius - 2,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Feather name="navigation" size={14} color={colors.mutedForeground} />
            <TextInput
              value={to}
              onChangeText={setTo}
              placeholder="To"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={buses ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BusCard
            id={item.id}
            busNumber={item.busNumber}
            routeName={item.routeName}
            from={item.from}
            to={item.to}
            departureTime={item.departureTime}
            arrivalTime={item.arrivalTime}
            availableSeats={item.availableSeats}
            totalSeats={item.totalSeats}
            fare={item.fare}
            status={item.status as any}
          />
        )}
        scrollEnabled={!!buses && buses.length > 0}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: bottomPadding + 20,
          },
          (!buses || buses.length === 0) && styles.listEmpty,
        ]}
        ListHeaderComponent={
          buses && buses.length > 0 ? (
            <Text
              style={[styles.resultCount, { color: colors.mutedForeground }]}
            >
              {buses.length} {buses.length === 1 ? "route" : "routes"} found
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {isLoading ? "Loading routes..." : "No buses found"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {isLoading
                ? "Please wait"
                : from || to
                ? "Try clearing the search filters"
                : "No bus routes are available right now"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  list: {
    paddingTop: 16,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  resultCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
