import { eventSchema, type EventFormData } from "@/schemas/event";
import { CHACHE_KEYS } from "@/utils/keys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getItem, removeItem } from "@/utils/storage";
import { z } from "zod";
import { EVENT_CREATION_OPTIONS } from "@/components/gogo/tasks/eventCreation/options";
import {
  EVENT_CREATION_OPTIONAL_SECTIONS,
  type EventCreationSection,
} from "@/components/gogo/tasks/eventCreation/types";
import type { EventCreationConversationState } from "@/components/gogo/tasks/eventCreation/useGogoEventCreation";

const eventTypes = EVENT_CREATION_OPTIONS.map((option) => option.type);
const activeTypeKey = `${CHACHE_KEYS.eventFormKey}_active_type`;
const previousDraftKey = (type: EventFormData["registrationType"]) =>
  `${CHACHE_KEYS.eventFormKey}_${type}`;
const draftKey = (type: EventFormData["registrationType"]) =>
  `${previousDraftKey(type)}_draft`;
const sections = [
  "Date and Time",
  "Location",
  "Pricing",
  "Story",
  ...EVENT_CREATION_OPTIONAL_SECTIONS,
  "Review",
] as const satisfies readonly (EventCreationSection | "Review")[];
const conversationSchema = z.object({
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("user"), content: z.string() }),
        z.object({
          role: z.literal("assistant"),
          content: z.string(),
          choices: z.array(z.string()),
          section: z.enum(sections).nullable(),
          suggestedImpactStory: z.string().nullable(),
        }),
      ]),
    )
    .min(1)
    .refine((messages) =>
      messages.some((message) => message.role === "assistant"),
    ),
  addressedSections: z.array(z.enum(EVENT_CREATION_OPTIONAL_SECTIONS)),
}) satisfies z.ZodType<EventCreationConversationState>;

// Drafts and Gogo history can exceed SecureStore’s size limit; use the app’s
// existing AsyncStorage and retire the prior form cache only after a successful save.
// A local draft can be unfinished or invalid for publication. Preserve its text
// and blank link rows; revive the dates serialized by the form's existing cache.
const storedDraftSchema = z.object({
  ...eventSchema.shape,
  eventName: z.string(),
  description: z.string(),
  impactTitle: z.string(),
  impactDescription: z.string(),
  imgUrl: z.string().optional(),
  startDate: eventSchema.shape.startDate.optional(),
  endDate: eventSchema.shape.endDate.optional(),
  startTime: eventSchema.shape.startTime.optional(),
  endTime: eventSchema.shape.endTime.optional(),
  links: z.array(z.string()),
  creationMode: z.enum(["gogo", "manual"]).optional(),
  gogoState: conversationSchema.optional(),
});

export type SavedEventDraft = {
  values: Omit<
    EventFormData,
    "startDate" | "endDate" | "startTime" | "endTime"
  > &
    Partial<
      Pick<EventFormData, "startDate" | "endDate" | "startTime" | "endTime">
    >;
  mode: "gogo" | "manual";
  conversation?: EventCreationConversationState;
};

let pendingWrite = Promise.resolve();
function writeDraft(action: () => Promise<void>) {
  const result = pendingWrite.then(action);
  // Report failures to the caller while allowing later saves and reads to retry.
  pendingWrite = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export function hasEventDraftContent({
  values,
  conversation,
}: SavedEventDraft) {
  return Boolean(
    values.eventName.trim() ||
      values.description.trim() ||
      values.imgUrl ||
      values.location.trim() ||
      values.impactDescription.trim() ||
      values.impactTitle.trim() ||
      values.startDate ||
      values.endDate ||
      values.startTime ||
      values.endTime ||
      !values.isPhysicalEvent ||
      values.registrationFee !== undefined ||
      values.registrationAttendees !== undefined ||
      values.donationTarget !== undefined ||
      values.foodBankTotalMeals !== undefined ||
      values.foodBankSlotCapacity !== undefined ||
      values.foodBankSlotMinutes !== undefined ||
      values.donationsEnabled ||
      values.links.length ||
      values.tags.length ||
      values.tickets?.length ||
      values.volunteerRoles.length ||
      values.impactSdgGoals?.length ||
      values.impactPaths?.length ||
      values.impactCommitments?.length ||
      conversation?.messages.some((message) => message.role === "user"),
  );
}

async function deleteDraft(type: EventFormData["registrationType"]) {
  await AsyncStorage.removeItem(draftKey(type));
  await removeItem(previousDraftKey(type));
  if ((await AsyncStorage.getItem(activeTypeKey)) === type)
    await AsyncStorage.removeItem(activeTypeKey);
}

export function saveEventDraft(draft: SavedEventDraft) {
  const serialized = JSON.stringify({
    ...draft.values,
    creationMode: draft.mode,
    gogoState: draft.conversation,
  });
  const meaningful = hasEventDraftContent(draft);
  return writeDraft(async () => {
    if (!meaningful) return deleteDraft(draft.values.registrationType);
    await AsyncStorage.setItem(
      draftKey(draft.values.registrationType),
      serialized,
    );
    await removeItem(previousDraftKey(draft.values.registrationType));
    await AsyncStorage.setItem(activeTypeKey, draft.values.registrationType);
  });
}

export function discardEventDraft(type: EventFormData["registrationType"]) {
  return writeDraft(() => deleteDraft(type));
}

export async function loadEventDrafts(): Promise<SavedEventDraft[]> {
  await pendingWrite;
  const [activeType, ...cached] = await Promise.all([
    AsyncStorage.getItem(activeTypeKey),
    ...eventTypes.map(
      async (type) =>
        (await AsyncStorage.getItem(draftKey(type))) ??
        getItem(previousDraftKey(type)),
    ),
  ]);
  const active = z.enum(eventTypes).nullable().parse(activeType);
  const drafts = cached.flatMap((serialized, index) => {
    if (serialized === null) return [];
    const { creationMode, gogoState, ...values } = storedDraftSchema.parse(
      JSON.parse(serialized),
    );
    if (values.registrationType !== eventTypes[index])
      throw new Error("The saved event type does not match its draft.");
    // The existing per-type cache stores form values without Gogo metadata.
    const draft: SavedEventDraft = {
      values,
      mode: creationMode ?? "manual",
      conversation: gogoState,
    };
    return hasEventDraftContent(draft) ? [draft] : [];
  });
  return drafts.sort(
    (a, b) =>
      Number(b.values.registrationType === active) -
      Number(a.values.registrationType === active),
  );
}
