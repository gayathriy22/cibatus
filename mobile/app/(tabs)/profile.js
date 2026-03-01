import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  apiAdminGiveLightNutrient,
  apiAdminGivePure,
  apiAdminKillPlant,
  apiAdminResetKill,
} from "@/lib/api";
import { disconnectPlant } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { getAppIconSource } from "@/lib/appIcons";
import { DUMMY_INSTALLED_APPS } from "@/lib/screenTime";
import { colors, spacing, typography } from "@/theme/tokens";

async function dummySelectTodayScreenTime(minutes) {
  await new Promise((r) => setTimeout(r, 100));
  return { ok: true };
}

function bundleIdToName(bundleId) {
  const app = DUMMY_INSTALLED_APPS.find((a) => a.bundleIdentifier === bundleId);
  return app ? app.displayName : bundleId;
}

function formatMinutesAsHoursAndMinutes(totalMinutes) {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return m > 0
    ? `${h} hr${h !== 1 ? "s" : ""} ${m} min`
    : `${h} hr${h !== 1 ? "s" : ""}`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, session } = useUserProfile();
  const queryClient = useQueryClient();
  const [todayMinutes, setTodayMinutes] = useState(60);
  const MAX_SLIDER_MINUTES = 24 * 60; // 24 hours
  const extraTop = Dimensions.get("window").height * 0.05;

  const handleSelectScreenTime = async () => {
    await dummySelectTodayScreenTime(todayMinutes);
  };
  const plantUid = profile?.plant_uid;
  const dailyGoalHours = profile?.daily_time_goal ?? 0;
  const dailyGoalMinutes = dailyGoalHours * 60;

  const handleWaterPlant = async () => {
    if (!plantUid) {
      Alert.alert("No plant", "You need a linked plant to use this action.");
      return;
    }
    if (!dailyGoalMinutes || dailyGoalMinutes <= 0) {
      Alert.alert("No goal", "Set a daily screentime goal first.");
      return;
    }
    const percent = (todayMinutes / dailyGoalMinutes) * 100;
    if (percent <= 0 || todayMinutes === 0) {
      Alert.alert("No water", "No water when screen time is 0%.");
      return;
    }
    if (percent > 100) {
      Alert.alert(
        "Over goal",
        "You've exceeded your daily goal. No water this time.",
      );
      return;
    }
    const apiFn = percent <= 50 ? apiAdminGivePure : apiAdminGiveLightNutrient;
    const label = percent <= 50 ? "Pure water" : "Pure nutrient water";
    const result = await apiFn(plantUid);
    if (result.ok) {
      Alert.alert("Done", `${label} given. ${percent}% of goal reached.`);
    } else {
      Alert.alert("Error", result.error || "Request failed.");
    }
  };

  const handleAdminAction = async (apiFn, actionLabel) => {
    if (!plantUid) {
      Alert.alert("No plant", "You need a linked plant to use this action.");
      return;
    }
    const result = await apiFn(plantUid);
    if (result.ok) {
      Alert.alert("Done", `${actionLabel} completed.`);
    } else {
      Alert.alert("Error", result.error || "Request failed.");
    }
  };
  const handleKillPlant = () =>
    handleAdminAction(apiAdminKillPlant, "Kill plant");
  const handleResetKillPlant = () =>
    handleAdminAction(apiAdminResetKill, "Reset kill");

  const handleDisconnect = async () => {
    if (!session?.user?.id) return;
    const ok = await disconnectPlant(session.user.id);
    if (ok) {
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["plant"] });
      await queryClient.invalidateQueries({ queryKey: ["plant-character"] });
      router.replace("/(onboarding)/goal");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.removeQueries({ queryKey: ["auth-session"] });
    queryClient.removeQueries({ queryKey: ["user-profile"] });
    queryClient.removeQueries({ queryKey: ["plant"] });
    queryClient.removeQueries({ queryKey: ["plant-character"] });
    queryClient.removeQueries({ queryKey: ["time-history"] });
    router.replace("/(auth)/sign-in");
  };

  const appNames = (profile?.apps_to_track ?? []).map(bundleIdToName);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, spacing.lg) + extraTop },
      ]}
    >
      <Text style={styles.title}>my profile</Text>

      <Text style={styles.sectionLabel}>personal information</Text>
      <Text style={styles.line}>
        <Text style={styles.lineLabel}>first name: </Text>
        {profile?.first_name ?? "—"}
      </Text>
      <Text style={styles.line}>
        <Text style={styles.lineLabel}>email: </Text>
        {session?.user?.email ?? "—"}
      </Text>
      <Text style={styles.line}>
        <Text style={styles.lineLabel}>password: </Text>***********
      </Text>

      <Text style={styles.line}>
        <Text style={styles.lineLabel}>daily screentime goal: </Text>
        {profile?.daily_time_goal ?? "—"} hours
      </Text>

      <Text style={styles.sectionLabel}>selected apps:</Text>
      {appNames.length > 0 ? (
        <View style={styles.appList}>
          {appNames.map((name) => {
            const iconSource = getAppIconSource(name);
            return (
              <View key={name} style={styles.appRow}>
                <View style={styles.checkbox} />
                {iconSource ? (
                  <Image
                    source={iconSource}
                    style={styles.appIcon}
                    resizeMode="contain"
                  />
                ) : null}
                <Text style={styles.appName}>{name}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.value}>—</Text>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSelectScreenTime}
        >
          <Text style={styles.actionButtonText}>
            Select today's screen time
          </Text>
          <View style={styles.sliderRow}>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${Math.min(100, (todayMinutes / MAX_SLIDER_MINUTES) * 100)}%`,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => {
                const next = Math.min(MAX_SLIDER_MINUTES, todayMinutes + 30);
                setTodayMinutes(next);
                dummySelectTodayScreenTime(next);
              }}
            >
              <Text style={styles.sliderButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => {
                const next = Math.max(0, todayMinutes - 30);
                setTodayMinutes(next);
                dummySelectTodayScreenTime(next);
              }}
            >
              <Text style={styles.sliderButtonText}>−</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sliderValue}>
            {formatMinutesAsHoursAndMinutes(todayMinutes)}
          </Text>
        </TouchableOpacity>
        <Button
          title="Water Plant"
          onPress={handleWaterPlant}
          style={styles.actionButtonSpaced}
        />
        <Button
          title="Kill Plant"
          onPress={handleKillPlant}
          style={styles.actionButtonSpaced}
        />
        <Button
          title="Reset Kill Plant"
          onPress={handleResetKillPlant}
          style={styles.actionButtonSpaced}
        />
      </View>

      <Button
        title="disconnect plant"
        onPress={handleDisconnect}
        variant="outline"
        style={styles.disconnect}
      />
      <TouchableOpacity onPress={handleSignOut} style={styles.signOutWrap}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.lg,
    textTransform: "lowercase",
  },
  sectionLabel: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  line: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  lineLabel: { fontWeight: "700" },
  value: { ...typography.body, color: colors.text },
  appList: { marginBottom: spacing.md },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    width: "100%",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.cardGreen,
    borderWidth: 1,
    borderColor: colors.cardGreenBorder,
    marginRight: spacing.md,
  },
  appIcon: { width: 24, height: 24, marginRight: spacing.sm, borderRadius: 6 },
  appName: { ...typography.body, color: colors.text, flex: 1 },
  actionButtons: { marginTop: spacing.lg },
  actionButton: {
    backgroundColor: colors.cardGreen,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardGreenBorder,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.progressTrackGreen,
    borderRadius: 4,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: colors.progressGreen,
    borderRadius: 4,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderButtonText: { fontSize: 18, color: colors.white, fontWeight: "600" },
  sliderValue: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionButtonSpaced: { marginBottom: spacing.sm },
  disconnect: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    borderColor: colors.primary,
    backgroundColor: "transparent",
    borderRadius: 9999,
  },
  signOutWrap: { alignSelf: "center", paddingVertical: spacing.sm },
  signOutText: {
    ...typography.body,
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
