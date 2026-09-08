import { Text } from "react-native";
import LegalDocumentLayout, {
  LegalSectionTitle,
  LegalParagraph,
  LegalBullet,
  LegalNoticeBox,
} from "../../components/legal/LegalDocumentLayout";

export default function CommunityGuidelinesScreen() {
  return (
    <LegalDocumentLayout title="Community Guidelines" lastUpdated="September 2026">
      <LegalNoticeBox title="Building a Better Sto. Tomas City Together" variant="info">
        CitiSent exists to give residents of Sto. Tomas City, Batangas, a constructive, reliable channel
        to collaborate with local government departments. These guidelines help ensure a safe, helpful, and
        productive reporting community for everyone.
      </LegalNoticeBox>

      <LegalSectionTitle>What We Encourage</LegalSectionTitle>
      <LegalParagraph>
        Helpful reports make it easier for city teams to take swift, effective action. When submitting concerns:
      </LegalParagraph>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Be Truthful and Honest: </Text>
        Submit factual information about real public issues that you have personally observed.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Provide Clear Descriptions: </Text>
        Briefly explain what the issue is, how severe it appears, and any landmarks that can help city teams identify the problem.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Attach Relevant Evidence: </Text>
        A clear photograph of the problem (e.g. road damage, broken streetlight, blocked drain) gives inspectors valuable context.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Provide Accurate Locations: </Text>
        Verify that your report is located within Sto. Tomas City, Batangas, and pinpoint the street or barangay as accurately as possible.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Be Civil and Respectful: </Text>
        Maintain a courteous and constructive tone in report narratives and discussions with city personnel.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Avoid Duplicate Flooding: </Text>
        Before filing, consider whether the issue is already being addressed. Avoid submitting multiple copies of the exact same incident.
      </LegalBullet>

      <LegalSectionTitle>What is Prohibited</LegalSectionTitle>
      <LegalParagraph>
        To protect system integrity and community safety, the following behaviors are strictly not allowed:
      </LegalParagraph>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">False or Prank Reports: </Text>
        Submitting fabricated situations, fake emergencies, or jokes on the platform.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Harassment and Abuse: </Text>
        Bullying, targeting neighbors or city staff, hate speech, defamation, or threats of violence.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Inappropriate Media: </Text>
        Uploading sexually explicit, violent, obscene, or offensive photographs.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Spam and Commercial Ads: </Text>
        Promoting commercial goods, services, political advertisements, or unsolicited links.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Impersonation: </Text>
        Pretending to be another citizen, city official, or barangay representative.
      </LegalBullet>

      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">System Manipulation: </Text>
        Trying to trick the urgency or sentiment analysis models with exaggerated keywords or repetitive automated spam.
      </LegalBullet>

      <LegalSectionTitle>Enforcement</LegalSectionTitle>
      <LegalParagraph>
        Submissions that violate these guidelines may be flagged, rejected, or removed by city administrators.
        Accounts involved in repeated or severe violations may face temporary suspension or permanent account
        termination.
      </LegalParagraph>

      <LegalNoticeBox title="Need Immediate Help?" variant="warning">
        Remember: CitiSent is designed for civic and community reports, not life-or-death emergencies. For
        crimes in progress, medical crises, or active fires, please contact local emergency authorities or
        your nearest Barangay Hall directly.
      </LegalNoticeBox>
    </LegalDocumentLayout>
  );
}
