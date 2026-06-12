import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetBus } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

type BusStatus = "scheduled" | "running" | "completed" | "cancelled";

export default function BusDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { id } = useLocalSearchParams<{ id: string }>();
  const busId = parseInt(id ?? "0", 10);

  const { data: bus, isLoading, error } = useGetBus(busId, {
    query: { enabled: !!busId },
  });

  const bottomPadding = isWeb ? 34 : insets.bottom;

  const handleBook = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/bus/${busId}/book`);
  };

  const handleTrack = () => {
    if (!bus) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tracking/${bus.busNumber}`);
  };

  const statusColors: Record<BusStatus, string> = {
    running: colors.success,
    scheduled: colors.primary,
    completed: colors.mutedForeground,
    cancelled: colors.destructive,
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Bus Details" }} />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !bus) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Bus Details" }} />
        <Feather name="alert-circle" size={32} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Bus not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const status = bus.status as BusStatus;
  const statusColor = statusColors[status] ?? colors.mutedForeground;
  const isBookable = status === "scheduled" || status === "running";
  const isTrackable = status === "running";

  return (
    <>
      <Stack.Screen
        options={{
          title: `Bus ${bus.busNumber}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View>
              <View
                style={[
                  styles.busNumberBadge,
                  { backgroundColor: colors.primary, borderRadius: 6 },
                ]}
              >
                <Text style={[styles.busNumberText, { color: colors.primaryForeground }]}>
                  {bus.busNumber}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20", borderRadius: 20 },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={[styles.routeName, { color: colors.mutedForeground }]}>
            {bus.routeName}
          </Text>

          <View style={styles.routeRow}>
            <View style={styles.routeEndpoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.routeCity, { color: colors.foreground }]}>
                {bus.from}
              </Text>
              <Text style={[styles.routeTime, { color: colors.mutedForeground }]}>
                {bus.departureTime}
              </Text>
            </View>
            <View style={styles.routeLineContainer}>
              <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
              <Feather name="arrow-right" size={14} color={colors.primary} />
              <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
            </View>
            <View style={[styles.routeEndpoint, { alignItems: "flex-end" }]}>
              <View style={[styles.routeDot, { backgroundColor: colors.mutedForeground }]} />
              <Text style={[styles.routeCity, { color: colors.foreground }]}>
                {bus.to}
              </Text>
              {bus.arrivalTime && (
                <Text style={[styles.routeTime, { color: colors.mutedForeground }]}>
                  {bus.arrivalTime}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Fare</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                ₹{bus.fare}
              </Text>
            </View>
            <View style={[styles.metaSep, { backgroundColor: colors.border }]} />
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Available</Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color:
                      bus.availableSeats === 0
                        ? colors.destructive
                        : bus.availableSeats < 5
                        ? colors.warning
                        : colors.success,
                  },
                ]}
              >
                {bus.availableSeats} seats
              </Text>
            </View>
            <View style={[styles.metaSep, { backgroundColor: colors.border }]} />
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Total</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {bus.totalSeats} seats
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stopsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Route Stops
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            {bus.stops?.length ?? 0} stops along this route
          </Text>

          <View style={styles.timeline}>
            {(bus.stops ?? []).map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === (bus.stops?.length ?? 0) - 1;
              const hours = Math.floor(stop.estimatedMinutes / 60);
              const mins = stop.estimatedMinutes % 60;
              const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

              return (
                <View key={stop.id} style={styles.stopRow}>
                  <View style={styles.stopLeft}>
                    <View
                      style={[
                        styles.stopDot,
                        {
                          backgroundColor:
                            isFirst || isLast ? colors.primary : colors.border,
                          borderColor: isFirst || isLast ? colors.primary : colors.mutedForeground,
                          width: isFirst || isLast ? 14 : 10,
                          height: isFirst || isLast ? 14 : 10,
                        },
                      ]}
                    />
                    {!isLast && (
                      <View
                        style={[styles.stopLine, { backgroundColor: colors.border }]}
                      />
                    )}
                  </View>
                  <View style={styles.stopContent}>
                    <Text
                      style={[
                        styles.stopName,
                        {
                          color: isFirst || isLast ? colors.foreground : colors.foreground,
                          fontFamily: isFirst || isLast ? "Inter_600SemiBold" : "Inter_400Regular",
                          fontSize: isFirst || isLast ? 15 : 14,
                        },
                      ]}
                    >
                      {stop.name}
                    </Text>
                    <Text style={[styles.stopMeta, { color: colors.mutedForeground }]}>
                      {timeLabel} from start
                      {stop.distanceKm != null ? ` · ${stop.distanceKm} km` : ""}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomActions,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPadding + 12,
          },
        ]}
      >
        {isTrackable && (
          <Pressable
            onPress={handleTrack}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: colors.primary,
                borderRadius: colors.radius,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="radio" size={16} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Track Live
            </Text>
          </Pressable>
        )}
        {isBookable && bus.availableSeats > 0 ? (
          <Pressable
            onPress={handleBook}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
                flex: isTrackable ? 1 : undefined,
              },
            ]}
          >
            <Feather name="bookmark" size={16} color={colors.primaryForeground} />
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Book a Seat
            </Text>
          </Pressable>
        ) : (
          <View
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
                flex: isTrackable ? 1 : undefined,
              },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.mutedForeground }]}>
              {bus.availableSeats === 0 ? "Fully Booked" : "Not Available"}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  backLink: { fontSize: 15, fontFamily: "Inter_500Medium" },
  heroCard: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  busNumberBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  busNumberText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  routeName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeEndpoint: { flex: 1, gap: 3 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontSize: 17, fontFamily: "Inter_700Bold" },
  routeTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  routeLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 0.6,
  },
  routeLine: { flex: 1, height: 1 },
  divider: { height: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: { flex: 1, alignItems: "center", gap: 3 },
  metaSep: { width: 1, height: 32 },
  metaLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  metaValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  stopsSection: { gap: 6 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  timeline: { marginTop: 8 },
  stopRow: { flexDirection: "row", gap: 12 },
  stopLeft: { alignItems: "center", width: 20 },
  stopDot: { borderRadius: 10, borderWidth: 2 },
  stopLine: { flex: 1, width: 2, minHeight: 32 },
  stopContent: { flex: 1, paddingBottom: 16 },
  stopName: { lineHeight: 20 },
  stopMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  primaryButton: {
    flex: 2,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  secondaryButton: {
    flex: 1,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
  },
  secondaryButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
