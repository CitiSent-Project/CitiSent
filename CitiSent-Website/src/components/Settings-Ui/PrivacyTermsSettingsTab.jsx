import { useMemo, useState } from 'react'
import {
  FiCheckCircle,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiInfo,
  FiLock,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPrinter,
  FiSearch,
  FiShield,
  FiSliders,
  FiUserCheck,
  FiX,
} from 'react-icons/fi'
import { SettingsSectionCard } from '../Account-Ui'

const SUPABASE_DATA_INVENTORY = [
  {
    id: 'profiles',
    title: 'Profiles & Identity',
    table: 'profiles',
    icon: FiUserCheck,
    tag: 'Authentication & RBAC',
    tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    dataPoints: ['Full Name', 'Display ID (CIT-XXXX)', 'Email Address', 'Phone Number (OTP)', 'Role & Department Affiliation'],
    security: 'Bcrypt hashed credentials, Row-Level Security (RLS) enforcement',
    retention: 'Active account duration; permanently anonymized upon verified deletion',
  },
  {
    id: 'reports',
    title: 'Incident Reports & Geolocation',
    table: 'reports',
    icon: FiMapPin,
    tag: 'Spatial & Triage Data',
    tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    dataPoints: ['Title & Description', 'Category & Severity', 'GPS Coordinates', 'Barangay & Address', 'Resolution Status'],
    security: 'Departmental triage filtering, role-scoped queries',
    retention: 'Statutory 5-year municipal planning and auditing cycle',
  },
  {
    id: 'attachments',
    title: 'Evidence Attachments',
    table: 'attachments (storage)',
    icon: FiDatabase,
    tag: 'Encrypted Storage',
    tagColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    dataPoints: ['Incident Photos', 'Media Evidence', 'Supporting Documents'],
    security: 'Private Supabase Storage bucket, signed URLs with 3,600s expiration',
    retention: 'Preserved alongside incident resolution record',
  },
  {
    id: 'messages',
    title: 'Citizen-Staff Messaging',
    table: 'report_messages',
    icon: FiMessageSquare,
    tag: 'Realtime Comms',
    tagColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    dataPoints: ['Direct In-App Messages', 'Staff Annotations', 'Timestamps', 'Read Receipts'],
    security: 'Restricted to incident author and authorized municipal officers',
    retention: 'Duration of active dispute/case + 1-year compliance archive',
  },
  {
    id: 'ai-sentiment',
    title: 'AI Sentiment & Urgency Metrics',
    table: 'reports (sentiment fields)',
    icon: FiSliders,
    tag: 'Automated Prioritization',
    tagColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
    dataPoints: ['Frustration Index', 'Anger Indicator', 'Urgency Score', 'Department Routing Score'],
    security: 'Strict pre-processing: PII (phone, email, names) scrubbed before inference',
    retention: 'Persisted as non-PII analytical metrics with report row',
  },
]

