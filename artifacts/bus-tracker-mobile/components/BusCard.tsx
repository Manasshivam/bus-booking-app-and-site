import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

type BusStatus = "scheduled" | "running" | "completed" | "cancelled";

interface BusCardProps {
  id: number;
  busNumber: string;
  routeName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime?: string;
  availableSeats: number;
  totalSeats: number;
  fare: number;
  status: BusStatus;
  onPress?: () => void;
}

const STATUS_LABEL: Record<BusStatus, string> = {
  scheduled: "Scheduled",
  running: "Running",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function BusCard({
  id,
  busNumber,
  routeName,
  from,
  to,
  departureTime,
  arrivalTime,
  availableSeats,
  totalSeats,
  fare,
  status,
  onPress,
}: BusCardProps) {
  const colors = useColors();

  const statusColor =
    status === "running"
      ? colors.success
      : status === "scheduled"
      ? colors.primary
      : status === "cancelled"
      ? colors.destructive
      : colors.mutedForeground;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/bus/${id}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.busNumberBadge,
            { backgroundColor: colors.primary, borderRadius: colors.radius - 2 },
          ]}
        >
          <Text style={[styles.busNumber, { color: colors.primaryForeground }]}>
            {busNumber}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColor },
            ]}
          />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.routeName, { color: colors.mutedForeground }]}
        numberOfLines={1}
      >
        {routeName}
      </Text>

      <View style={styles.routeRow}>
        <Text style={[styles.village, { color: colors.foreground }]}>{from}</Text>
        <View style={styles.routeArrowContainer}>
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          <Feather name="arrow-right" size={14} color={colors.primary} />
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
        </View>
        <Text style={[styles.village, { color: colors.foreground }]}>{to}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {departureTime}
            {arrivalTime ? ` – ${arrivalTime}` : ""}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="users" size={13} color={colors.mutedForeground} />
          <Text
            style={[
              styles.metaText,
              {
                color:
                  availableSeats === 0
                    ? colors.destructive
                    : availableSeats < 5
                    ? colors.warning
                    : colors.mutedForeground,
              },
            ]}
          >
            {availableSeats} seats left
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="tag" size={13} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.foreground, fontWeight: "600" as const }]}>
            ₹{fare}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  busNumberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  busNumber: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  routeName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  village: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  routeArrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeLine: {
    width: 20,
    height: 1,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
