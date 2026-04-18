import {
  buildImpactDescription,
  clampImpactPercentage,
  DEFAULT_IMPACT_PERCENTAGE,
  EventRegistrationType,
  findImpactCause,
  IMPACT_CAUSES,
  resolveImpactPercentage,
} from "@/constants/impact";
import {
  Accessibility,
  BookOpen,
  ChevronRight,
  HandHeart,
  Handshake,
  HeartPulse,
  Home,
  Leaf,
  PawPrint,
  Search,
  Soup,
  Sparkles,
  Venus,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw, { style as twStyle } from "twrnc";
import TextArea from "../inputs/CustomTextArea";

interface ImpactSelectorProps {
  impactTitle?: string;
  impactDescription?: string;
  impactPercentage?: number;
  registrationType?: EventRegistrationType | null;
  onImpactTitleChange: (value: string) => void;
  onImpactDescriptionChange: (value: string) => void;
  onImpactPercentageChange: (value: number) => void;
}

const iconMap = {
  education: BookOpen,
  healthcare: HeartPulse,
  orphanage: Home,
  food_relief: Soup,
  women_empowerment: Venus,
  youth_development: Sparkles,
  disability_support: Accessibility,
  environment: Leaf,
  animal_welfare: PawPrint,
  community_building: Handshake,
} as const;

const IMPACT_SHARE_OPTIONS = [10, 20, 30, 40, 50, 75, 100];

const ImpactSharePicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <View>
    <View style={tw`mt-4 h-3 overflow-hidden rounded-full bg-[#08143B]`}>
      <View
        style={[tw`h-full rounded-full bg-[#0FF1CF]`, { width: `${value}%` }]}
      />
    </View>

    <View style={tw`mt-3 flex-row flex-wrap gap-2`}>
      {IMPACT_SHARE_OPTIONS.map((step) => (
        <TouchableOpacity
          key={step}
          onPress={() => onChange(step)}
          style={twStyle(
            "rounded-full border px-3 py-2",
            value === step
              ? "border-[#0FF1CF] bg-[#0FF1CF]"
              : "border-[#1F335E] bg-[#08143B]"
          )}
        >
          <Text
            style={twStyle(
              "text-xs font-semibold",
              value === step ? "text-[#03122F]" : "text-white"
            )}
          >
            {step}%
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function ImpactSelector({
  impactTitle,
  impactDescription,
  impactPercentage,
  registrationType,
  onImpactTitleChange,
  onImpactDescriptionChange,
  onImpactPercentageChange,
}: ImpactSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const isDonation = registrationType === "donation";
  const selectedCause = findImpactCause(impactTitle);
  const resolvedPercentage = resolveImpactPercentage(
    registrationType,
    impactPercentage
  );
  const impactNotePlaceholder = buildImpactDescription(
    impactTitle,
    impactDescription
  );

  const filteredCauses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return IMPACT_CAUSES;

    return IMPACT_CAUSES.filter((cause) => {
      const haystack = [
        cause.title,
        cause.description,
        ...cause.tags,
        ...cause.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search]);

  const closeModal = () => {
    setModalVisible(false);
    setSearch("");
  };

  const applyCause = (title: string, description?: string) => {
    const trimmedImpactNote = impactDescription?.trim() || "";
    const shouldReplaceImpactNote =
      !trimmedImpactNote ||
      trimmedImpactNote === selectedCause?.description ||
      trimmedImpactNote === buildImpactDescription(impactTitle, undefined);

    onImpactTitleChange(title);
    onImpactDescriptionChange(
      shouldReplaceImpactNote
        ? buildImpactDescription(title, description)
        : trimmedImpactNote
    );

    if (isDonation) {
      onImpactPercentageChange(100);
    } else if (!impactPercentage) {
      onImpactPercentageChange(DEFAULT_IMPACT_PERCENTAGE);
    }

    closeModal();
  };

  const renderCauseIcon = (causeId?: string | null) => {
    const Icon =
      iconMap[(causeId as keyof typeof iconMap) || "community_building"] ||
      HandHeart;

    return <Icon size={18} color="#0FF1CF" />;
  };

  return (
    <View style={tw`gap-4`}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
        style={tw`rounded-2xl border border-[#1D3774] bg-[#101C45] p-4`}
      >
        <View style={tw`flex-row items-start justify-between gap-3`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-xs uppercase tracking-widest text-[#7E93C7]`}>
              Impact cause
            </Text>
            <Text style={tw`mt-2 text-xs font-semibold uppercase tracking-widest text-[#0FF1CF]`}>
              {impactTitle?.trim() ? "Tap to change cause" : "Tap to choose cause"}
            </Text>
            <Text style={tw`mt-3 text-base font-semibold text-white`}>
              {impactTitle?.trim() || "Choose the cause this event supports"}
            </Text>
            <Text style={tw`mt-2 text-sm leading-5 text-[#B5C4E6]`}>
              {selectedCause?.description ||
                "Pick from common causes or create your own impact category."}
            </Text>
          </View>

          <View style={tw`items-end gap-3`}>
            <View style={tw`h-10 w-10 items-center justify-center rounded-full bg-[#0FF1CF]/10`}>
              {renderCauseIcon(selectedCause?.id)}
            </View>
            <View style={tw`flex-row items-center rounded-full bg-[#0FF1CF]/10 px-3 py-1.5`}>
              <Text style={tw`text-xs font-semibold text-[#0FF1CF]`}>
                {impactTitle?.trim() ? "Change" : "Select"}
              </Text>
              <ChevronRight size={14} color="#0FF1CF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View>
        <Text style={tw`mb-2 text-xs uppercase tracking-widest text-[#7E93C7]`}>
          Impact note
        </Text>
        <TextArea
          value={impactDescription || ""}
          onChange={onImpactDescriptionChange}
          maxLength={180}
          placeholder={impactNotePlaceholder}
          className="!bg-[#101C45]"
        />
      </View>

      {isDonation ? (
        <View style={tw`rounded-2xl bg-[#101C45] p-4`}>
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs uppercase tracking-widest text-[#7E93C7]`}>
                Impact share
              </Text>
              <Text style={tw`mt-2 text-base font-semibold text-white`}>
                100% of every donation goes to this cause
              </Text>
              <Text style={tw`mt-1 text-sm leading-5 text-[#B5C4E6]`}>
                Donation events are fully impact-led, so this stays locked at
                100%.
              </Text>
            </View>
            <View style={tw`rounded-full bg-[#0FF1CF] px-3 py-2`}>
              <Text style={tw`text-sm font-bold text-[#03122F]`}>100%</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={tw`rounded-2xl bg-[#101C45] p-4`}>
          <View style={tw`flex-row items-center justify-between gap-3`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs uppercase tracking-widest text-[#7E93C7]`}>
                Impact share
              </Text>
              <Text style={tw`mt-2 text-base font-semibold text-white`}>
                {clampImpactPercentage(resolvedPercentage)}% of earnings support
                this cause
              </Text>
              <Text style={tw`mt-1 text-sm leading-5 text-[#B5C4E6]`}>
                Choose how much of the event earnings are committed to the
                selected cause.
              </Text>
            </View>
            <View style={tw`rounded-full bg-[#0FF1CF] px-3 py-2`}>
              <Text style={tw`text-sm font-bold text-[#03122F]`}>
                {clampImpactPercentage(resolvedPercentage)}%
              </Text>
            </View>
          </View>

          <ImpactSharePicker
            value={clampImpactPercentage(resolvedPercentage)}
            onChange={onImpactPercentageChange}
          />
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={tw`flex-1 justify-end bg-black/70 px-4 py-6`}>
          <View style={tw`max-h-[88%] rounded-[30px] bg-[#041130] p-5`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-1 pr-3`}>
                <Text style={tw`text-xl font-bold text-white`}>
                  Pick an impact cause
                </Text>
                <Text style={tw`mt-2 text-sm leading-5 text-[#A7B8DE]`}>
                  Search common causes, select one, then tailor the impact note
                  in your event form.
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                style={tw`h-10 w-10 items-center justify-center rounded-full bg-[#0B173B]`}
              >
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>

            <View style={tw`mt-5 flex-row items-center rounded-2xl bg-[#0B173B] px-4`}>
              <Search size={18} color="#8EA0CA" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search education, healthcare, orphanage..."
                placeholderTextColor="#8EA0CA"
                style={tw`flex-1 py-4 pl-3 text-white`}
              />
            </View>

            <ScrollView style={tw`mt-5`} showsVerticalScrollIndicator={false}>
              {filteredCauses.map((cause) => (
                <TouchableOpacity
                  key={cause.id}
                  onPress={() => applyCause(cause.title, cause.description)}
                  style={twStyle(
                    "mb-3 rounded-2xl border p-4",
                    impactTitle?.trim().toLowerCase() ===
                      cause.title.toLowerCase()
                      ? "border-[#0FF1CF] bg-[#0FF1CF]/10"
                      : "border-[#17305D] bg-[#0A173F]"
                  )}
                >
                  <View style={tw`flex-row items-start gap-3`}>
                    <View style={tw`mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-[#0FF1CF]/10`}>
                      {renderCauseIcon(cause.id)}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-base font-semibold text-white`}>
                        {cause.title}
                      </Text>
                      <Text style={tw`mt-2 text-sm leading-5 text-[#B5C4E6]`}>
                        {cause.description}
                      </Text>
                      <View style={tw`mt-3 flex-row flex-wrap gap-2`}>
                        {cause.tags.map((tag) => (
                          <View
                            key={tag}
                            style={tw`rounded-full bg-[#132754] px-3 py-1.5`}
                          >
                            <Text style={tw`text-[11px] font-medium text-[#D8E3FF]`}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {search.trim().length > 1 && (
                <Pressable
                  onPress={() => applyCause(search.trim())}
                  style={tw`mt-2 rounded-2xl border border-dashed border-[#0FF1CF]/60 bg-[#0A173F] p-4`}
                >
                  <Text style={tw`text-sm font-semibold text-[#0FF1CF]`}>
                    {`Use "${search.trim()}" as a custom cause`}
                  </Text>
                  <Text style={tw`mt-2 text-sm leading-5 text-[#A7B8DE]`}>
                    If the list is not a fit, create your own cause and keep
                    editing the impact note below.
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
