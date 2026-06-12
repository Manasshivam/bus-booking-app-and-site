import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrackBus } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const SAMPLE_BUSES = [
  { number: "01", from: "Rampur", to: "Shivgarh" },
  { number: "12", from: "Chandpur", to: "Nayagaon" },
  { number: "08", from: "Chhatarpur", to: "Sagar" },
];

export default function TrackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [busNumber, setBusNumber] = useState("");
  const [submitted, setSubmitted] = useState("");

  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  const { data: tracking, isLoading, error } = useTrackBus(submitted, {
    query: {
      enabled: !!submitted,
      refetchInterval: 30000,
    },
  });

  const handleTrack = () => {
    const num = busNumber.trim();
    if (!num) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitted(num);
  };

  const handleFullTracking = () => {
    if (!submitted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tracking/${submitted}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding + 20, paddingBottom: bottomPadding + 20 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Track Bus</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Enter a bus number to see its live location
      </Text>

      <View style={styles.inputSection}>
        <View
          style={[
            styles.numberInputWrapper,
            {
              borderColor: submitted ? colors.primary : colors.input,
              borderRadius: colors.radius,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Text style={[styles.numberLabel, { color: colors.mutedForeground }]}>
            BUS NO.
          </Text>
          <TextInput
            value={busNumber}
            onChangeText={(v) => {
              setBusNumber(v);
              if (submitted && v !== submitted) setSubmitted("");
            }}
            placeholder="01"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.numberInput,
              { color: colors.foreground, fontFamily: "Inter_700Bold" },
            ]}
            keyboardType="numeric"
            returnKeyType="go"
            onSubmitEditing={handleTrack}
            maxLength={4}
          />
        </View>

        <Pressable
          onPress={handleTrack}
          disabled={!busNumber.trim()}
          style={({ pressed }) => [
            styles.trackButton,
            {
              backgroundColor: busNumber.trim()
                ? colors.primary
                : colors.muted,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Feather
                name="radio"
                size={18}
                color={busNumber.trim() ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.trackButtonText,
                  {
                    color: busNumber.trim()
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                  },
                ]}
              >
                Track Now
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {error && submitted && (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.destructive + "15", borderRadius: colors.radius, borderColor: colors.destructive + "30" },
          ]}
        >
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            Bus {submitted} not found. Check the number and try again.
          </Text>
        </View>
      )}

      {tracking && !isLoading && (
        <Pressable
          onPress={handleFullTracking}
          style={[
            styles.trackingCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.primary + "40",
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.trackingCardHeader}>
            <View>
              <View
                style={[
                  styles.liveIndicator,
                  { backgroundColor: colors.success + "20", borderRadius: 20 },
                ]}
              >
                <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.liveText, { color: colors.success }]}>LIVE</Text>
              </View>
            </View>
            <Feather name="arrow-right" size={16} color={colors.primary} />
          </View>

          <View style={styles.busInfoRow}>
            <View
              style={[
                styles.busNumberBadge,
                { backgroundColor: colors.primary, borderRadius: 4 },
              ]}
            >
              <Text style={[styles.busNumberText, { color: colors.primaryForeground }]}>
                {tracking.busNumber}
              </Text>
            </View>
            <Text style={[styles.routeName, { color: colors.mutedForeground }]}>
              {tracking.routeName}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.foreground }]}>
              Currently at{" "}
              <Text style={{ fontFamily: "Inter_700Bold" }}>
                {tracking.currentStop?.name}
              </Text>
            </Text>
          </View>

          {tracking.etaMinutes != null && tracking.nextStop && (
            <Text style={[styles.etaText, { color: colors.mutedForeground }]}>
              Reaching {tracking.nextStop.name} in{" "}
              <Text style={[{ color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                {tracking.etaMinutes} min
              </Text>
            </Text>
          )}

          <View
            style={[styles.progressBarTrack, { backgroundColor: colors.muted, borderRadius: 4 }]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${tracking.progressPercent}%` as any,
                  borderRadius: 4,
                },
              ]}
            />
          </View>

          <Text style={[styles.viewFull, { color: colors.primary }]}>
            View full tracking details
          </Text>
        </Pressable>
      )}

      <View style={styles.suggestionsSection}>
        <Text style={[styles.suggestionsTitle, { color: colors.mutedForeground }]}>
          Currently running
        </Text>
        <View style={styles.suggestions}>
          {SAMPLE_BUSES.map((bus) => (
            <Pressable
              key={bus.number}
              onPress={() => {
                setBusNumber(bus.number);
                setSubmitted(bus.number);
                Haptics.selectionAsync();
              }}
              style={[
                styles.suggestionChip,
                {
                  backgroundColor:
                    submitted === bus.number ? colors.primary : colors.secondary,
                  borderRadius: colors.radius - 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.suggestionNumber,
                  {
                    color:
                      submitted === bus.number
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {bus.number}
              </Text>
              <Text
                style={[
                  styles.suggestionRoute,
                  {
                    color:
                      submitted === bus.number
                        ? colors.primaryForeground + "cc"
                        : colors.mutedForeground,
                  },
                ]}
              >
                {bus.from} → {bus.to}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", marginTop: -12 },
  inputSection: { gap: 12 },
  numberInputWrapper: {
    borderWidth: 1.5,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  numberInput: { flex: 1, fontSize: 48, height: 58, textAlign: "center" },
  trackButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  trackButtonText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  trackingCard: {
    padding: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  trackingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  busInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  busNumberBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  busNumberText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  routeName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  etaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  progressBarTrack: { height: 6 },
  progressBarFill: { height: 6 },
  viewFull: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  suggestionsSection: { gap: 10 },
  suggestionsTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" as const },
  suggestions: { gap: 8 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  suggestionNumber: { fontSize: 16, fontFamily: "Inter_700Bold", minWidth: 28 },
  suggestionRoute: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
