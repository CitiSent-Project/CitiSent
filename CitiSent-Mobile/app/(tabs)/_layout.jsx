import { Tabs } from "expo-router";
import { View, TouchableOpacity } from "react-native";
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
          height: 65,
          paddingBottom: 8,
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
        name="nearby-reports"
        options={{
          title: "Nearby",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CreateReport"
        options={{
          title: "",
          // Use tabBarButton to render a custom button that floats above the tab bar
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={[
                props.style,
                {
                  top: -30, // Move the button up above the tab bar
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <View 
                className="w-[70px] h-[70px] rounded-full bg-[#2D57A0] justify-center items-center border-[4px] border-white"
                style={{
                  shadowColor: '#2D57A0',
                  shadowOffset: {
                    width: 0,
                    height: 8,
                  },
                  shadowOpacity: 0.5,
                  shadowRadius: 5,
                  elevation: 5
                }}
              >
                <Ionicons name="add" size={35} color="white" />
              </View>
            </TouchableOpacity>
          ),
          tabBarLabel: () => null,
          title: "",
        }}
      />
      <Tabs.Screen
        name="view-reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