const POLICY_SECTIONS = [
  {
    id: 'collection-basis',
    title: '1. Legal Basis & Philippine Data Privacy Act Compliance',
    content: `CitiSent operates in strict compliance with Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012 (DPA), its Implementing Rules and Regulations (IRR), and all relevant circulars issued by the National Privacy Commission (NPC) of the Philippines.

All personal and sensitive personal information processed by this municipal portal is collected pursuant to legitimate public interest, enabling Local Government Units (LGUs) and designated administrative departments to receive, triage, investigate, and resolve civic complaints and municipal safety hazards.`,
  },
  {
    id: 'information-collected',
    title: '2. Categories of Information Collected via Supabase',
    content: `When citizens and administrators utilize CitiSent, data is securely persisted across dedicated Supabase PostgreSQL database tables and private storage buckets:

• Account & Authentication Data (profiles table): Full legal name, display identifiers (CIT-XXXX), mobile phone numbers used for One-Time Password (OTP) multi-factor authentication, email address, agency assignment, and role permissions.
• Citizen Incident Reports (reports table): Incident title, detailed issue narratives, municipal category (e.g. Infrastructure, Health, Environmental, Public Safety), urgency levels, geolocation latitude/longitude coordinates, barangay location, and administrative status milestones.
• Evidence Media (attachments bucket): Photographic and document files uploaded by citizens to substantiate complaints.
• Realtime Two-Way Communication (report_messages & report_message_reads tables): Direct chat correspondence between municipal triage staff and citizens, including status inquiries and timestamps.`,
  },
  {
    id: 'processing-purpose',
    title: '3. Purposes and Workflows of Data Processing',
    content: `Data collected through the platform is processed exclusively for the following public service mandates:
1. Facilitating secure authentication and preventing duplicate or fraudulent registrations via OTP verification.
2. Routing civic reports to the appropriate LGU departmental teams (e.g., Engineering, Health Office, Waste Management).
3. Providing real-time progress updates, automated push notifications, and clarification channels for citizens.
4. Generating aggregated municipal analytics, geographic incident heatmaps, and executive dashboards for resource allocation.`,
  },
  {
    id: 'ai-sentiment',
    title: '4. AI Urgency & Sentiment Analysis Safeguards',
    content: `CitiSent incorporates AI sentiment and urgency analysis solely to prioritize high-risk civic hazards and expedite emergency responses:
• Mandatory Pre-Scrubbing: Before report text is processed by machine learning models, Personally Identifiable Information (such as phone numbers, emails, and full names) is automatically stripped.
• Non-Biased Scoring: Sentiment metrics (such as frustration or urgency levels) serve purely as routing advisories to human officers and are never used to discriminate against or deprioritize any citizen.`,
  },
  {
    id: 'data-sharing',
    title: '5. Data Sharing, Confidentiality & Third Parties',
    content: `CitiSent enforces a strict zero-sale, zero-commercialization data policy:
• Authorized LGU Access Only: Only certified LGU officers with verified Role-Based Access Control (RBAC) credentials can view citizen reports within their assigned jurisdiction.
• No Commercial Disclosure: Citizen PII is never sold, leased, or disclosed to advertising networks, commercial aggregators, or unauthorized third parties.
• Law Enforcement Requests: Data is disclosed only upon receipt of a valid court order or statutory requirement under Philippine law.`,
  },
  {
    id: 'retention-erasure',
    title: '6. Data Retention, Account Deletion & Right to be Forgotten',
    content: `Under Section 16 of the Data Privacy Act of 2012, data subjects possess the Right to Erasure or Blocking:
• Account Deletion: Citizens may request the deletion of their CitiSent profile at any time.
• Permanent Anonymization: Upon account deletion, all PII (names, contact numbers, emails) associated with past reports is permanently redacted. Historical incident descriptions and geographic categories are preserved in anonymized format to maintain historical municipal incident records.`,
  },
  {
    id: 'security-storage',
    title: '7. Technical & Organizational Security Controls',
    content: `Our Supabase architecture implements multi-layered security measures:
• Storage Bucket Isolation: Incident attachments are housed in private Supabase Storage buckets, accessible solely through temporary Signed URLs that expire after 3,600 seconds.
• Row-Level Security (RLS): Granular PostgreSQL RLS policies restrict profile and message data so that users can only query information authorized by their specific role and department.
• Encryption: Data is encrypted in transit via TLS 1.3 and at rest utilizing AES-256 encryption.`,
  },
  {
    id: 'citizen-rights',
    title: '8. Rights of Data Subjects (Citizens)',
    content: `In accordance with RA 10173, citizens are entitled to:
• Right to be Informed: To know whether their personal data is being processed.
• Right to Access: To obtain reasonable access to personal records held in the database.
• Right to Rectification: To dispute and correct inaccuracies or outdated data in their profiles.
• Right to Object: To withhold consent to processing where permitted by law.
• Right to Damages & Redress: To be indemnified for damages incurred from inaccurate, incomplete, or unlawfully processed data.`,
  },
  {
    id: 'dpo-contact',
    title: '9. Data Protection Officer (DPO) Contact Information',
    content: `For privacy inquiries, rights enforcement requests, or grievances under the Data Privacy Act of 2012, please reach out to the designated LGU Data Protection Officer:
• Office: Office of the Data Protection Officer & Municipal Information Office
• Email: dpo@citisent.gov.ph
• Hotline: (02) 8888-CITI (Extension 104)
• Address: Municipal Hall, Administrative Division, Republic of the Philippines`,
  },
]

