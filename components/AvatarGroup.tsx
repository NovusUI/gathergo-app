import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type AvatarGroupProps = {
  avatars?: any[];
  onAdd?: () => void;
  owner?: boolean;
};

export default function AvatarGroup({
  avatars = [],
  onAdd,
  owner = false,
}: AvatarGroupProps) {
  const filtered = avatars.filter((avatar) =>
    ["PENDING", "ACCEPTED"].includes(avatar.status)
  );
  const avatarToShow = owner ? filtered : filtered.slice(0, 2);
  const requests = avatars.filter((avatar) => avatar.status === "PENDING");
  const poolerRequestUI = requests.length && owner;

  return (
    <View style={tw`flex-row items-center`}>
      {avatarToShow.map((avatar, index) => (
        <View
          key={index}
          style={[
            tw`flex justify-center items-center w-10 h-10 rounded-full border-2 overflow-hidden`,
            avatar.status === "PENDING" && tw`border-teal-400`,
            { marginLeft: index === 0 ? 0 : -12 },
          ]}
        >
          {avatar.profilePicUrlTN ? (
            <Image
              source={{ uri: avatar.profilePicUrlTN }}
              contentFit="cover"
              transition={300}
              style={tw`w-full h-full`}
              cachePolicy="disk"
            />
          ) : (
            <Feather name="user" color="teal" size={20} />
          )}
        </View>
      ))}

      {/* Add/Share button */}
      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.7}
        style={[
          tw`w-10 h-10 rounded-full border-2 items-center justify-center`,
          poolerRequestUI
            ? tw`bg-teal-400 border-teal-400`
            : tw`bg-[#030A31] border-teal-400`,
          {
            marginLeft:
              (avatarToShow.length ? avatarToShow.length : 4) > 0 ? -12 : 0,
          },
        ]}
      >
        {poolerRequestUI ? (
          <Text style={tw`text-white text-2xl font-black`}>
            {requests.length}
          </Text>
        ) : (
          <Plus size={28} color="#2DD4BF" />
        )}
      </TouchableOpacity>
    </View>
  );
}
