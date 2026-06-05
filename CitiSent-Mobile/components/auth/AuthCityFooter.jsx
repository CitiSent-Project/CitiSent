import { useEffect, useState } from "react";
import { AppState, Image, Keyboard, Platform, View } from "react-native";

export default function AuthCityFooter({ backgroundColor = "transparent" }) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardOffset(e.endCoordinates.height);
    });
    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    // Reset offset when app returns from background to prevent stale state
    const appStateSub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setKeyboardOffset(0);
      }
    });

    return () => {
      showListener.remove();
      hideListener.remove();
      appStateSub.remove();
    };
  }, []);

  return (
    <View
      pointerEvents="none"
      className="absolute bottom-0 left-0 right-0 h-[170px] overflow-hidden"
      style={{
        backgroundColor,
        transform: [{ translateY: Platform.OS === "android" ? keyboardOffset : 0 }],
      }}
    >
      <Image
        source={require("../../assets/logo/cityhall.png")}
        className="h-full w-full opacity-25"
        resizeMode="cover"
      />
    </View>
  );
}
