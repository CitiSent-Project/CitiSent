import { View } from "react-native";
import SkeletonBlock from "../ui/SkeletonBlock";
import { Colors } from "../../modules/shared";

function ReportCardSkeleton() {
  return (
    <View className="mb-4 rounded-2xl border px-4 py-4 shadow-sm" style={{ borderColor: Colors.border, backgroundColor: Colors.background }}>
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <SkeletonBlock className="h-2.5 w-16 rounded-full" />
          <SkeletonBlock className="mt-2 h-5 w-32 rounded-full" />
        </View>
        <SkeletonBlock className="h-7 w-20 rounded-full" />
      </View>

      <View className="mb-2 flex-row items-center gap-2">
        <SkeletonBlock className="h-3.5 w-3.5 rounded-full" />
        <SkeletonBlock className="h-3 w-40 rounded-full" />
      </View>

      <View className="mt-2 rounded-xl px-3 py-3" style={{ backgroundColor: Colors.ui.slateSoft }}>
        <SkeletonBlock className="h-2.5 w-20 rounded-full" />
        <SkeletonBlock className="mt-2 h-3 w-full rounded-full" />
        <SkeletonBlock className="mt-2 h-3 w-11/12 rounded-full" />
        <SkeletonBlock className="mt-2 h-3 w-8/12 rounded-full" />
      </View>

      <View className="mt-3 rounded-xl border border-dashed px-3 py-3" style={{ borderColor: Colors.borderDashed, backgroundColor: Colors.background }}>
        <View className="flex-row items-center gap-2">
          <SkeletonBlock className="h-3.5 w-3.5 rounded-full" />
          <SkeletonBlock className="h-3 w-28 rounded-full" />
        </View>
      </View>

      <View className="mt-3 flex-row justify-end">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
      </View>
    </View>
  );
}

export default function ReportsFeedSkeleton() {
  return (
    <View>
      <SkeletonBlock className="mb-3 h-5 w-44 rounded-full" />
      <SkeletonBlock className="mb-4 h-3 w-10/12 rounded-full" />
      <ReportCardSkeleton />
      <ReportCardSkeleton />
      <ReportCardSkeleton />
      <ReportCardSkeleton />
    </View>
  );
}
