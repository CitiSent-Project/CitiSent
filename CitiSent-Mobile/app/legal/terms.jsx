import { Text } from "react-native";
import LegalDocumentLayout, {
  LegalSectionTitle,
  LegalSubsectionTitle,
  LegalParagraph,
  LegalBullet,
  LegalNoticeBox,
} from "../../components/legal/LegalDocumentLayout";

export default function TermsAndConditionsScreen() {
  return (
    <LegalDocumentLayout title="Terms & Conditions" lastUpdated="September 2026">
      <LegalNoticeBox title="Important Civic Reporting Notice" variant="info">
        CitiSent is an Emotion-Aware City-Based Reporting System developed for the residents and
        community members of Sto. Tomas City, Batangas. It enables citizens to report local public concerns
        directly to city administrators and departments.
      </LegalNoticeBox>

      <LegalSectionTitle>1. Acceptance of Terms</LegalSectionTitle>
      <LegalParagraph>
        By creating an account, downloading, accessing, or using the CitiSent mobile application
        (&quot;Application&quot; or &quot;Service&quot;), you acknowledge that you have read, understood, and agree to be
        bound by these Terms &amp; Conditions. If you do not agree with any part of these terms, you must
        not access or use the Service.
      </LegalParagraph>

      <LegalSectionTitle>2. Eligibility</LegalSectionTitle>
      <LegalParagraph>
        CitiSent is primarily intended for residents, property owners, workers, and visitors within
        the territorial boundaries of Sto. Tomas City, Batangas, Philippines. To use the Application,
        you must possess the legal capacity to enter into a binding agreement under the laws of the
        Republic of the Philippines. Minors may use the Application only under the supervision of a
        parent or legal guardian.
      </LegalParagraph>

      <LegalSectionTitle>3. User Accounts</LegalSectionTitle>
      <LegalParagraph>
        When registering for an account, you agree to adhere to the following account standards:
      </LegalParagraph>
      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Accurate Information: </Text>
        You must provide accurate, current, and complete details during registration, including your full legal name, active Philippine mobile number, valid email address, and barangay of residence.
      </LegalBullet>
      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Credential Confidentiality: </Text>
        You are solely responsible for maintaining the confidentiality of your account credentials (password) and for restricting unauthorized access to your device.
      </LegalBullet>
      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">No Impersonation: </Text>
        You must not impersonate any other individual, official, government representative, business, or organization.
      </LegalBullet>
      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Account Accountability: </Text>
        You are accountable for all activities, reports, comments, and uploads conducted under your registered account.
      </LegalBullet>

      <LegalSectionTitle>4. Report Submission Standards</LegalSectionTitle>
      <LegalParagraph>
        CitiSent is designed to facilitate constructive, legitimate civic engagement. All reports submitted
        through the Application must be truthful, constructive, and made in good faith regarding genuine
        community concerns.
      </LegalParagraph>
      <LegalParagraph>
        You are strictly prohibited from submitting:
      </LegalParagraph>
      <LegalBullet>False, fabricated, or intentionally misleading reports.</LegalBullet>
      <LegalBullet>Spam, repetitive flood submissions, or duplicate reports for the same incident.</LegalBullet>
      <LegalBullet>Content containing harassment, personal attacks, hate speech, or defamation.</LegalBullet>
      <LegalBullet>Malicious submissions intended to disrupt government services or harm individuals.</LegalBullet>
      <LegalBullet>Illegal content or submissions completely unrelated to community or city concerns.</LegalBullet>

      <LegalSectionTitle>5. Image Uploads</LegalSectionTitle>
      <LegalParagraph>
        The Application allows users to attach photographic evidence to their reports. Any uploaded image
        must be relevant, genuine, and directly related to the reported issue.
      </LegalParagraph>
      <LegalBullet>
        You must not upload inappropriate, obscene, pornographic, violent, copyrighted, or unlawful media.
      </LegalBullet>
      <LegalBullet>
        The Application currently supports uploading a single photo per report captured directly via your
        device camera or selected from your photo gallery.
      </LegalBullet>

      <LegalSectionTitle>6. Location Information</LegalSectionTitle>
      <LegalParagraph>
        To enable local government authorities to locate and evaluate community concerns, location details
        are collected when you file a report.
      </LegalParagraph>
      <LegalBullet>
        Locations may be specified using the location search feature or acquired via your device&apos;s foreground
        GPS coordinates upon granting location permissions.
      </LegalBullet>
      <LegalBullet>
        Reported coordinates are validated against the geographic bounding boundaries of Sto. Tomas City,
        Batangas. Reports located outside Sto. Tomas City cannot be submitted through the Application.
      </LegalBullet>
      <LegalBullet>
        CitiSent does not continuously track or record your location in the background when the Application
        is not actively being used to submit or view reports.
      </LegalBullet>

      <LegalSectionTitle>7. Sentiment &amp; Emotion Analysis</LegalSectionTitle>
      <LegalParagraph>
        CitiSent utilizes automated Natural Language Processing (NLP) models to analyze report descriptions
        to estimate urgency levels and emotional context.
      </LegalParagraph>
      <LegalNoticeBox title="Notice on Automated Analysis" variant="info">
        CitiSent does NOT claim that the automated system can perfectly or definitively determine a person&apos;s
        true emotions or mental state. Automated emotion and sentiment classifications are algorithmic estimates
        designed exclusively to help city administrators triage, categorize, and prioritize incoming community
        reports. Classifications may not always be complete or accurate.
      </LegalNoticeBox>

      <LegalSectionTitle>8. Priority &amp; Urgency Classification</LegalSectionTitle>
      <LegalParagraph>
        Reports submitted may be assigned an automated or administrative urgency rating (such as Low,
        Medium, High, or Critical). An assigned priority level:
      </LegalParagraph>
      <LegalBullet>Serves solely as an internal organizational tool for city departmental routing.</LegalBullet>
      <LegalBullet>Does NOT guarantee an immediate response time, fixed resolution timeframe, or specific outcome.</LegalBullet>

      <LegalSectionTitle>9. Prohibited Activities</LegalSectionTitle>
      <LegalParagraph>
        You agree not to engage in any of the following prohibited behaviors:
      </LegalParagraph>
      <LegalBullet>Attempting unauthorized access to any part of the Application, database, or server infrastructure.</LegalBullet>
      <LegalBullet>Reverse engineering, decompiling, or disassembling the software, except where permitted by applicable law.</LegalBullet>
      <LegalBullet>Transmitting viruses, malware, trojans, or other harmful code.</LegalBullet>
      <LegalBullet>Bypassing security controls, rate limiters, or authentication mechanisms.</LegalBullet>
      <LegalBullet>Using automated scripts, bots, or crawlers to flood or extract information from the Service.</LegalBullet>

      <LegalSectionTitle>10. Account Suspension or Termination</LegalSectionTitle>
      <LegalParagraph>
        The administration reserves the right to restrict, suspend, or terminate your access to CitiSent
        at any time, without prior notice, if you violate these Terms &amp; Conditions, engage in fraudulent
        reporting, or abuse system features. Users may also voluntarily delete their accounts at any time
        via the Settings screen.
      </LegalParagraph>

      <LegalSectionTitle>11. Report Handling &amp; Service Limitations</LegalSectionTitle>
      <LegalParagraph>
        Submitting a report through CitiSent constitutes a communication to local city administrators.
        However, submission does NOT guarantee:
      </LegalParagraph>
      <LegalBullet>Immediate inspection, intervention, or dispatch of city personnel.</LegalBullet>
      <LegalBullet>A specific timeframe for resolution or response.</LegalBullet>
      <LegalBullet>Mandatory acceptance or resolution of the issue, which remains subject to municipal resources, jurisdiction, and verification.</LegalBullet>

      <LegalSectionTitle>12. Emergency Disclaimer</LegalSectionTitle>
      <LegalNoticeBox title="NOT FOR IMMEDIATE EMERGENCIES" variant="warning">
        CitiSent is NOT an emergency dispatch service and must NOT be used as a replacement for emergency
        assistance. If you are experiencing or witnessing an active life-threatening emergency, crime in
        progress, severe fire, or urgent medical crisis, please contact official local emergency hotlines or
        your local Barangay Hall directly.
      </LegalNoticeBox>

      <LegalSectionTitle>13. System Availability</LegalSectionTitle>
      <LegalParagraph>
        CitiSent is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We strive to maintain continuous
        operation, but the Service may occasionally experience interruptions, delays, or errors due to
        scheduled maintenance, server upgrades, network issues, or third-party service outages.
      </LegalParagraph>

      <LegalSectionTitle>14. Intellectual Property</LegalSectionTitle>
      <LegalParagraph>
        All rights, title, and interest in and to the CitiSent software, brand identity, user interface designs,
        graphics, logos, and original content belong to the CitiSent development project and its authorized
        stakeholders. You are granted a personal, non-exclusive, non-transferable license to use the Application
        for its intended civic purpose.
      </LegalParagraph>

      <LegalSectionTitle>15. Changes to Terms</LegalSectionTitle>
      <LegalParagraph>
        We may modify or update these Terms &amp; Conditions periodically. Changes take effect upon being posted
        in the Application, marked with an updated &quot;Last Updated&quot; date. Your continued use of CitiSent following
        any revisions signifies your acceptance of the updated terms.
      </LegalParagraph>

      <LegalSectionTitle>16. Governing Law</LegalSectionTitle>
      <LegalParagraph>
        These Terms &amp; Conditions are governed by and construed in accordance with the laws of the Republic
        of the Philippines, including applicable statutes governing electronic commerce, cybercrime, and municipal
        ordinances.
      </LegalParagraph>
    </LegalDocumentLayout>
  );
}
