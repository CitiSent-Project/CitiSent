
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../modules/shared";
import { DEFAULT_PROFILE_IMAGES } from "../../constants/profileImages";


export default function ProfileHeader({ name, phone, gender, profileImage, onEditProfile }) {
  const insets = useSafeAreaInsets();
  // Determine which image to show
  let imageSource = profileImage;
  if (!imageSource) {
    if (gender === "male") imageSource = DEFAULT_PROFILE_IMAGES.male;
    else if (gender === "female") imageSource = DEFAULT_PROFILE_IMAGES.female;
    else imageSource = null;
  }

  return (
    <View
      className="px-5 pb-7"
      style={{
        backgroundColor: Colors.ui.headerDark,
        paddingTop: Math.max(insets.top, 10) + 16,
      }}
    >
      <View className="flex-row items-center">
        <View className="h-[58px] w-[58px] items-center justify-center rounded-full" style={{ backgroundColor: Colors.ui.headerAvatarDark }}>
          {imageSource ? (
            <Image source={imageSource} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={34} color={Colors.ui.heroSoft} />
          )}
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-[20px] font-extrabold text-white" numberOfLines={1}>
            {name}
          </Text>
          <Text className="mt-1 text-base" style={{ color: Colors.text.profileSubtle }}>{phone}</Text>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onEditProfile}
        className="mt-6 self-start rounded-full border px-8 py-2.5"
        style={{ borderColor: Colors.text.profileLink }}
      >
        <Text className="text-sm font-semibold" style={{ color: Colors.text.profileLink }}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
