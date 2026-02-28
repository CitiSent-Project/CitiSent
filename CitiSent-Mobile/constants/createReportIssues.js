export const CREATE_REPORT_ISSUES = [
  {
    id: "bplo",
    label: "Business Permits and Licensing Office (BPLO)",
    logoSource: require("../assets/createReportLogo/638165536_781665991651173_4405056880372095375_n.png"),
  },
  {
    id: "city-treasury",
    label: "City Treasury Office",
    logoSource: require("../assets/createReportLogo/638041884_1367152125164750_6650974754736684750_n.png"),
  },
  {
    id: "bfp-processing",
    label: "Bureau of Fire Protection (BFP) Processing Area",
    logoSource: require("../assets/createReportLogo/643392295_923013083537590_8517122580105106645_n.png"),
  },
  {
    id: "traffic-management",
    label: "City Traffic Management Division/Impounding Services",
    logoSource: require("../assets/createReportLogo/638551661_1234591674913419_6209960830211455482_n.png"),
  },
  {
    id: "city-veterinary",
    label: "City Veterinary Office",
    logoSource: require("../assets/createReportLogo/643098928_927537506403411_123836873310762832_n.png"),
  },
  {
    id: "city-agriculture",
    label: "City Agriculture Office",
    logoSource: require("../assets/createReportLogo/638054976_1639501030398450_8079326132705691188_n.png"),
  },
  {
    id: "cooperative-development",
    label: "City Cooperative Development Office",
    logoSource: require("../assets/createReportLogo/CCDO.png"),
  },
  {
    id: "peso",
    label: "Public Employment Service Office (PESO)",
    logoSource: require("../assets/createReportLogo/637306154_1303232975066793_2865544913508814019_n.png"),
  },
  {
    id: "senior-pwd",
    label: "Senior Citizens / PWD Accessibility Services",
    logoSource: require("../assets/createReportLogo/638041884_1367152125164750_6650974754736684750_n.png"),
  },
];

export function getCreateReportIssueById(issueId) {
  return CREATE_REPORT_ISSUES.find((issue) => issue.id === issueId);
}
