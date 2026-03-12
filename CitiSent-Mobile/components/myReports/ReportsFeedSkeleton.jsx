import { View } from "react-native";
import SkeletonBlock from "../ui/SkeletonBlock";

function ReportCardSkeleton() {
  return (
    <View className="mb-4 rounded-2xl border border-[#E2E2E2] bg-white px-4 py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className="h-3 w-16 rounded-full" />
      </View>
      <SkeletonBlock className="mb-2 h-3 w-full rounded-full" />
      <SkeletonBlock className="mb-2 h-3 w-11/12 rounded-full" />
      <SkeletonBlock className="mb-4 h-3 w-8/12 rounded-full" />
      <SkeletonBlock className="h-3 w-20 rounded-full" />
    </View>
  );
}

export default function ReportsFeedSkeleton() {
  return (
    <View>
      <SkeletonBlock className="mb-4 h-5 w-36 rounded-full" />
      <ReportCardSkeleton />

      <SkeletonBlock className="mb-4 mt-3 h-5 w-40 rounded-full" />
      <View className="mb-4 flex-row gap-2">
        <SkeletonBlock className="h-8 w-16 rounded-full" />
        <SkeletonBlock className="h-8 w-16 rounded-full" />
        <SkeletonBlock className="h-8 w-16 rounded-full" />
        <SkeletonBlock className="h-8 w-16 rounded-full" />
      </View>

      <ReportCardSkeleton />
      <ReportCardSkeleton />
      <ReportCardSkeleton />
    </View>
  );
}
