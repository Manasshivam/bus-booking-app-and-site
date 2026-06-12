import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCancelBooking,
  useGetBookingsByPhone,
} from "@workspace/api-client-react";
import BookingCard from "@/components/BookingCard";
import { useColors } from "@/hooks/useColors";

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");

  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  const {
    data: bookings,
    isLoading,
    refetch,
    isRefetching,
  } = useGetBookingsByPhone(submittedPhone, {
    query: {
      enabled: !!submittedPhone,
    },
  });

  const cancelMutation = useCancelBooking();

  const handleSearch = () => {
    const p = phone.trim();
    if (!p) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmittedPhone(p);
  };

  const handleCancel = (bookingId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    cancelMutation.mutate(
      { id: bookingId },
      {
        onSuccess: () => {
          refetch();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      }
    );
  };

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
          My Bookings
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          Enter your phone number to find your bookings
        </Text>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: colors.input,
                borderRadius: colors.radius - 2,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Feather name="phone" size={15} color={colors.mutedForeground} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              keyboardType="phone-pad"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
          <Pressable
            onPress={handleSearch}
            style={({ pressed }) => [
              styles.searchButton,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius - 2,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="search" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>

      {!submittedPhone ? (
        <View style={styles.emptyPrompt}>
          <Feather name="bookmark" size={40} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Find your bookings
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Enter the phone number you used when booking to see all your journeys
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BookingCard
              id={item.id}
              busNumber={item.bus.busNumber}
              routeName={item.bus.routeName}
              from={item.bus.from}
              to={item.bus.to}
              departureTime={item.bus.departureTime}
              seatNumber={item.seat.seatNumber}
              seatType={item.seat.type}
              journeyDate={item.journeyDate}
              passengerName={item.passengerName}
              status={item.status as "confirmed" | "cancelled"}
              onCancel={handleCancel}
              isCancelling={
                cancelMutation.isPending &&
                (cancelMutation.variables as { id: number })?.id === item.id
              }
            />
          )}
          scrollEnabled={!!bookings && bookings.length > 0}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPadding + 20 },
            (!bookings || bookings.length === 0) && styles.listEmpty,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather
                name={isLoading ? "loader" : "inbox"}
                size={36}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {isLoading ? "Searching..." : "No bookings found"}
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
              >
                {isLoading
                  ? "Please wait"
                  : `No bookings found for ${submittedPhone}`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  input: { flex: 1, fontSize: 15 },
  searchButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  list: { paddingTop: 16 },
  listEmpty: { flex: 1, justifyContent: "center" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
