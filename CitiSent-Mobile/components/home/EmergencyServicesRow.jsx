import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, Text, ToastAndroid, Vibration, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Colors } from "../../modules/shared";
import Toast from "../ui/toaster";

const hotlines = [
  {
    key: "pnp",
    nameLine1: "PHILIPPINE NATIONAL POLICE",
    nameLine2: "STO TOMAS MUNICIPAL STATION",
    numberLine1: "(043) 778-1610",
    numberLine2: "0915-372-9019",
    logo: require("../../assets/PublicAgencies/pnp.png"),
  },
  {
    key: "bfp",
    nameLine1: "BUREAU OF FIRE PROTECTION",
    nameLine2: "STO TOMAS, BATANGAS",
    numberLine1: "(043) 778-3243",
    numberLine2: "0915-602-1987",
    logo: require("../../assets/PublicAgencies/bfp.png"),
  },
  // {
  //   key: "mdrrmo",
  //   nameLine1: "MUNICIPAL DISASTER RISK REDUCTION",
  //   nameLine2: "AND MANAGEMENT OFFICE",
  //   numberLine1: "(043) 784-8432",
  //   numberLine2: "(043) 703-2306",
  //   logo: require("../../assets/PublicAgencies/cityhall.png"),
  // },
  {
    key: "hospital",
    nameLine1: "STO TOMAS GENERAL HOSPITAL",
    nameLine2: "ST. FRANCES CABRINI HOSPITAL",
    numberLine1: "(043) 778-2140",
    numberLine2: "(043) 778-4811",
    logo: require("../../assets/PublicAgencies/hospital.png"),
  },
  // {
  //   key: "tmo",
  //   nameLine1: "TRAFFIC MANAGEMENT OFFICE",
  //   nameLine2: "STO TOMAS BATANGAS",
  //   numberLine1: "(043) 784-6544",
  //   numberLine2: "0947-109-1421",
  //   logo: require("../../assets/PublicAgencies/cityhall.png"),
  // },
];

/**
 * Individual hotline phone number row with a copy button and long-press copy support.
 */
function HotlineNumberItem({ number, isCopied, onCopy }) {
  const handleCopyAction = () => {
    onCopy(number);
  };

  const handleLongPress = (e) => {
    e?.stopPropagation?.();
    handleCopyAction();
  };

  const handleButtonPress = (e) => {
    e?.stopPropagation?.();
    handleCopyAction();
  };

  return (
    <View className="flex-row items-center justify-end py-0.5">
      {/* Phone number text: supports long-pressing to copy */}
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={`Hotline ${number}. Long press to copy.`}
        accessibilityHint="Long press to copy phone number to clipboard"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 2 }}
        className="rounded px-0.5"
        style={({ pressed }) => [
          pressed ? { opacity: 0.6 } : null,
        ]}
      >
        <Text
          className="text-[11px] font-extrabold leading-4"
          style={{
            color: isCopied ? "#16A34A" : Colors?.text?.primary || "#111827",
          }}
          selectable={false}
        >
          {number}
        </Text>
      </Pressable>

      {/* Copy icon button: tap or long-press to copy */}
      <Pressable
        onPress={handleButtonPress}
        onLongPress={handleLongPress}
        delayLongPress={350}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={isCopied ? `Copied ${number}` : `Copy ${number}`}
        accessibilityHint="Tap to copy phone number to clipboard"
        className="ml-1 items-center justify-center rounded p-0.5 active:bg-blue-50"
        style={({ pressed }) => [
          pressed ? { opacity: 0.5, transform: [{ scale: 0.92 }] } : null,
        ]}
      >
        <Ionicons
          name={isCopied ? "checkmark-circle" : "copy-outline"}
          size={13}
          color={isCopied ? "#16A34A" : Colors?.primaryStrong || "#1D4ED8"}
        />
      </Pressable>
    </View>
  );
}

export default function EmergencyServicesRow({ onCopied }) {
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [toastState, setToastState] = useState({ visible: false, number: "" });
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(
    async (numberToCopy) => {
      if (!numberToCopy) return;

      try {
        let copied = false;
        if (Clipboard?.setStringAsync) {
          await Clipboard.setStringAsync(numberToCopy);
          copied = true;
        } else if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(numberToCopy);
          copied = true;
        }

        if (copied) {
          // Subtle haptic buzz for physical confirmation
          try {
            Vibration.vibrate(30);
          } catch (_) {}

          // Native Android system toast as extra confirmation on Android
          if (Platform.OS === "android") {
            try {
              ToastAndroid.show("Number copied!", ToastAndroid.SHORT);
            } catch (_) {}
          }

          setCopiedNumber(numberToCopy);

          // If a parent handler is provided (e.g. In HomeScreen), trigger it;
          // otherwise show local toast
          if (onCopied) {
            onCopied(numberToCopy);
          } else {
            setToastState({ visible: true, number: numberToCopy });
          }

          if (copyTimerRef.current) {
            clearTimeout(copyTimerRef.current);
          }
          copyTimerRef.current = setTimeout(() => {
            setCopiedNumber(null);
          }, 2000);
        }
      } catch (err) {
        console.warn("Failed to copy hotline number to clipboard:", err);
      }
    },
    [onCopied]
  );

  return (
    <View className="mb-6 gap-2">
      {hotlines.map((hotline) => (
        <View
          key={hotline.key}
          className="flex-row items-center rounded-xl border bg-white px-2.5 py-2.5"
          style={{ borderColor: Colors?.borderNeutral || "#D8D8D8" }}
        >
          <View className="mr-3 h-14 w-14 shrink-0 items-center justify-center self-center">
            <Image
              source={hotline.logo}
              className="h-14 w-14"
              resizeMode="contain"
            />
          </View>

          <View className="flex-1 min-w-0 pr-2 justify-center">
            <Text
              className="text-[11px] font-extrabold leading-4"
              style={{ color: Colors?.text?.primary || "#111827" }}
              numberOfLines={2}
            >
              {hotline.nameLine1}
            </Text>
            <Text
              className="text-[11px] font-extrabold leading-4"
              style={{ color: Colors?.text?.primary || "#111827" }}
              numberOfLines={2}
            >
              {hotline.nameLine2}
            </Text>
          </View>

          <View className="shrink-0 items-end justify-center">
            <HotlineNumberItem
              number={hotline.numberLine1}
              isCopied={copiedNumber === hotline.numberLine1}
              onCopy={handleCopy}
            />
            <HotlineNumberItem
              number={hotline.numberLine2}
              isCopied={copiedNumber === hotline.numberLine2}
              onCopy={handleCopy}
            />
          </View>
        </View>
      ))}

      {/* Standalone fallback Toast if not handled by a parent screen */}
      {!onCopied && (
        <Toast
          visible={toastState.visible}
          message="Number copied!"
          submessage={toastState.number}
          onDismiss={() => setToastState({ visible: false, number: "" })}
          bottomOffset={20}
        />
      )}
    </View>
  );
}
