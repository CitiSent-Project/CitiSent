import { Text, View, Image, ImageBackground, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <View className="flex-row items-center justify-between bg-[#1B2D4F] px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-full bg-[#2E4A70] items-center justify-center overflow-hidden border-2 border-white/20">
            <Ionicons name="person" size={24} color="#93C5FD" />
          </View>
          <View>
            <Text className="text-white text-xs">Hi Welcome! 👋</Text>
            <Text className="text-white text-sm font-bold">Juan Dela Cruz</Text> 
          </View>
        </View>

        <TouchableOpacity className="p-1">
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          zIndex: 10,
        }}
      >
        <ImageBackground
          source={require("../../assets/logo/cityhall.png")}
          className="w-full h-60 items-center justify-center"
          resizeMode="cover"
        >
          <View className="absolute inset-0 bg-[#1B2D4F]/40" />

          <View className="items-center z-10">
            <View
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 1,
                elevation: 1,
              }}
            >
              <Image
                source={require("../../assets/logo/logo-citisent.png")}
                className="w-24 h-24"
                resizeMode="contain"
              />
            </View>
            <Text className="text-[#1B2D4F] text-2xl font-bold mt-1 tracking-wide">
              CitiSent
            </Text>
          </View>
        </ImageBackground>
      </View>

      <ScrollView className="flex-1 bg-white" contentContainerClassName="p-4">
      </ScrollView>
    </SafeAreaView>
  );
}
