import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

type AvatarGroupProps = {
  avatars?: string[];
  onAdd?: () => void;
};

export default function AvatarGroup({ avatars = [], onAdd }: AvatarGroupProps) {
  // fallback dummy avatar
  const dummy =
    "https://randomuser.me/api/portraits/women/68.jpg";

  return (
    <View className="flex-row items-center">
      {(avatars.length ? avatars : [dummy, dummy, dummy, dummy]).map(
        (uri, index) => (
          <View
            key={index}
            className="w-10 h-10 rounded-full border-2 border-[#0D1136] overflow-hidden"
            style={{ marginLeft: index === 0 ? 0 : -12 }} // overlap
          >
            <Image
              source={{ uri }}
              
              contentFit="cover"
              transition={300}
              style={{width:"100%",height:"100%"}}
              cachePolicy="disk"  
            />
          </View>
        )
      )}

      {/* Add/Share button */}
      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.7}
        className="w-10 h-10 rounded-full border-2 border-teal-400 items-center justify-center bg-transparent"
        style={{ marginLeft: (avatars.length ? avatars.length : 4) > 0 ? -12 : 0 }}
      >
        <Plus size={28} color="#2DD4BF" />
      </TouchableOpacity>
    </View>
  );
}
