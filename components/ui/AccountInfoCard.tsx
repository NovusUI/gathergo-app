import { useAppTheme } from "@/hooks/useAppTheme";
import CustomView from "@/components/View";
import { Copy } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AccountInfoCardProps {
  accountInfo: string;
}

const AccountInfoCard = ({ accountInfo }: AccountInfoCardProps) => {
  const { tw, color } = useAppTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Copy to clipboard
    // navigator.clipboard.writeText(accountInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CustomView
      style={tw`w-full border-accent dark:border-[#0FF1CF] border-[1px] rounded-xl p-3 bg-surfaceMuted dark:bg-[#1B2A50]`}
    >
      <TouchableOpacity
        style={tw`flex-row items-center justify-between`}
        onPress={handleCopy}
      >
        <View style={tw`flex-1`}>
          <Text style={tw`text-muted dark:text-gray-400 text-xs mb-1`}>Event Account</Text>
          <Text style={tw`text-foreground dark:text-white text-base font-medium`}>
            {accountInfo}
          </Text>
        </View>
        <View style={tw`flex-row items-center`}>
          {copied ? (
            <Text style={tw`text-accent dark:text-[#0FF1CF] text-sm mr-2`}>Copied!</Text>
          ) : null}
          <Copy color={color("white", "foreground")} size={20} />
        </View>
      </TouchableOpacity>
    </CustomView>
  );
};

export default AccountInfoCard;
