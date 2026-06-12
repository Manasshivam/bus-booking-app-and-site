import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetBusSummary } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [fromVillage, setFromVillage] = useState("");
  const [toVillage, setToVillage] = useState("");
  const [busNumber, setBusNumber] = useState("");

  const { data: summary, isLoading, refetch, isRefetching } = useGetBusSummary();

  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const params = new URLSearchParams();
    if (fromVillage.trim()) params.set("from", fromVillage.trim());
    if (toVillage.trim()) params.set("to", toVillage.trim());
    router.push(`/buses?${params.toString()}`);
  };

  const handleTrack = () => {
    const num = busNumber.trim();
    if (!num) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/tracking/${num}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding + 20, paddingBottom: bottomPadding + 20 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <View style={[styles.logoRow]}>
          <View
            style={[
              styles.logoIcon,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <Feather name="navigation" size={20} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>BusTrack</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Know when your{"\n"}bus arrives.
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
          Book seats and track every bus in your village route
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Feather name="search" size={16} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Find a Bus
          </Text>
        </View>
        <View style={styles.inputGroup}>
          <View
            style={[
              styles.inputWrapper,
              { borderColor: colors.input, borderRadius: colors.radius - 2 },
            ]}
          >
            <Feather name="map-pin" size={14} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              value={fromVillage}
              onChangeText={setFromVillage}
              placeholder="From village"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              returnKeyType="next"
            />
          </View>
          <View
            style={[
              styles.inputWrapper,
              { borderColor: colors.input, borderRadius: colors.radius - 2 },
            ]}
          >
            <Feather name="navigation" size={14} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              value={toVillage}
              onChangeText={setToVillage}
              placeholder="To village"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>
        <Pressable
          onPress={handleSearch}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius - 2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            Search Buses
          </Text>
          <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Feather name="radio" size={16} color={colors.primaryForeground} />
          <Text style={[styles.cardTitle, { color: colors.primaryForeground }]}>
            Live Tracking
          </Text>
        </View>
        <Text
          style={[
            styles.cardSubtitle,
            { color: colors.primaryForeground, opacity: 0.8 },
          ]}
        >
          Enter a bus number to see where it is right now
        </Text>
        <View style={styles.trackRow}>
          <TextInput
            value={busNumber}
            onChangeText={setBusNumber}
            placeholder="e.g. 01, 12, 34"
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={[
              styles.trackInput,
              {
                backgroundColor: "rgba(255,255,255,0.2)",
                color: colors.primaryForeground,
                borderRadius: colors.radius - 2,
                fontFamily: "Inter_600SemiBold",
              },
            ]}
            keyboardType="numeric"
            returnKeyType="go"
            onSubmitEditing={handleTrack}
          />
          <Pressable
            onPress={handleTrack}
            style={({ pressed }) => [
              styles.trackButton,
              {
                backgroundColor: colors.primaryForeground,
                borderRadius: colors.radius - 2,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="arrow-right" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : summary ? (
        <View style={styles.statsGrid}>
          <StatCard
            icon="activity"
            label="Running Now"
            value={String(summary.runningNow)}
            color={colors.success}
            colors={colors}
          />
          <StatCard
            icon="calendar"
            label="Scheduled Today"
            value={String(summary.scheduledToday)}
            color={colors.primary}
            colors={colors}
          />
          <StatCard
            icon="users"
            label="Booked Today"
            value={String(summary.totalBookingsToday)}
            color={colors.warning}
            colors={colors}
          />
          <StatCard
            icon="grid"
            label="Seats Available"
            value={String(summary.availableSeatsTotal)}
            color={colors.mutedForeground}
            colors={colors}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Feather name={icon as any} size={18} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  heroSection: {
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  logoIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 10,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  primaryButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  trackRow: {
    flexDirection: "row",
    gap: 10,
  },
  trackInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 2,
  },
  trackButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
