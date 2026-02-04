import React from 'react';

const UpiSubscriptionTrackerPrivacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for UPI Subscription Tracker</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p className="text-gray-700 mb-4">
          This Privacy Policy describes how UPI Subscription Tracker ("we", "our", "us", or "the App") 
          handles your information. We are committed to protecting your privacy and ensuring the security 
          of your personal data in compliance with applicable data protection laws including GDPR and CCPA.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-2 mt-4">2.1 SMS Data</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>READ_SMS Permission:</strong> Used to detect past UPI subscription payments from transaction messages</li>
          <li><strong>RECEIVE_SMS Permission:</strong> Used for real-time detection of new UPI transaction notifications</li>
          <li><strong>What we access:</strong> Only SMS messages containing UPI-related keywords (e.g., "debited", "UPI", "subscription")</li>
          <li><strong>What we store:</strong> Only extracted subscription information (merchant name, amount, date) - NOT the full SMS content</li>
          <li><strong>Processing location:</strong> All SMS processing happens <strong>locally on your device</strong></li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Notification Permissions</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>POST_NOTIFICATIONS:</strong> Send renewal reminder notifications</li>
          <li><strong>SCHEDULE_EXACT_ALARM:</strong> Schedule notifications 2 days before subscription renewal</li>
          <li><strong>RECEIVE_BOOT_COMPLETED:</strong> Restore scheduled notifications after device restart</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Internet Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>Displaying advertisements (Google AdMob or similar ad networks)</li>
          <li>Processing in-app purchases via Google Play Billing</li>
          <li>App updates and bug fixes</li>
          <li>Anonymous usage analytics</li>
        </ul>
        <p className="text-gray-700 mt-2">
          <strong>Important:</strong> Ad networks may collect anonymous device identifiers for ad personalization. 
          No SMS data or subscription information is shared with advertisers.
        </p>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.4 Information We Do NOT Collect</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>We do not collect or transmit your SMS messages</li>
          <li>We do not collect personal identification information</li>
          <li>We do not collect location data</li>
          <li>We do not access contacts, call logs, or other sensitive data</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>SMS messages are processed <strong>locally on your device</strong> to detect UPI subscription payments</li>
          <li>Only subscription-related information (merchant, amount, date) is extracted and stored locally</li>
          <li>Full SMS content is never stored, transmitted, or shared</li>
          <li>Extracted subscription data is used solely to track renewals and send reminders</li>
          <li>No SMS data is transmitted to external servers or third parties</li>
          <li>Anonymous usage analytics may be collected to improve app functionality</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Retention</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Local Storage Only:</strong> All subscription data is stored locally on your device</li>
          <li><strong>No Cloud Storage:</strong> We do not upload or store your data on external servers</li>
          <li><strong>Data Encryption:</strong> Local data is encrypted using Android's built-in security features</li>
          <li><strong>Data Removal:</strong> You can delete all stored data by clearing app data or uninstalling the app</li>
          <li><strong>SMS Messages:</strong> Never stored - only processed in real-time to extract subscription info</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
        <p className="text-gray-700 mb-4">We implement industry-standard security measures to protect your data:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All SMS processing is performed locally on your device</li>
          <li>No transmission of SMS content to external servers</li>
          <li>Local data encryption using Android security features</li>
          <li>Minimal permission requests (only what's necessary for functionality)</li>
          <li>No third-party access to your SMS messages or subscription data</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Third-Party Services</h2>
        <p className="text-gray-700 mb-4">
          The app uses the following third-party services:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Google Play Services:</strong> For app functionality, updates, and in-app purchases</li>
          <li><strong>Google Play Billing:</strong> For processing premium subscriptions and one-time purchases</li>
          <li><strong>Ad Networks (e.g., Google AdMob):</strong> For displaying advertisements in the free version</li>
          <li><strong>Analytics Services:</strong> Anonymous usage statistics (no personal data or SMS content)</li>
        </ul>
        <p className="text-gray-700 mt-4">
          <strong>Important:</strong> These services may collect anonymous device identifiers and usage data according 
          to their own privacy policies. However, your SMS messages and subscription data are NEVER shared with any 
          third-party service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Monetization</h2>
        <p className="text-gray-700 mb-4">
          UPI Subscription Tracker is a freemium app supported by:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Advertisements:</strong> Free users see ads served by third-party networks (e.g., Google AdMob)</li>
          <li><strong>In-App Purchases:</strong> Premium features available through one-time purchases or subscriptions</li>
          <li><strong>Ad-Free Experience:</strong> Premium users enjoy an ad-free experience with additional features</li>
          <li>All purchases are processed securely through Google Play Billing</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Your Rights (GDPR & CCPA)</h2>
        <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Right to Access:</strong> Request information about data processing</li>
          <li><strong>Right to Deletion:</strong> Delete all data by uninstalling the app or clearing app data</li>
          <li><strong>Right to Data Portability:</strong> Export your subscription data from the app</li>
          <li><strong>Right to Object:</strong> Revoke SMS permissions at any time through Android settings</li>
          <li><strong>Right to Withdraw Consent:</strong> Disable permissions in device settings</li>
          <li><strong>Right to Non-Discrimination:</strong> We do not discriminate against users who exercise their rights</li>
        </ul>
        <p className="text-gray-700 mt-4">
          Since we do not store personal data externally, most privacy rights are automatically fulfilled by design.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">9. Children's Privacy</h2>
        <p className="text-gray-700 mb-4">
          This app is not directed at children under 13 years of age. We do not knowingly collect 
          personal information from children under 13. If you are a parent or guardian and believe 
          your child has provided us with personal information, please contact us.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">10. California Privacy Rights</h2>
        <p className="text-gray-700 mb-4">
          California residents have additional rights under the California Consumer Privacy Act (CCPA):
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Right to know what personal information is collected</li>
          <li>Right to know whether personal information is sold or disclosed</li>
          <li>Right to opt-out of the sale of personal information (we do not sell data)</li>
          <li>Right to equal service and price</li>
        </ul>
        <p className="text-gray-700 mt-4">
          <strong>Do Not Sell My Personal Information:</strong> We do not sell, rent, or trade your personal information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">11. Changes to This Policy</h2>
        <p className="text-gray-700 mb-4">
          We may update this privacy policy from time to time. Any changes will be posted in the app 
          with an updated "Last Updated" date. We encourage you to review this policy periodically. 
          Continued use of the app after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">12. Contact Us</h2>
        <p className="text-gray-700 mb-2">
          If you have questions about this privacy policy or how we handle your data, please contact us:
        </p>
        <ul className="list-none text-gray-700 space-y-1 mt-4">
          <li><strong>Email:</strong> support@robotpdf.com</li>
          <li><strong>Website:</strong> https://robotpdf.com</li>
          <li><strong>App Store:</strong> Through the Google Play Store listing</li>
        </ul>
        <p className="text-gray-700 mt-4">
          We will respond to your inquiry within 30 days.
        </p>
      </section>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-semibold mb-3 text-green-800">🔒 Privacy Guarantee</h3>
        <p className="text-gray-700">
          <strong>Your SMS messages never leave your device.</strong> All processing is done locally, 
          and only subscription-related information (merchant, amount, date) is stored - never the full SMS content. 
          No SMS data is transmitted to external servers or shared with third parties.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
        <h3 className="text-xl font-semibold mb-3 text-blue-800">📊 Permission Summary</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-blue-300 px-4 py-2 text-left">Permission</th>
              <th className="border border-blue-300 px-4 py-2 text-left">Purpose</th>
              <th className="border border-blue-300 px-4 py-2 text-left">Data Shared?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-blue-200 px-4 py-2">READ_SMS</td>
              <td className="border border-blue-200 px-4 py-2">Detect past UPI subscription payments</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong> - Local only</td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">RECEIVE_SMS</td>
              <td className="border border-blue-200 px-4 py-2">Real-time detection of new UPI payments</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong> - Local only</td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">POST_NOTIFICATIONS</td>
              <td className="border border-blue-200 px-4 py-2">Send renewal reminders</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong></td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">SCHEDULE_EXACT_ALARM</td>
              <td className="border border-blue-200 px-4 py-2">Schedule notifications 2 days before renewal</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong></td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">RECEIVE_BOOT_COMPLETED</td>
              <td className="border border-blue-200 px-4 py-2">Restore notifications after device restart</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong></td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">INTERNET</td>
              <td className="border border-blue-200 px-4 py-2">App updates, analytics, ads, in-app purchases</td>
              <td className="border border-blue-200 px-4 py-2">Anonymous usage only</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpiSubscriptionTrackerPrivacy;
