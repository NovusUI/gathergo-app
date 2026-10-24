import { useAppTheme } from "@/hooks/useAppTheme";
import CustomView from "@/components/View";
import Input from "@/components/inputs/CustomInput1";
import FormLabel from "@/components/labels/FormLabel";
import { getEventLinkMeta, isValidEventLink } from "@/constants/eventLinks";
import { Ionicons } from "@expo/vector-icons";
import { PlusIcon, Trash2Icon } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface EventLinksProps {
  links?: string[];
  onChange: (links: string[]) => void;
  error?: string;
}

const EventLinks = ({ links = [], onChange, error }: EventLinksProps) => {
  const { tw, color } = useAppTheme();
  const canAddMore = links.length < 5;

  const handleChange = (index: number, value: string) => {
    const nextLinks = [...links];
    nextLinks[index] = value;
    onChange(nextLinks);
  };

  const handleAdd = () => {
    if (!canAddMore) {
      return;
    }

    onChange([...links, ""]);
  };

  const handleRemove = (index: number) => {
    onChange(links.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <CustomView className="px-5">
      <CustomView className="gap-2">
        <FormLabel text="event links (optional)" />
        {links.length > 0 ? (
          <View style={tw`gap-3`}>
            {links.map((link, index) => {
              const meta = getEventLinkMeta(link);
              const hasTypedValue = link.trim().length > 0;
              const isInvalid = hasTypedValue && !isValidEventLink(link);

              return (
                <View
                  key={`${index}-${meta.type}`}
                  style={[
                    tw`rounded-3xl border p-3`,
                    isInvalid
                      ? tw`border-danger dark:border-[#F87171] bg-dangerSoft dark:bg-[#2B1620]`
                      : tw`border-border dark:border-[#24345A] bg-surface dark:bg-[#101C45]`,
                  ]}
                >
                  <View style={tw`mb-3 flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <View
                        style={[
                          tw`mr-3 h-10 w-10 items-center justify-center rounded-2xl`,
                          { backgroundColor: meta.backgroundColor },
                        ]}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={18}
                          color={meta.iconColor}
                        />
                      </View>
                      <View>
                        <Text
                          style={[
                            tw`text-sm font-semibold`,
                            isInvalid ? tw`text-danger dark:text-[#FCA5A5]` : tw`text-foreground dark:text-white`,
                          ]}
                        >
                          {meta.label}
                        </Text>
                        <Text
                          style={[
                            tw`text-xs`,
                            isInvalid ? tw`text-danger dark:text-[#FCA5A5]` : tw`text-muted dark:text-[#8FA1CB]`,
                          ]}
                        >
                          {isInvalid
                            ? "Enter a valid link"
                            : link.trim()
                              ? meta.host || meta.subtitle
                              : "Paste the link when you're ready"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemove(index)}
                      style={tw`rounded-full bg-surfaceMuted dark:bg-[#1B2A50] p-2`}
                    >
                      <Trash2Icon size={16} color={color("#FCA5A5", "danger")} />
                    </TouchableOpacity>
                  </View>

                  <Input
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    value={link}
                    onChangeText={(value) => handleChange(index, value)}
                    error={isInvalid ? "Invalid link" : undefined}
                  />
                </View>
              );
            })}
          </View>
        ) : null}

        <TouchableOpacity
          disabled={!canAddMore}
          onPress={handleAdd}
          style={[
            tw`mt-1 rounded-2xl border border-dashed px-4 py-4`,
            canAddMore
              ? tw`border-accent dark:border-[#0FF1CF] bg-accentFill/8 dark:bg-[#0FF1CF]/8`
              : tw`border-border dark:border-[#24345A] bg-surface dark:bg-[#0A173F]`,
          ]}
        >
          <View style={tw`flex-row items-center justify-center`}>
            <PlusIcon size={16} color={canAddMore ? color("#0FF1CF", "accent") : color("#6F7FA9", "muted")} />
            <Text
              style={[
                tw`ml-2 text-sm font-semibold`,
                canAddMore ? tw`text-accent dark:text-[#0FF1CF]` : tw`text-muted dark:text-[#6F7FA9]`,
              ]}
            >
              {canAddMore
                ? `Add link (${links.length}/5)`
                : "Maximum of 5 links reached"}
            </Text>
          </View>
        </TouchableOpacity>

        {error ? <Text style={tw`text-danger dark:text-red-500 text-xs`}>{error}</Text> : null}
      </CustomView>
    </CustomView>
  );
};

export default EventLinks;
