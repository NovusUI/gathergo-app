import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import ChatInput from "@/components/inputs/ChatInput";
import ChatView1 from "@/components/ui/ChatView1";
import OverlappingImages from "@/components/ui/OverlappingImages";
import UserChatView from "@/components/ui/UserChatView";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

const ChatPage = () => {
  const router = useRouter();
  return (
    <View className="flex-1 pt-20  bg-[#01082E] flex flex-col items-center w-full">
      <CustomView className="flex-1 ">
        <CustomView className="px-3 flex-row justify-between items-center relative">
          <CustomeTopBarNav title="Chat" onClickBack={() => router.back()} />
          <OverlappingImages
            images={[
              require("../../../assets/animoji.png"),
              require("../../../assets/animoji.png"),
              require("../../../assets/animoji.png"),
              require("../../../assets/animoji.png"),
            ]}
            className="absolute right-4"
          />
        </CustomView>
        <View className="h-[1px] w-full bg-white my-5"></View>

        <ScrollView className="gap-3 flex-col w-full max-w-[500px">
          <CustomView className="flex-1 p-3 gap-3 ">
            <UserChatView message="This is the madafokn admin" time="14:50" />
            <ChatView1
              message="Hey modafokn admin!! "
              time="14:51"
              imageUrl={require("../../../assets/animoji.png")}
            />
            <UserChatView message="This is the madafokn admin" time="14:50" />
            <ChatView1
              message="Hey modafokn admin!! "
              time="14:51"
              imageUrl={require("../../../assets/animoji.png")}
            />
            <UserChatView message="This is the madafokn admin" time="14:50" />
            <ChatView1
              message="Hey modafokn admin!! "
              time="14:51"
              imageUrl={require("../../../assets/animoji.png")}
            />
            <UserChatView message="This is the madafokn admin" time="14:50" />
            <ChatView1
              message="Hey modafokn admin!! "
              time="14:51"
              imageUrl={require("../../../assets/animoji.png")}
            />
            <ChatView1
              message="Hey modafokn admin!! "
              time="14:51"
              imageUrl={require("../../../assets/animoji.png")}
            />
            .
            <UserChatView
              message="    Hello Guys i just joined, i was going to
ask what time we are moving. BTW my
name is Daniel, I know the pick up 
location is close to me but i don’t exactly 
know my way"
              time="14:50"
            />
            <UserChatView message="Hi" time="14:50" />
          </CustomView>
        </ScrollView>

        <CustomView className="h-28 p-5">
          <ChatInput />
        </CustomView>
      </CustomView>
    </View>
  );
};

export default ChatPage;
