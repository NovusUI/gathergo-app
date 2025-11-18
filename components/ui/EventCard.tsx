import { Registration } from "@/types/auth";
import { formatShortDate } from "@/utils/dateTimeHandler";
import { numberWithCommas } from "@/utils/utils";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

interface EventCardProps {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  thumbnailUrl?: string;
  registrationType: Registration;
  registrationFee?: number;
  startDate: string;
  onPress?: () => void;
}

export default function EventCard({
  id,
  title,
  location,
  imageUrl,
  thumbnailUrl,
  registrationType,
  registrationFee,
  startDate,
  onPress,
}: EventCardProps) {
  useEffect(() => {
    console.log(startDate, "startdate");
    console.log(formatShortDate(startDate));
  }, [startDate]);

  return (
    <TouchableOpacity
      key={id}
      onPress={onPress}
      style={tw`flex-row items-center bg-[#01082e] rounded-xl p-5 max-h-28`}
    >
      {imageUrl ? (
        <View style={tw`w-[91px] h-[84px] rounded-lg overflow-hidden relative`}>
          <Image
            source={imageUrl}
            placeholder={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
            cachePolicy="disk"
            style={{ width: 91, height: 84, borderRadius: 8 }}
            contentFit="cover"
            transition={500}
          />
          <View
            style={tw`absolute top-1 left-1 p-1 bg-[#0FF1CF]/80 rounded-t-lg rounded-br-lg`}
          >
            <Text style={tw`text-white text-xs`}>
              {formatShortDate(startDate)}
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={tw`w-20 h-20 rounded-lg bg-slate-300 flex justify-center items-center`}
        >
          <Text style={tw`-rotate-45 text-slate-400 text-xs`}>
            Party Animal
          </Text>
        </View>
      )}

      <View style={tw`ml-4 flex-1 flex flex-col justify-between h-full`}>
        <Text style={tw`text-white font-semibold text-lg`}>{title}</Text>

        <View style={tw`flex-row justify-between`}>
          <View style={tw`flex-row gap-3`}>
            <View style={tw`p-2 bg-[#0FF1CF]/10 rounded-lg`}>
              <Text style={tw`text-[#0FF1CF]`}>Direction</Text>
            </View>
            <View style={tw`p-2 bg-[#0FF1CF]/10 rounded-lg`}>
              <Text style={tw`text-[#0FF1CF]`}>Share</Text>
            </View>
          </View>
          <View style={tw`p-2 bg-[#0FF1CF]/10 rounded-lg`}>
            <Text style={tw`text-[#0FF1CF]`}>
              {registrationType === "ticket"
                ? "Tickets"
                : numberWithCommas(registrationFee, true, null)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
