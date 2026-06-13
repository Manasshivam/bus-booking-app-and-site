import { Feather } from "@expo/vector-icons";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTrackBus } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

type TrackingStop = {
  id: number;
  name: string;
  order: number;
  estimatedMinutes: number;
};

type TrackingData = {
  busNumber: string;
  routeName: string;
  from: string;
  to: string;
  status: string;
  progressPercent: number;
  lastUpdated: string;
  etaMinutes?: number | null;
  currentStop?: TrackingStop;
  nextStop?: TrackingStop;
};

export default function TrackingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { busNumber } = useLocalSearchParams<{ busNumber: string }>();

  const bottomPadding = isWeb ? 34 : insets.bottom;

  const { data: tracking, isLoading, error } = useTrackBus(
    busNumber ?? "",
    {
      query: {
        enabled: !!busNumber,
        refetchInterval: 30000,
      },
    }
  ) as { data: TrackingData | undefined; isLoading: boolean; error: unknown; dataUpdatedAt: number };

  const progressWidth = useSharedValue(0);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
  }));

  if (tracking) {
    progressWidth.value = withSpring(tracking.progressPercent, {
      damping: 20,
      stiffness: 80,
    });
  }

  const statusColors: Record<string, string> = {
    running: colors.success,
    scheduled: colors.primary,
    completed: colors.mutedForeground,
    cancelled: colors.destructive,
  };
  const statusColor = statusColors[tracking?.status ?? ""] ?? colors.mutedForeground;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Live Tracking" }} />
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Locating bus {busNumber}...
        </Text>
      </View>
    );
  }

  if (error || !tracking) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Live Tracking" }} />
        <Feather name="wifi-off" size={36} color={colors.mutedForeground} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>
          Bus {busNumber} not found
        </Text>
        <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
          Check the bus number and try again
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.backButtonText, { color: colors.primaryForeground }]}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const lastUpdated = new Date(tracking.lastUpdated);
  const lastUpdatedLabel = lastUpdated.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: `Bus ${tracking.busNumber}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <View
                style={[
                  styles.busTag,
                  { backgroundColor: colors.primary, borderRadius: 6 },
                ]}
              >
                <Text style={[styles.busTagText, { color: colors.primaryForeground }]}>
                  {tracking.busNumber}
                </Text>
              </View>
            </View>
            <View style={styles.liveChip}>
              {tracking.status === "running" && (
                <>
                  <View
                    style={[styles.liveDot, { backgroundColor: colors.success }]}
                  />
                  <Text style={[styles.liveText, { color: colors.success }]}>
                    LIVE
                  </Text>
                </>
              )}
              {tracking.status !== "running" && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusColor + "20",
                      borderRadius: 12,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {tracking.status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.routeName, { color: colors.mutedForeground }]}>
            {tracking.routeName}
          </Text>
          <View style={styles.routeEndpoints}>
            <Text style={[styles.endpointText, { color: colors.foreground }]}>
              {tracking.from}
            </Text>
            <Feather name="arrow-right" size={14} color={colors.primary} />
            <Text style={[styles.endpointText, { color: colors.foreground }]}>
              {tracking.to}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.currentLocation}>
            <Feather name="map-pin" size={18} color={colors.primary} />
            <View style={styles.currentLocationText}>
              <Text style={[styles.currentLabel, { color: colors.mutedForeground }]}>
                Currently at
              </Text>
              <Text style={[styles.currentStop, { color: colors.foreground }]}>
                {tracking.currentStop?.name}
              </Text>
            </View>
          </View>

          {tracking.nextStop && (
            <View style={styles.nextStopRow}>
              <Feather name="navigation" size={14} color={colors.mutedForeground} />
              <Text style={[styles.nextStopText, { color: colors.mutedForeground }]}>
                Next stop:{" "}
                <Text style={[{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {tracking.nextStop.name}
                </Text>
                {tracking.etaMinutes != null && (
                  <Text style={{ color: colors.primary }}>
                    {" "}
                    in {tracking.etaMinutes} min
                  </Text>
                )}
              </Text>
            </View>
          )}

          <View style={styles.progressSection}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.muted, borderRadius: 6 },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 6,
                  },
                  animatedProgressStyle,
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {tracking.from}
              </Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>
                {Math.round(tracking.progressPercent)}%
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  { color: colors.mutedForeground, textAlign: "right" },
                ]}
              >
                {tracking.to}
              </Text>
            </View>
          </View>

          <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
            Updated at {lastUpdatedLabel} · Auto-refreshes every 30s
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          All Stops
        </Text>

        <View
          style={[
            styles.stopsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          {tracking.currentStop &&
            buildStopsList(tracking).map((stop, index, arr) => {
              const isCurrent = stop.id === tracking.currentStop?.id;
              const isPassed =
                tracking.currentStop &&
                stop.order < tracking.currentStop.order;
              const isLast = index === arr.length - 1;

              return (
                <View key={stop.id} style={styles.stopRow}>
                  <View style={styles.stopLeft}>
                    <View
                      style={[
                        styles.stopDot,
                        {
                          backgroundColor: isCurrent
                            ? colors.primary
                            : isPassed
                            ? colors.success
                            : colors.border,
                          borderColor: isCurrent
                            ? colors.primary
                            : isPassed
                            ? colors.success
                            : colors.mutedForeground,
                          width: isCurrent ? 16 : 12,
                          height: isCurrent ? 16 : 12,
                          borderRadius: 8,
                        },
                      ]}
                    />
                    {!isLast && (
                      <View
                        style={[
                          styles.stopLine,
                          {
                            backgroundColor: isPassed
                              ? colors.success
                              : colors.border,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={[styles.stopContent, isLast && styles.stopContentLast]}>
                    <View style={styles.stopNameRow}>
                      <Text
                        style={[
                          styles.stopName,
                          {
                            color: isCurrent ? colors.primary : colors.foreground,
                            fontFamily: isCurrent
                              ? "Inter_700Bold"
                              : "Inter_400Regular",
                            fontSize: isCurrent ? 16 : 14,
                          },
                        ]}
                      >
                        {stop.name}
                      </Text>
                      {isCurrent && (
                        <View
                          style={[
                            styles.hereBadge,
                            {
                              backgroundColor: colors.primary,
                              borderRadius: 10,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.hereText,
                              { color: colors.primaryForeground },
                            ]}
                          >
                            HERE
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.stopTime, { color: colors.mutedForeground }]}
                    >
                      {isPassed
                        ? "Passed"
                        : isCurrent
                        ? "Current location"
                        : `~${formatMinutes(stop.estimatedMinutes)} from start`}
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      </ScrollView>
    </>
  );
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function buildStopsList(tracking: TrackingData): TrackingStop[] {
  if (!tracking) return [];
  const stops: TrackingStop[] = [];
  if (tracking.currentStop) {
    stops.push(tracking.currentStop);
  }
  if (tracking.nextStop) {
    stops.push(tracking.nextStop);
  }
  return stops;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  errorSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  headerCard: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  busTag: { paddingHorizontal: 12, paddingVertical: 6 },
  busTagText: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  routeName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  routeEndpoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  endpointText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1 },
  currentLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currentLocationText: { gap: 2 },
  currentLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  currentStop: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  nextStopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextStopText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  progressSection: { gap: 6 },
  progressTrack: { height: 10, overflow: "hidden" },
  progressFill: { height: "100%" },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  progressPct: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  lastUpdated: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 2,
  },
  stopsCard: {
    padding: 16,
    borderWidth: 1,
  },
  stopRow: { flexDirection: "row", gap: 12 },
  stopLeft: { alignItems: "center", width: 20, paddingTop: 2 },
  stopLine: { flex: 1, width: 2, minHeight: 28 },
  stopContent: { flex: 1, paddingBottom: 18 },
  stopContentLast: { paddingBottom: 0 },
  stopNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stopName: { lineHeight: 20 },
  hereBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  hereText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  stopTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
