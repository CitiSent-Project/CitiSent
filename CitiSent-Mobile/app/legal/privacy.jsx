import { Text } from "react-native";
import LegalDocumentLayout, {
  LegalSectionTitle,
  LegalSubsectionTitle,
  LegalParagraph,
  LegalBullet,
  LegalNoticeBox,
} from "../../components/legal/LegalDocumentLayout";

export default function PrivacyNoticeScreen() {
  return (
    <LegalDocumentLayout title="Privacy Notice" lastUpdated="September 2026">
      <LegalNoticeBox title="Commitment to Data Privacy" variant="info">
        CitiSent values your privacy and is dedicated to safeguarding your personal data in accordance
        with Republic Act No. 10173, also known as the Data Privacy Act of 2012 (DPA) of the Philippines,
        its Implementing Rules and Regulations, and related issuances of the National Privacy Commission (NPC).
      </LegalNoticeBox>

      <LegalSectionTitle>1. Introduction</LegalSectionTitle>
      <LegalParagraph>
        This Privacy Notice outlines how CitiSent collects, uses, stores, and protects personal data
        gathered from users of our mobile application. By utilizing CitiSent to file reports and interact
        with local government services in Sto. Tomas City, Batangas, you acknowledge the data handling
        practices described herein.
      </LegalParagraph>

      <LegalSectionTitle>2. Information We Collect</LegalSectionTitle>
      <LegalParagraph>
        CitiSent collects only information strictly necessary for user authentication, report submission,
        and municipal administrative response. We do not collect unnecessary personal details.
      </LegalParagraph>

      <LegalSubsectionTitle>A. Account Information</LegalSubsectionTitle>
      <LegalParagraph>
        When you register an account, we collect:
      </LegalParagraph>
      <LegalBullet>Full Name: First name, middle name (optional), and last name.</LegalBullet>
      <LegalBullet>Account Identifiers: A chosen unique username and password (stored using cryptographic hashing).</LegalBullet>
      <LegalBullet>Contact Information: Valid email address and Philippine mobile number (+639...).</LegalBullet>
      <LegalBullet>Demographics &amp; Classification: Age, gender, and client classification (Citizen, Business, or Government).</LegalBullet>
      <LegalBullet>Residence: Selected barangay within Sto. Tomas City, Batangas.</LegalBullet>

      <LegalSubsectionTitle>B. Report &amp; Civic Information</LegalSubsectionTitle>
      <LegalParagraph>
        When you create or update a community report, we collect:
      </LegalParagraph>
      <LegalBullet>Issue Category: The selected public concern type (e.g., roads, sanitation, streetlights).</LegalBullet>
      <LegalBullet>Description: The written narrative detailing the issue.</LegalBullet>
      <LegalBullet>Location Data: Descriptive location name and geographical coordinates (latitude and longitude).</LegalBullet>
      <LegalBullet>Visual Evidence: Photos uploaded as evidence (optional).</LegalBullet>
      <LegalBullet>Timestamp &amp; Status: Submission date and time, current status, and history of updates.</LegalBullet>

      <LegalSubsectionTitle>C. Communications &amp; In-App Messages</LegalSubsectionTitle>
      <LegalParagraph>
        Messages or comments exchanged between you and city administrators through the in-app discussion feature
        regarding submitted reports, as well as notification read states.
      </LegalParagraph>

      <LegalSubsectionTitle>D. Device &amp; System Permissions</LegalSubsectionTitle>
      <LegalParagraph>
        The Application requests runtime permissions strictly on an as-needed basis:
      </LegalParagraph>
      <LegalBullet>Camera &amp; Photo Gallery: Requested only when you choose to take or attach a photo to a report.</LegalBullet>
      <LegalBullet>Foreground Location: Requested only when you tap &quot;Use My Current Location&quot; to determine coordinates within Sto. Tomas City.</LegalBullet>
      <LegalBullet>Local Storage: For storing your secure session authentication token (JWT).</LegalBullet>

      <LegalSectionTitle>3. Why We Process Your Information</LegalSectionTitle>
      <LegalParagraph>
        We process your personal information for specific, legitimate purposes:
      </LegalParagraph>
      <LegalBullet>To create, verify, and administer your CitiSent user account.</LegalBullet>
      <LegalBullet>To transmit, log, and organize community reports for official review by Sto. Tomas City departments.</LegalBullet>
      <LegalBullet>To accurately locate reported hazards or infrastructure issues within the city.</LegalBullet>
      <LegalBullet>To run automated natural language processing (sentiment/emotion analysis) that estimates urgency to assist administrators in triaging submissions.</LegalBullet>
      <LegalBullet>To send you notifications and updates regarding the status of your reported issues.</LegalBullet>
      <LegalBullet>To maintain system security, detect duplicate spam, and prevent fraudulent abuse.</LegalBullet>

      <LegalSectionTitle>4. Data Sharing &amp; Access</LegalSectionTitle>
      <LegalParagraph>
        Your information is handled with strict confidentiality and is shared only with:
      </LegalParagraph>
      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Authorized City Officials: </Text>
        Designated administrators, department heads, and municipal personnel of Sto. Tomas City responsible for reviewing and resolving community concerns.
      </LegalBullet>
      <LegalBullet>
        <Text className="font-bold text-[#1E293B]">Infrastructure Providers: </Text>
        Cloud hosting and storage services (Supabase PostgreSQL database and secure storage) and OpenStreetMap Nominatim for geocoding services.
      </LegalBullet>
      <LegalParagraph>
        We do NOT sell, rent, monetize, or disclose your personal data to third-party advertisers, commercial entities,
        or unauthorized persons.
      </LegalParagraph>

      <LegalSectionTitle>5. Data Storage &amp; Retention</LegalSectionTitle>
      <LegalParagraph>
        Your data is stored in secure cloud databases managed via Supabase with encrypted network transmissions.
      </LegalParagraph>
      <LegalParagraph>
        Information is retained for as long as necessary to process community reports, maintain historical
        records for municipal accountability, or until you request account deletion. When you delete your
        account via the Settings screen, your personal account credentials and profile records are removed
        in accordance with system deletion procedures.
      </LegalParagraph>

      <LegalSectionTitle>6. Security Safeguards</LegalSectionTitle>
      <LegalParagraph>
        We employ reasonable organizational, physical, and technical measures to protect your personal data,
        including password hashing, TLS/HTTPS encryption in transit, token-based authentication (JWT), and
        restricted administrative access.
      </LegalParagraph>
      <LegalParagraph>
        While we implement diligent security practices, no method of electronic storage or internet
        transmission is completely impenetrable. Users are encouraged to maintain strong, confidential passwords.
      </LegalParagraph>

      <LegalSectionTitle>7. Your Rights under the Data Privacy Act</LegalSectionTitle>
      <LegalParagraph>
        Under the Philippine Data Privacy Act of 2012, you possess the following rights regarding your personal data:
      </LegalParagraph>
      <LegalBullet>Right to be informed whether your personal data is being processed.</LegalBullet>
      <LegalBullet>Right to access your registered information and submitted reports.</LegalBullet>
      <LegalBullet>Right to rectify or correct inaccuracies in your personal profile through the Edit Profile screen.</LegalBullet>
      <LegalBullet>Right to erasure or blocking by deleting your account via the Settings screen.</LegalBullet>
      <LegalBullet>Right to lodge a complaint with the National Privacy Commission (NPC) if you feel your privacy rights have been violated.</LegalBullet>

      <LegalSectionTitle>8. Revisions to this Notice</LegalSectionTitle>
      <LegalParagraph>
        This Privacy Notice may be updated periodically to reflect improvements in our data practices or
        statutory amendments. Any updates will be displayed within this screen along with an updated &quot;Last Updated&quot;
        date.
      </LegalParagraph>
    </LegalDocumentLayout>
  );
}