const TERMS_SECTIONS = [
  {
    id: 'admin-authority',
    title: '1. Administrative Authority & Scope of Use',
    content: `This Administrative Terms of Use and Code of Data Stewardship binds all authorized users granted Superadmin, Agency Admin, or Department Staff access within the CitiSent Web Portal.

Access to administrative features is a public trust granted solely for the official performance of municipal duties, incident triage, and community engagement. Unauthorized use, personal exploitation, or arbitrary tampering with system records is strictly prohibited.`,
  },
  {
    id: 'confidentiality',
    title: '2. Strict Duty of Confidentiality & Non-Disclosure',
    content: `As an administrative user with privileged access to citizen personal data:
• Absolute Non-Disclosure: Administrators shall not disclose, leak, duplicate, or distribute citizen names, phone numbers, addresses, photos, or messaging threads to any unauthorized individual, media outlet, or social platform.
• Screenshot & Capture Ban: Capturing unauthorized screenshots of citizen reports or contact records on personal devices is a severe breach of official trust and municipal policy.
• Criminal Penalties: Breach of confidentiality involving personal sensitive information carries criminal and civil liabilities under Section 31 and Section 32 of Republic Act No. 10173.`,
  },
  {
    id: 'rbac-limits',
    title: '3. Role-Based Access Controls & Departmental Scoping',
    content: `All administrative personnel must observe the limits of their assigned administrative tier:
• Departmental Isolation: Office Admins must only inspect, modify, and triage reports belonging to their designated agency or department.
• Transfer Requests: Inter-departmental reassignments must be formally submitted and documented via the system's Department Transfer mechanism with recorded justifications.
• Credential Safeguarding: Sharing admin passwords, session tokens, or OTP codes is grounds for immediate account suspension and disciplinary review.`,
  },
  {
    id: 'acceptable-chat',
    title: '4. Professional Code of Conduct in Citizen Communications',
    content: `When utilizing the realtime citizen chat drawer:
• Professional Demeanor: Communications must remain courteous, objective, and focused solely on verifying details, reporting hazards, and communicating resolution timelines.
• Harassment & Discrimination: Any abusive, dismissive, discriminatory, or retaliatory communication toward citizens is strictly forbidden.
• Official Record: All sent messages are permanently time-stamped and linked to the authenticated admin's user ID in the database.`,
  },
  {
    id: 'export-rules',
    title: '5. Handling of Exported Records & CSV Reports',
    content: `When generating CSV exports or summary analytics:
• Secure Local Storage: Exported data sheets containing citizen or report details must be stored only on secure, encrypted municipal workstations.
• Deletion of Working Files: Temporary exported files must be shredded or deleted after official reporting needs are fulfilled.
• Distribution Limits: Analytical exports must not be transferred via unencrypted personal messaging or public email accounts.`,
  },
  {
    id: 'audit-oversight',
    title: '6. Immutable Audit Logging & Administrative Oversight',
    content: `Every administrative action within the CitiSent portal is systematically recorded in immutable audit logs:
• Monitored Actions: Profile lookups, triage status modifications, internal notes, department transfer approvals, ban/unban toggles, and report exports.
• Periodic Compliance Audits: The LGU Data Protection Officer and Municipal Internal Audit team conduct regular reviews of activity logs to ensure complete compliance with municipal regulations.`,
  },
  {
    id: 'terms-acknowledgment',
    title: '7. Staff Acknowledgment & Disciplinary Consequences',
    content: `By logging into and utilizing the CitiSent administrative portal, the administrator explicitly acknowledges having read, understood, and agreed to adhere to this Code of Data Stewardship.

Non-compliance, intentional data mishandling, or ethical breaches shall result in:
1. Immediate revocation of administrative privileges.
2. Formal administrative sanctions under Civil Service Commission (CSC) rules.
3. Referral for criminal and civil prosecution under the Data Privacy Act of 2012 and the Cybercrime Prevention Act of 2012 (RA 10175).`,
  },
]

