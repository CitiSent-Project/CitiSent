import { Image, Text, View } from "react-native";

const hotlines = [
  {
    key: "pnp",
    nameLine1: "PHILIPPINE NATIONAL POLICE",
    nameLine2: "STO TOMAS MUNICIPAL STATION",
    numberLine1: "(043) 778-1610",
    numberLine2: "0915-372-9019",
    logo: require("../../assets/PublicAgencies/cityhall.png"),
  },
  {
    key: "bfp",
    nameLine1: "BUREAU OF FIRE PROTECTION",
    nameLine2: "STO TOMAS, BATANGAS",
    numberLine1: "(043) 778-3243",
    numberLine2: "0915-602-1987",
    logo: require("../../assets/PublicAgencies/cityhall.png"),
  },
  {
    key: "mdrrmo",
    nameLine1: "MUNICIPAL DISASTER RISK REDUCTION",
    nameLine2: "AND MANAGEMENT OFFICE",
    numberLine1: "(043) 784-8432",
    numberLine2: "(043) 703-2306",
    logo: require("../../assets/PublicAgencies/cityhall.png"),
  },
  {
    key: "hospital",
    nameLine1: "STO TOMAS GENERAL HOSPITAL",
    nameLine2: "ST. FRANCES CABRINI HOSPITAL",
    numberLine1: "(043) 778-2140",
    numberLine2: "(043) 778-4811",
    logo: require("../../assets/PublicAgencies/cityhall.png"),
  },
  {
    key: "tmo",
    nameLine1: "TRAFFIC MANAGEMENT OFFICE",
    nameLine2: "STO TOMAS BATANGAS",
    numberLine1: "(043) 784-6544",
    numberLine2: "0947-109-1421",
    logo: require("../../assets/PublicAgencies/cityhall.png"),
  },
];

export default function EmergencyServicesRow() {
  return (
    <View className="mb-6 gap-2">
      {hotlines.map((hotline) => (
        <View
          key={hotline.key}
          className="flex-row items-start rounded-xl border border-[#D8D8D8] bg-white px-2 py-2"
        >
          <View className="mr-2 h-10 w-10 items-center justify-center rounded-md border border-[#D1D5DB] bg-[#F8FAFC]">
            <Image
              source={hotline.logo}
              className="h-7 w-7"
              resizeMode="contain"
            />
          </View>

          <View className="flex-[0.58] pr-2">
            <Text className="text-[11px] font-extrabold leading-4 text-[#111827]" numberOfLines={2}>
              {hotline.nameLine1}
            </Text>
            <Text className="text-[11px] font-extrabold leading-4 text-[#111827]" numberOfLines={2}>
              {hotline.nameLine2}
            </Text>
          </View>

          <View className="flex-[0.42] items-end">
            <Text className="text-[11px] font-extrabold leading-4 text-[#111827]">{hotline.numberLine1}</Text>
            <Text className="text-[11px] font-extrabold leading-4 text-[#111827]">{hotline.numberLine2}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
