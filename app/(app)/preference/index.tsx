import { useAppTheme } from "@/hooks/useAppTheme";
import { getApiErrorMessage } from "@/utils/apiError";
import { GogoInterestSetup } from "@/components/gogo/tasks/interestMap/GogoInterestSetup";
import { InterestMap } from "@/components/gogo/tasks/interestMap/InterestMap";
import { MascotMoment } from "@/components/gogo/mascot/MascotMoment";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomButton from "@/components/buttons/CustomBtn1";
import CustomSwitcher from "@/components/CustomSwitcher";
import ImpactPageLoader from "@/components/ui/ImpactPageLoader";
import { useAuth } from "@/context/AuthContext";
import {
  useDeleteInterestMap,
  useResetInterestLearning,
  useSavePreferences,
} from "@/services/mutations";
import { useInterestCatalog, useInterestProfile } from "@/services/queries";
import type { SaveInterestProfile } from "@/types/preferences";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { safeGoBack, useLockedRouter } from "@/utils/navigation";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function PreferencesScreen() {
  const { tw } = useAppTheme();
  const { user, setUser } = useAuth();
  const router = useLockedRouter();
  const firstTime = !user?.hasPreferences;
  const [editing, setEditing] = useState(firstTime);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const catalog = useInterestCatalog();
  const profile = useInterestProfile();
  const save = useSavePreferences({
    onSuccess: () => {
      if (user) setUser({ ...user, hasPreferences: true });
      if (firstTime) router.replace("/");
      else {
        setEditing(false);
        showGlobalSuccess("Your map is updated");
      }
    },
    onError: (error) =>
      showGlobalError(
        getApiErrorMessage(error, "Couldn’t save your map. Please try again."),
      ),
  });
  const reset = useResetInterestLearning({
    onError: (error) =>
      showGlobalError(
        getApiErrorMessage(
          error,
          "Couldn’t reset learned interests. Please try again.",
        ),
      ),
  });
  const remove = useDeleteInterestMap({
    onSuccess: () => {
      setConfirmDelete(false);
      showGlobalSuccess("Your map has been deleted");
    },
    onError: (error) =>
      showGlobalError(
        getApiErrorMessage(
          error,
          "Couldn’t delete your map. Please try again.",
        ),
      ),
  });
  const pending = save.isPending || reset.isPending || remove.isPending;
  const persist = (data: SaveInterestProfile) => {
    if (!pending) save.mutate(data);
  };
  const skipSetup = firstTime ? (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={pending}
      onPress={() =>
        persist({
          interests: [],
          helpModes: [],
          city: "",
          likedEventIds: [],
          learningEnabled: false,
        })
      }
      style={tw`min-h-11 items-center justify-center p-4`}
    >
      <Text style={tw`text-secondary dark:text-[#AFC0F4]`}>
        {save.isPending ? "Saving…" : "Skip setup"}
      </Text>
    </TouchableOpacity>
  ) : null;
  if (catalog.isPending || profile.isPending)
    return (
      <View style={tw`flex-1 bg-background dark:bg-[#01082E] pt-12`}>
        <ImpactPageLoader title="Finding what fits you" />
        {skipSetup}
      </View>
    );
  if (catalog.isError || profile.isError)
    return (
      <View style={tw`flex-1 bg-background dark:bg-[#01082E] px-5 justify-center gap-5`}>
        <MascotMoment
          variant="error"
          layout="stacked"
          title="Let’s try that again"
          message="I couldn’t load your map."
          typing={false}
        />
        <CustomButton
          title="Try again"
          showArrow={false}
          onPress={() => {
            void catalog.refetch();
            void profile.refetch();
          }}
          buttonClassName="bg-accentFill dark:bg-[#0FF1CF] w-full"
        />
        {skipSetup}
      </View>
    );
  return (
    <View style={tw`flex-1 bg-background dark:bg-[#01082E] pt-12`}>
      {editing ? (
        <GogoInterestSetup
          catalog={catalog.data.data}
          profile={profile.data.data}
          firstTime={firstTime}
          pending={pending}
          onSave={persist}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <View style={tw`px-5`}>
            <CustomeTopBarNav
              title="Your impact map"
              onClickBack={() => safeGoBack(router, "/settings")}
            />
          </View>
          <ScrollView contentContainerStyle={tw`px-5 pb-10 gap-4`}>
            <InterestMap
              topics={profile.data.data.weights}
              weights={profile.data.data.weights}
            />
            <Text style={tw`text-center text-xl font-semibold text-foreground dark:text-white`}>
              {profile.data.data.weights.length
                ? "A little more you."
                : "A fresh start."}
            </Text>
            <Text style={tw`text-center text-sm text-secondary dark:text-[#AFC0F4]`}>
              {profile.data.data.weights.length
                ? "Bigger rings show stronger interests."
                : "Explore freely, or give Gogo a few interests to start with."}
            </Text>
            {profile.data.data.weights.map((weight) => (
              <View
                key={weight.id}
                style={tw`flex-row justify-between items-center rounded-2xl bg-surface dark:bg-[#101C45] p-4`}
              >
                <Text style={tw`text-foreground dark:text-white font-semibold`}>{weight.label}</Text>
                <Text style={tw`text-xs text-secondary dark:text-[#AFC0F4]`}>
                  {weight.source === "chosen"
                    ? "You chose this"
                    : weight.source === "both"
                      ? "Chosen + activity"
                      : "From your activity"}
                </Text>
              </View>
            ))}
            <CustomButton
              title="Tune my map"
              showArrow={false}
              onPress={() => setEditing(true)}
              disabled={pending}
              buttonClassName="w-full bg-accentFill dark:bg-[#0FF1CF] border-0"
              textClassName="!text-onAccent dark:text-[#01082E]"
            />
            <View style={tw`rounded-2xl bg-surface dark:bg-[#101C45] p-4 gap-3`}>
              <Text style={tw`text-foreground dark:text-white font-semibold`}>
                Learn from event activity
              </Text>
              <View style={tw`flex-row items-center justify-between gap-4`}>
                <Text style={tw`text-sm text-secondary dark:text-[#AFC0F4] flex-1`}>
                  Use views and participation to tune your feed.
                </Text>
                <CustomSwitcher
                  isEnabled={profile.data.data.learningEnabled}
                  setIsEnabled={(enabled) => {
                    if (!pending)
                      persist({
                        interests: profile.data.data.interests.slice(0, 5),
                        helpModes: profile.data.data.helpModes,
                        city: profile.data.data.city ?? "",
                        likedEventIds: [],
                        learningEnabled: enabled,
                      });
                  }}
                />
              </View>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={pending}
              onPress={() => reset.mutate()}
              style={tw`p-4 items-center`}
            >
              <Text style={tw`text-secondary dark:text-[#AFC0F4]`}>
                {reset.isPending ? "Resetting…" : "Reset learned interests"}
              </Text>
            </TouchableOpacity>
            {confirmDelete ? (
              <View
                style={tw`rounded-2xl border border-[#6B2A50] bg-surface dark:bg-[#241535] p-4 gap-3`}
              >
                <Text style={tw`text-foreground dark:text-white font-semibold`}>
                  Delete your map?
                </Text>
                <Text style={tw`text-sm text-secondary dark:text-[#AFC0F4]`}>
                  This clears your choices and learned interests, and turns off
                  activity learning.
                </Text>
                <View style={tw`flex-row justify-around`}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={pending}
                    onPress={() => setConfirmDelete(false)}
                    style={tw`p-3`}
                  >
                    <Text style={tw`text-foreground dark:text-white`}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={pending}
                    onPress={() => remove.mutate()}
                    style={tw`p-3`}
                  >
                    <Text style={tw`text-danger dark:text-[#FF8A8A]`}>
                      {remove.isPending ? "Deleting…" : "Delete map"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={pending}
                onPress={() => setConfirmDelete(true)}
                style={tw`p-4 items-center`}
              >
                <Text style={tw`text-danger dark:text-[#FF8A8A]`}>Delete my map</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}