export function PrivacyTermsSettingsTab() {
  const [activeSegment, setActiveSegment] = useState('policy') // 'policy' | 'terms'
  const [searchQuery, setSearchQuery] = useState('')

  const sectionsToDisplay = activeSegment === 'policy' ? POLICY_SECTIONS : TERMS_SECTIONS

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return sectionsToDisplay

    return sectionsToDisplay.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.content.toLowerCase().includes(query)
    )
  }, [sectionsToDisplay, searchQuery])

  function handlePrint() {
    window.print()
  }

  function handleClearSearch() {
    setSearchQuery('')
  }

  function handleScrollToSection(sectionId) {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Printable official document styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-document-root, #print-document-root * {
            visibility: visible;
          }
          #print-document-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Governance Header Card */}
      <SettingsSectionCard
        title="Data Privacy Policy & Administrative Terms"
        description="Comprehensive compliance guidelines governing citizen data collection via Supabase and staff data stewardship under Republic Act No. 10173."
        guideId="settings-privacy-terms-card"
      >
        {/* Compliance Badges & Action Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              RA 10173 Compliant
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Version 2.4 (Oct 2026)
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300">
              <FiLock className="text-xs" />
              AES-256 & RLS Encrypted
            </span>
          </div>

          <div className="no-print flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title="Print or Save Official PDF"
            >
              <FiPrinter className="text-sm" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Interactive Segmented Switch & Search Toolbar */}
        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          {/* Segmented Pill Switch */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveSegment('policy')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${activeSegment === 'policy'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              <FiShield className="text-sm" />
              Data Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment('terms')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${activeSegment === 'terms'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              <FiFileText className="text-sm" />
              Admin Terms of Use
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policy & terms clauses..."
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Sticky Anchor Quick-Jump Bar */}
        <div className="no-print mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-700">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
            Jump to:
          </span>
          {activeSegment === 'policy' && (
            <button
              type="button"
              onClick={() => handleScrollToSection('supabase-inventory')}
              className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Data Inventory
            </button>
          )}
          {filteredSections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleScrollToSection(sec.id)}
              className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 truncate max-w-40"
            >
              {sec.title.split('.')[1] ? sec.title.split('.')[1].trim() : sec.title}
            </button>
          ))}
        </div>
      </SettingsSectionCard>

      {/* Supabase Data Inventory Cards (Displayed in Policy Mode) */}
      {activeSegment === 'policy' && !searchQuery && (
        <div id="supabase-inventory" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FiDatabase className="text-blue-600 dark:text-blue-400" />
                Supabase Architecture & Data Inventory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual index of municipal citizen and administrative data persisted in our Supabase instance.
              </p>
            </div>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              5 Managed Domains
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUPABASE_DATA_INVENTORY.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-blue-300 dark:border-slate-700/80 dark:bg-slate-800 dark:hover:border-blue-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <Icon className="text-lg" />
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                      Table: {item.table}
                    </p>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      <p className="font-medium text-[11px] text-slate-500 dark:text-slate-400">Collected Data Points:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {item.dataPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-[11px] space-y-1 text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                    <p>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Security:</span> {item.security}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Retention:</span> {item.retention}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Document Content Area */}
      <div id="print-document-root" className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
            <FiInfo className="mx-auto text-3xl text-slate-400 mb-2" />
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No matching clauses found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              No sections matched &ldquo;{searchQuery}&rdquo;. Try another term or clear the search.
            </p>
            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          filteredSections.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="scroll-mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-700/80 dark:bg-slate-800"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2.5 dark:border-slate-700 flex items-center justify-between">
                <span>{sec.title}</span>
                <span className="no-print text-[11px] font-normal text-slate-400">
                  Section ID: #{sec.id}
                </span>
              </h3>
              <div className="mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line font-normal">
                {sec.content}
              </div>
            </section>
          ))
        )}

        {/* Official LGU Data Protection Officer (DPO) Contact Card */}
        {activeSegment === 'policy' && (
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-600 p-3 text-white dark:bg-blue-500">
                  <FiMail className="text-xl" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Official Data Protection Officer (DPO) Channel
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Designated authority for citizen rights inquiries, rectification requests, and audit verifications.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <a
                  href="mailto:dpo@citisent.gov.ph?subject=CitiSent%20Data%20Privacy%20Inquiry"
                  className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Contact DPO
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Administrative Stewardship Pledge Callout (Terms Mode) */}
        {activeSegment === 'terms' && (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <FiCheckCircle className="text-xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-200">
                  Data Stewardship & Ethics Affirmation
                </h4>
                <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                  As an administrative officer of the Local Government Unit, you are entrusted with confidential citizen data.
                  Always exercise integrity, impartiality, and diligence. All actions in this portal are logged and subject to statutory audit under Philippine law.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
