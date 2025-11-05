import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

type AvatarGroupProps = {
  avatars?: any;
  onAdd?: () => void;
  owner?: boolean;
};

export default function AvatarGroup({
  avatars = [],
  onAdd,
  owner = false,
}: AvatarGroupProps) {
  // fallback dummy avatar

  const filtered = avatars.filter((avatar: any) =>
    ["PENDING", "ACCEPTED"].includes(avatar.status)
  );
  const avatarToShow = owner ? filtered : filtered.slice(0, 2);
  const requests = avatars.filter((avatar: any) => avatar.status === "PENDING");

  const poolerRequestUI = requests.length && owner;

  return (
    <View className="flex-row items-center ">
      {avatarToShow.map((avatar: any, index: number) => (
        <View
          key={index}
          className={`flex justify-center items-center w-10 h-10 rounded-full border-2 ${avatar.status === "PENDING" ? "border-2 border-teal-400" : ""} overflow-hidden `}
          style={{ marginLeft: index === 0 ? 0 : -12 }} // overlap
        >
          {avatar.profilePicUrlTN ? (
            <Image
              source={{ uri: avatar.profilePicUrlTN }}
              contentFit="cover"
              transition={300}
              style={{ width: "100%", height: "100%" }}
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
        className={`w-10 h-10 rounded-full border-2 border-teal-400 ${poolerRequestUI ? "!bg-teal-400" : "!bg-[#030A31]"} items-center justify-center bg-transparent`}
        style={{
          marginLeft:
            (avatarToShow.length ? avatarToShow.length : 4) > 0 ? -12 : 0,
        }}
      >
        {poolerRequestUI ? (
          <Text className="text-white text-2xl font-black">
            {requests.length}
          </Text>
        ) : (
          <Plus size={28} color="#2DD4BF" />
        )}
      </TouchableOpacity>
    </View>
  );
}
