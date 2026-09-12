import React from 'react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Data Privacy Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to CitiSent. We are committed to protecting your personal information and your right to privacy. 
              This Data Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our platform, in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">2. Information We Collect</h2>
            <p className="mb-3">We collect personal information that you voluntarily provide to us when registering or submitting a report, which may include:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
              <li><strong>Contact Data:</strong> Email address and phone number for verification (OTP) and communication.</li>
              <li><strong>Profile Data:</strong> First name, middle name, last name, and username.</li>
              <li><strong>Location Data:</strong> Geolocation coordinates and addresses related to your submitted reports.</li>
              <li><strong>Media:</strong> Photos or attachments you upload to support your reports.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-3">We use the personal information collected via our platform for a variety of business purposes described below:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
              <li>To facilitate account creation and logon process.</li>
              <li>To verify your identity using One-Time Passwords (OTP).</li>
              <li>To route and process your reports to the appropriate Local Government Unit (LGU) department.</li>
              <li>To anonymize and process report descriptions using AI for urgency and sentiment analysis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">4. Data Sharing and Disclosure</h2>
            <p>
              We only share your personal data with authorized LGU personnel who need to process your reports. 
              We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information (PII). 
              Any data sent to third-party AI services is strictly anonymized (phone numbers and emails are redacted) prior to processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">5. Data Retention and Deletion (Right to be Forgotten)</h2>
            <p>
              We keep your information only for as long as necessary to fulfill the purposes outlined in this privacy notice. 
              You have the right to request the deletion of your account. Upon deletion, all Personally Identifiable Information 
              associated with your past reports will be permanently anonymized, retaining only statistical data for LGU records.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">6. Security of Your Information</h2>
            <p>
              We use administrative, technical, and physical security measures (including secure private storage buckets and role-based access control) 
              to help protect your personal information. However, no electronic transmission over the internet or information storage technology 
              can be guaranteed to be 100% secure.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">7. Contact Us</h2>
            <p>
              If you have questions or comments about this policy, or if you would like to exercise your rights under the Data Privacy Act of 2012, 
              please contact the designated Data Protection Officer (DPO) of your respective LGU.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
