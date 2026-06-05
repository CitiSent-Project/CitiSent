import { useEffect } from "react";
import { AppState, Keyboard, KeyboardAvoidingView, Platform } from "react-native";

/**
 * A wrapper around KeyboardAvoidingView that handles app lifecycle properly.
 *
 * The core issue: on Android (especially in Expo Go), when the app goes to the
 * background and returns, React Native's internal keyboard event listeners can
 * fall out of sync with the native keyboard state. This causes
 * KeyboardAvoidingView to stop adjusting layout when the keyboard reappears.
 *
 * The fix: dismiss the keyboard whenever the app goes to background. This
 * guarantees a clean state when the user returns — they tap an input, the
 * keyboard opens fresh, and all listeners fire correctly. No remounting or
 * key hacks needed.
 */
export default function AppKeyboardAvoidingView({ children, ...props }) {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        Keyboard.dismiss();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
