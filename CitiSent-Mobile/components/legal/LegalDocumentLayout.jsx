import { ScrollView, Text, View } from "react-native";
import PageTopBar from "../layout/PageTopBar";
import { Colors } from "../../modules/shared";

export function LegalSectionTitle({ children }) {
  return (
    <Text className="mt-6 mb-2 text-base font-bold tracking-tight text-[#0F172A]">
      {children}
    </Text>
  );
}

export function LegalSubsectionTitle({ children }) {
  return (
    <Text className="mt-4 mb-1.5 text-sm font-semibold text-[#1E293B]">
      {children}
    </Text>
  );
}

export function LegalParagraph({ children }) {
  return (
    <Text className="mb-3 text-[14px] leading-6 text-[#334155]">
      {children}
    </Text>
  );
}

export function LegalBullet({ children }) {
  return (
    <View className="mb-2 flex-row items-start pl-1 pr-2">
      <Text className="mr-2 text-[14px] leading-6 text-[#2563EB]">•</Text>
      <Text className="flex-1 text-[14px] leading-6 text-[#334155]">
        {children}
      </Text>
    </View>
  );
}

export function LegalNoticeBox({ title, children, variant = "info" }) {
  const isWarning = variant === "warning" || variant === "danger";
  const bgColor = isWarning ? "#FEF2F2" : "#EFF6FF";
  const borderColor = isWarning ? "#FECACA" : "#BFDBFE";
  const titleColor = isWarning ? "#991B1B" : "#1E3A8A";
  const icon = isWarning ? "⚠️" : "ℹ️";

  return (
    <View
      className="my-4 rounded-xl border p-4"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      {title ? (
        <View className="mb-1.5 flex-row items-center">
          <Text className="mr-2 text-sm">{icon}</Text>
          <Text className="text-sm font-bold" style={{ color: titleColor }}>
            {title}
          </Text>
        </View>
      ) : null}
      <Text className="text-[13px] leading-5 text-[#334155]">{children}</Text>
    </View>
  );
}

export function LegalLastUpdated({ date = "September 2026" }) {
  return (
    <View className="mb-4 inline-flex self-start rounded-full bg-[#E2E8F0] px-3 py-1">
      <Text className="text-[12px] font-medium text-[#475569]">
        Last Updated: {date}
      </Text>
    </View>
  );
}

export default function LegalDocumentLayout({ title, lastUpdated = "September 2026", children }) {
  return (
    <View className="flex-1 bg-white">
      <PageTopBar title={title} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-16 pt-5"
        showsVerticalScrollIndicator={true}
      >
        <LegalLastUpdated date={lastUpdated} />
        {children}
      </ScrollView>
    </View>
  );
}
