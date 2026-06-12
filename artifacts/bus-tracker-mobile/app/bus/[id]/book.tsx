import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCreateBooking,
  useGetBus,
  useGetBusSeats,
} from "@workspace/api-client-react";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";

type SeatStatus = "available" | "booked" | "reserved";
type SeatType = "window" | "aisle" | "middle";

interface SeatItem {
  id: number;
  seatNumber: string;
  row: number;
  col: number;
  type: SeatType;
  status: SeatStatus;
}

export default function BookScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { id } = useLocalSearchParams<{ id: string }>();
  const busId = parseInt(id ?? "0", 10);

  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [passengerName, setPassengerName] = useState("");
  const [phone, setPhone] = useState("");
  const [journeyDate, setJourneyDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [boardingStop, setBoardingStop] = useState("");
  const [dropStop, setDropStop] = useState("");
  const [bookingDone, setBookingDone] = useState<number | null>(null);

  const bottomPadding = isWeb ? 34 : insets.bottom;

  const { data: bus } = useGetBus(busId, { query: { enabled: !!busId } });
  const { data: seats, isLoading: seatsLoading } = useGetBusSeats(busId, {
    query: { enabled: !!busId },
  });

  const booking = useCreateBooking();

  const selectedSeat = seats?.find((s) => s.id === selectedSeatId);

  const seatsByRow = seats
    ? seats.reduce<Record<number, SeatItem[]>>((acc, seat) => {
        if (!acc[seat.row]) acc[seat.row] = [];
        acc[seat.row].push(seat as SeatItem);
        return acc;
      }, {})
    : {};

  const rows = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const canBook =
    selectedSeatId !== null &&
    passengerName.trim().length > 0 &&
    phone.trim().length > 0 &&
    journeyDate.length > 0;

  const handleConfirmBooking = () => {
    if (!canBook) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    booking.mutate(
      {
        data: {
          busId,
          seatId: selectedSeatId!,
          passengerName: passengerName.trim(),
          phone: phone.trim(),
          journeyDate,
          boardingStop: boardingStop.trim() || null,
          dropStop: dropStop.trim() || null,
        },
      },
      {
        onSuccess: (data) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setBookingDone(data.id);
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },
      }
    );
  };

  if (bookingDone !== null) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Booking Confirmed" }} />
        <View
          style={[
            styles.successIcon,
            { backgroundColor: colors.success + "20", borderRadius: 60 },
          ]}
        >
          <Feather name="check-circle" size={56} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Booking Confirmed!
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Your seat {selectedSeat?.seatNumber} has been reserved.
          {"\n"}Booking ID: #{String(bookingDone).padStart(4, "0")}
        </Text>
        <Pressable
          onPress={() => router.replace("/(tabs)/bookings")}
          style={[
            styles.viewBookingsButton,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.viewBookingsText, { color: colors.primaryForeground }]}>
            View My Bookings
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.goBackButton}>
          <Text style={[styles.goBackText, { color: colors.mutedForeground }]}>
            Back to Bus Details
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Book a Seat",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding + 40 },
        ]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        {bus && (
          <View
            style={[
              styles.busInfo,
              { backgroundColor: colors.secondary, borderRadius: colors.radius },
            ]}
          >
            <View
              style={[styles.busTag, { backgroundColor: colors.primary, borderRadius: 4 }]}
            >
              <Text style={[styles.busTagText, { color: colors.primaryForeground }]}>
                {bus.busNumber}
              </Text>
            </View>
            <Text style={[styles.busRoute, { color: colors.foreground }]}>
              {bus.from} → {bus.to}
            </Text>
            <Text style={[styles.busFare, { color: colors.mutedForeground }]}>
              ₹{bus.fare} · Departs {bus.departureTime}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Select Seat
          </Text>
          <View style={styles.seatLegend}>
            {[
              { color: colors.card, border: colors.border, label: "Available" },
              { color: colors.primary, border: colors.primary, label: "Selected" },
              { color: colors.muted, border: colors.border, label: "Booked" },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: item.color,
                      borderColor: item.border,
                      borderRadius: 3,
                    },
                  ]}
                />
                <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.busShape,
              {
                backgroundColor: colors.secondary,
                borderRadius: colors.radius,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.busDriver,
                { borderBottomColor: colors.border },
              ]}
            >
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <Text style={[styles.busDriverText, { color: colors.mutedForeground }]}>
                Driver
              </Text>
            </View>

            {seatsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ margin: 24 }} />
            ) : (
              rows.map((rowNum) => {
                const rowSeats = (seatsByRow[rowNum] ?? []).sort(
                  (a, b) => a.col - b.col
                );
                return (
                  <View key={rowNum} style={styles.seatRow}>
                    {rowSeats.map((seat, colIdx) => {
                      const isSelected = seat.id === selectedSeatId;
                      const isBooked =
                        seat.status === "booked" || seat.status === "reserved";
                      const isAisle = colIdx === 1;

                      return (
                        <React.Fragment key={seat.id}>
                          {isAisle && (
                            <View style={styles.aisleGap} />
                          )}
                          <Pressable
                            onPress={() => {
                              if (isBooked) return;
                              Haptics.selectionAsync();
                              setSelectedSeatId(
                                isSelected ? null : seat.id
                              );
                            }}
                            style={[
                              styles.seat,
                              {
                                backgroundColor: isBooked
                                  ? colors.muted
                                  : isSelected
                                  ? colors.primary
                                  : colors.card,
                                borderColor: isBooked
                                  ? colors.border
                                  : isSelected
                                  ? colors.primary
                                  : colors.border,
                                borderRadius: 4,
                                opacity: isBooked ? 0.5 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.seatLabel,
                                {
                                  color: isBooked
                                    ? colors.mutedForeground
                                    : isSelected
                                    ? colors.primaryForeground
                                    : colors.foreground,
                                },
                              ]}
                            >
                              {seat.seatNumber}
                            </Text>
                          </Pressable>
                        </React.Fragment>
                      );
                    })}
                  </View>
                );
              })
            )}
          </View>

          {selectedSeat && (
            <View
              style={[
                styles.seatInfo,
                {
                  backgroundColor: colors.primary + "15",
                  borderColor: colors.primary + "40",
                  borderRadius: colors.radius - 2,
                },
              ]}
            >
              <Feather name="check-circle" size={15} color={colors.primary} />
              <Text style={[styles.seatInfoText, { color: colors.primary }]}>
                Seat {selectedSeat.seatNumber} selected ({selectedSeat.type} seat)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Passenger Details
          </Text>

          <InputField
            label="Passenger Name"
            value={passengerName}
            onChangeText={setPassengerName}
            placeholder="Full name"
            icon="user"
            colors={colors}
            autoComplete="name"
            returnKeyType="next"
          />
          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Mobile number"
            icon="phone"
            colors={colors}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
          <InputField
            label="Journey Date"
            value={journeyDate}
            onChangeText={setJourneyDate}
            placeholder="YYYY-MM-DD"
            icon="calendar"
            colors={colors}
            returnKeyType="next"
          />
          <InputField
            label="Boarding Stop (optional)"
            value={boardingStop}
            onChangeText={setBoardingStop}
            placeholder="Village where you board"
            icon="map-pin"
            colors={colors}
            returnKeyType="next"
          />
          <InputField
            label="Drop Stop (optional)"
            value={dropStop}
            onChangeText={setDropStop}
            placeholder="Village where you get off"
            icon="navigation"
            colors={colors}
            returnKeyType="done"
          />
        </View>

        {booking.isError && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.destructive + "10",
                borderColor: colors.destructive + "30",
                borderRadius: colors.radius - 2,
              },
            ]}
          >
            <Feather name="alert-circle" size={15} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              Booking failed. The seat may have been taken. Please select another.
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleConfirmBooking}
          disabled={!canBook || booking.isPending}
          style={({ pressed }) => [
            styles.confirmButton,
            {
              backgroundColor: canBook ? colors.primary : colors.muted,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {booking.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Feather
                name="check"
                size={18}
                color={canBook ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.confirmButtonText,
                  {
                    color: canBook
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                  },
                ]}
              >
                Confirm Booking
              </Text>
            </>
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  colors,
  keyboardType,
  returnKeyType,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: string;
  colors: ReturnType<typeof useColors>;
  keyboardType?: "default" | "phone-pad" | "numeric" | "email-address";
  returnKeyType?: "done" | "next" | "search" | "go";
  autoComplete?: "name" | "email" | "tel" | "off";
}) {
  return (
    <View style={inputStyles.field}>
      <Text style={[inputStyles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View
        style={[
          inputStyles.wrapper,
          { borderColor: colors.input, borderRadius: colors.radius - 2 },
        ]}
      >
        <Feather name={icon as any} size={15} color={colors.mutedForeground} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[
            inputStyles.input,
            { color: colors.foreground, fontFamily: "Inter_400Regular" },
          ]}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          autoComplete={autoComplete}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20 },
  busInfo: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  busTag: { paddingHorizontal: 8, paddingVertical: 3 },
  busTagText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  busRoute: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  busFare: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  seatLegend: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 14, height: 14, borderWidth: 1.5 },
  legendLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  busShape: {
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  busDriver: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 6,
    marginBottom: 4,
  },
  busDriverText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  seatRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  aisleGap: { width: 16 },
  seat: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  seatLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  seatInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderWidth: 1,
  },
  seatInfoText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  confirmButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmButtonText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  successIcon: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  successSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  viewBookingsButton: {
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  viewBookingsText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  goBackButton: { padding: 8 },
  goBackText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});

const inputStyles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  input: { flex: 1, fontSize: 15 },
});
