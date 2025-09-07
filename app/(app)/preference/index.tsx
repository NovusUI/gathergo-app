import CustomButton from "@/components/buttons/CustomBtn1";
import { useSavePreferences } from "@/services/mutations";
import { showGlobalError, showGlobalSuccess } from "@/utils/globalErrorHandler";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";


const allPreferences = [
    "Cinema", "Concert", "Art", "Music", "Brunches", "Sport", "Scientific",
    "Business", "Tech", "Realstate", "Automotive", "Fashion", "Outdoor",
    "Education", "Design", "Nightlife", "Zoo"
  ];


const index = () => {
    const router = useRouter()
    
    const [visiblePrefs, setVisiblePrefs] = useState(allPreferences);
    const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
    const {mutate:onUpdatePreference, isPending} =  useSavePreferences()


    const handleSelect = (item: string) => {
  if (selectedPrefs.includes(item)) {
    setSelectedPrefs(selectedPrefs.filter(pref => pref !== item));
  } else {
    setSelectedPrefs([...selectedPrefs, item]);
  }
};



      const savePreference = async ()=>{

        if (selectedPrefs.length === 0) {
          showGlobalError("Please select at least one preference");
          return;
        }

        onUpdatePreference(selectedPrefs,
            {
              onSuccess: async (data) => {
       
          
                showGlobalSuccess("Preferences saved!");
                router.replace("/")
              },
              onError: (err: any) => {
                console.log(err)
                showGlobalError(err?.response?.data?.message || err?.message || "Failed to save preferences");
              },
            }
        )
        console.log(visiblePrefs)
      }

  return (
    <View className="flex-1 bg-[#01082E] flex flex-col justify-center items-center text-left  px-5 py-10 gap-5 overflow-scroll">
        <View className="gap-8 flex-1 pt-10 flex flex-col  w-full max-w-[600px]">
        <Text className="text-white text-4xl">Select your interest</Text>
        <Text className="text-white">This will help us to choose interesting events and content for you that you will definitely like.</Text>
        
        <View className="flex-row flex-wrap justify-between">
  {visiblePrefs.map((item) => (
    <TouchableOpacity
    key={item}
    onPress={() => handleSelect(item)}
    className={`rounded-full px-5 py-3 mb-3 ${
      selectedPrefs.includes(item) ? "bg-[#0FF1CF]" : "bg-white"
    }`}
  >
    <Text className={`text-sm ${selectedPrefs.includes(item) ? "text-black" : "text-black"}`}>
      {item}
    </Text>
  </TouchableOpacity>
  ))}
</View>



  
        </View>
        <CustomButton 
        onPress={savePreference} 
        title={isPending ? "Saving..." : "Next"}
        disabled={isPending}
        buttonClassName='bg-[#0FF1CF] border-0 w-full ' 
        textClassName="!text-black"  
        arrowCircleColor="bg-[#0A7F7F]"/>

    </View>
  )
}

export default index
