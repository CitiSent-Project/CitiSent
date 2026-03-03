import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
          paddingTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="NearbyReports"
        options={{
          title: "Nearby",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CreateReport"
        options={{
          title: "Create",
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 11.5,
                color: focused ? Colors.primary : Colors.secondary,
              }}
            >
              Create
            </Text>
          ),
          tabBarIcon: () => (
            <View
              style={{ marginTop: -50 }}
              className="items-center justify-center"
            >

              <View className="rounded-full bg-white p-[4px] border border-[#E0E0E0]">

                <View className="w-[50px] h-[50px] rounded-full bg-[#223D68] items-center justify-center">
                  <Ionicons name="add" size={35} color="white" />
                </View>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ViewReports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


