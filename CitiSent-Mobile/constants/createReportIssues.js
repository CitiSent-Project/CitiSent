const LOGO_BPLO = require("../assets/createReportLogo/638165536_781665991651173_4405056880372095375_n.png");
const LOGO_TREASURY = require("../assets/createReportLogo/638041884_1367152125164750_6650974754736684750_n.png");
const LOGO_BFP = require("../assets/createReportLogo/643392295_923013083537590_8517122580105106645_n.png");
const LOGO_TRAFFIC = require("../assets/createReportLogo/638551661_1234591674913419_6209960830211455482_n.png");
const LOGO_VETERINARY = require("../assets/createReportLogo/643098928_927537506403411_123836873310762832_n.png");
const LOGO_AGRICULTURE = require("../assets/createReportLogo/638054976_1639501030398450_8079326132705691188_n.png");
const LOGO_CCDO = require("../assets/createReportLogo/CCDO.png");
const LOGO_PESO = require("../assets/createReportLogo/637306154_1303232975066793_2865544913508814019_n.png");

export const DEFAULT_ISSUE_LOGO_SOURCE = LOGO_TREASURY;

export const ISSUE_LOGO_BY_SLUG = Object.freeze({
  bplo: LOGO_BPLO,
  "city-treasury": LOGO_TREASURY,
  cto: LOGO_TREASURY,
  "bfp-processing": LOGO_BFP,
  bfp: LOGO_BFP,
  "traffic-management": LOGO_TRAFFIC,
  ctmd: LOGO_TRAFFIC,
  "city-veterinary": LOGO_VETERINARY,
  cvo: LOGO_VETERINARY,
  "city-agriculture": LOGO_AGRICULTURE,
  cao: LOGO_AGRICULTURE,
  "cooperative-development": LOGO_CCDO,
  ccdo: LOGO_CCDO,
  peso: LOGO_PESO,
  "senior-pwd": LOGO_TREASURY,
  pwd: LOGO_TREASURY,
});

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

export function resolveIssueLogoSource(value) {
  const key = normalizeKey(value);
  return ISSUE_LOGO_BY_SLUG[key] || DEFAULT_ISSUE_LOGO_SOURCE;
}

export const CREATE_REPORT_ISSUES = [
  {
    id: "bplo",
    slug: "bplo",
    name: "Business Permits and Licensing Office (BPLO)",
    label: "Business Permits and Licensing Office (BPLO)",
    logoSource: LOGO_BPLO,
  },
  {
    id: "city-treasury",
    slug: "city-treasury",
    name: "City Treasury Office",
    label: "City Treasury Office",
    logoSource: LOGO_TREASURY,
  },
  {
    id: "bfp-processing",
    slug: "bfp-processing",
    name: "Bureau of Fire Protection (BFP) Processing Area",
    label: "Bureau of Fire Protection (BFP) Processing Area",
    logoSource: LOGO_BFP,
  },
  {
    id: "traffic-management",
    slug: "traffic-management",
    name: "City Traffic Management Division/Impounding Services",
    label: "City Traffic Management Division/Impounding Services",
    logoSource: LOGO_TRAFFIC,
  },
  {
    id: "city-veterinary",
    slug: "city-veterinary",
    name: "City Veterinary Office",
    label: "City Veterinary Office",
    logoSource: LOGO_VETERINARY,
  },
  {
    id: "city-agriculture",
    slug: "city-agriculture",
    name: "City Agriculture Office",
    label: "City Agriculture Office",
    logoSource: LOGO_AGRICULTURE,
  },
  {
    id: "cooperative-development",
    slug: "cooperative-development",
    name: "City Cooperative Development Office",
    label: "City Cooperative Development Office",
    logoSource: LOGO_CCDO,
  },
  {
    id: "peso",
    slug: "peso",
    name: "Public Employment Service Office (PESO)",
    label: "Public Employment Service Office (PESO)",
    logoSource: LOGO_PESO,
  },
  {
    id: "senior-pwd",
    slug: "senior-pwd",
    name: "Senior Citizens / PWD Accessibility Services",
    label: "Senior Citizens / PWD Accessibility Services",
    logoSource: LOGO_TREASURY,
  },
];

export function buildIssueOptionsFromDepartments(departments = []) {
  return (Array.isArray(departments) ? departments : [])
    .map((department) => {
      const slug = String(department?.slug || department?.id || "").trim();
      const name = String(department?.name || department?.label || "").trim();

      if (!slug || !name) {
        return null;
      }

      return {
        id: slug,
        slug,
        name,
        label: name,
        logoSource: resolveIssueLogoSource(slug),
      };
    })
    .filter((issue) => issue !== null);
}

export function getCreateReportIssueById(issueId, issues = CREATE_REPORT_ISSUES) {
  const normalizedId = normalizeKey(issueId);
  return (Array.isArray(issues) ? issues : []).find(
    (issue) => normalizeKey(issue?.id) === normalizedId,
  );
}