import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { Colors } from "../../../modules/shared";

function resolveImageSource(attachment) {
  if (!attachment || attachment.kind !== "image") return null;

  if (typeof attachment.source === "string") {
    return { uri: attachment.source };
  }

  return attachment.source;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getContainerAspectRatio(imageAspectRatio) {
  // Clamp extreme ratios so the card stays balanced on both phone sizes and orientations.
  return clamp(imageAspectRatio, 0.75, 1.7);
}

export default function ReportAttachmentPreview({ attachment }) {
  const imageSource = resolveImageSource(attachment);
  const [imageAspectRatio, setImageAspectRatio] = useState(1.2);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!imageSource) {
      setImageAspectRatio(1.2);
      return () => {
        isMounted = false;
      };
    }

    if (typeof imageSource === "number") {
      const asset = Image.resolveAssetSource(imageSource);
      if (asset?.width && asset?.height && isMounted) {
        setImageAspectRatio(asset.width / asset.height);
      }
      return () => {
        isMounted = false;
      };
    }

    if (imageSource?.uri) {
      Image.getSize(
        imageSource.uri,
        (width, height) => {
          if (!isMounted || !width || !height) return;
          setImageAspectRatio(width / height);
        },
        () => {
          if (isMounted) {
            setImageAspectRatio(1.2);
          }
        }
      );
    }

    return () => {
      isMounted = false;
    };
  }, [imageSource]);

  if (!imageSource) {
    return (
      <View
        className="mt-3 rounded-xl border border-dashed px-3 py-2"
        style={{ borderColor: Colors.borderDashed, backgroundColor: Colors.background }}
      >
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="image-outline" size={14} color={Colors.icon.muted} />
          <Text className="text-xs font-semibold" style={{ color: Colors.text.secondary }}>No image attached</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-3">
      <Text className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>Attached Image</Text>
      <Pressable
        onPress={() => setIsPreviewOpen(true)}
        className="overflow-hidden rounded-xl"
        style={{
          backgroundColor: Colors.ui.graySoft,
          width: "80%",
          alignSelf: "center",
          aspectRatio: getContainerAspectRatio(imageAspectRatio),
          maxHeight: 240,
        }}
      >
        <Image source={imageSource} className="h-full w-full" resizeMode="contain" />
      </Pressable>
      <Text className="mt-1 text-center text-[11px] font-medium" style={{ color: Colors.text.secondary }}>Tap image to preview</Text>

      <Modal visible={isPreviewOpen} animationType="fade" transparent onRequestClose={() => setIsPreviewOpen(false)}>
        <View className="flex-1 bg-black/85">
          <View className="flex-row justify-end px-4 pt-12">
            <Pressable
              onPress={() => setIsPreviewOpen(false)}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="close" size={22} color={Colors.text.inverse} />
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center px-4 pb-10">
            <Image source={imageSource} className="h-full w-full" resizeMode="contain" />
          </View>
        </View>
      </Modal>
    </View>
  );
}
