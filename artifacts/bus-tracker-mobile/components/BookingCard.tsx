import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface BookingCardProps {
  id: number;
  busNumber: string;
  routeName: string;
  from: string;
  to: string;
  departureTime: string;
  seatNumber: string;
  seatType: string;
  journeyDate: string;
  passengerName: string;
  status: "confirmed" | "cancelled";
  onCancel?: (id: number) => void;
  isCancelling?: boolean;
}

export default function BookingCard({
  id,
  busNumber,
  routeName,
  from,
  to,
  departureTime,
  seatNumber,
  seatType,
  journeyDate,
  passengerName,
  status,
  onCancel,
  isCancelling,
}: BookingCardProps) {
  const colors = useColors();

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? Your seat will be released.",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: () => onCancel?.(id),
        },
      ]
    );
  };

  const isConfirmed = status === "confirmed";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isConfirmed ? colors.border : colors.muted,
          borderRadius: colors.radius,
          opacity: isConfirmed ? 1 : 0.7,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.busTag,
              { backgroundColor: colors.primary, borderRadius: 4 },
            ]}
          >
            <Text style={[styles.busTagText, { color: colors.primaryForeground }]}>
              {busNumber}
            </Text>
          </View>
          <Text
            style={[styles.routeName, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {routeName}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isConfirmed
                ? colors.success + "20"
                : colors.muted,
              borderRadius: 12,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: isConfirmed ? colors.success : colors.mutedForeground,
              },
            ]}
          >
            {isConfirmed ? "Confirmed" : "Cancelled"}
          </Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <Text style={[styles.village, { color: colors.foreground }]}>{from}</Text>
        <Feather name="arrow-right" size={14} color={colors.primary} />
        <Text style={[styles.village, { color: colors.foreground }]}>{to}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Feather name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.foreground }]}>
            {journeyDate}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.foreground }]}>
            {departureTime}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.foreground }]}>
            Seat {seatNumber} ({seatType})
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.passengerName, { color: colors.mutedForeground }]}>
          <Feather name="user" size={12} /> {passengerName}
        </Text>
        <Text style={[styles.bookingId, { color: colors.mutedForeground }]}>
          #{String(id).padStart(4, "0")}
        </Text>
      </View>

      {isConfirmed && onCancel && (
        <Pressable
          onPress={handleCancel}
          disabled={isCancelling}
          style={[
            styles.cancelButton,
            {
              borderColor: colors.destructive,
              borderRadius: colors.radius - 2,
              opacity: isCancelling ? 0.5 : 1,
            },
          ]}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color={colors.destructive} />
          ) : (
            <Text style={[styles.cancelText, { color: colors.destructive }]}>
              Cancel Booking
            </Text>
          )}
        </Pressable>
      )}
    </View>
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  busTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  busTagText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  routeName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  village: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passengerName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  bookingId: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  cancelButton: {
    marginTop: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  cancelText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
