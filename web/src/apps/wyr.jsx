import React from 'react';

const WYRPrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for WYR - Would you Rather</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p className="text-gray-700 mb-4">
          This Privacy Policy describes how WYR - Would you Rather ("we", "our", "us", or "the App") 
          handles your information. We are committed to protecting your privacy and ensuring the security 
          of your personal data in compliance with applicable data protection laws including GDPR and CCPA.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Game Data</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>Question Responses:</strong> Your choices in "Would you Rather" questions</li>
          <li><strong>Custom Questions:</strong> Any custom questions you create within the app</li>
          <li><strong>Game Statistics:</strong> Questions answered, categories played, and gameplay patterns</li>
          <li><strong>Processing location:</strong> All data processing happens <strong>locally on your device</strong></li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.2 App Functionality Data</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>Favorites:</strong> Questions you mark as favorites</li>
          <li><strong>History:</strong> Previously answered questions (stored locally)</li>
          <li><strong>Settings:</strong> App preferences and customization options</li>
          <li><strong>Categories:</strong> Your preferred question categories and themes</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Technical Information</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>Anonymous usage analytics for app improvement</li>
          <li>Crash reports and error logs (no personal data included)</li>
          <li>App performance metrics</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.4 Information We Do NOT Collect</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>We do not collect personal identification information</li>
          <li>We do not access your contacts or social media accounts</li>
          <li>We do not collect location data</li>
          <li>We do not record or store personal conversations</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All game data is processed <strong>locally on your device</strong></li>
          <li>User preferences are stored locally to personalize your experience</li>
          <li>Game statistics help improve question recommendations</li>
          <li>No personal game data is transmitted to external servers</li>
          <li>Anonymous analytics help us improve app functionality and user experience</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Retention</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Local Storage Only:</strong> All user data is stored locally on your device</li>
          <li><strong>No Cloud Storage:</strong> We do not upload or store your data on external servers</li>
          <li><strong>Data Encryption:</strong> Local data is encrypted using device security features</li>
          <li><strong>Data Removal:</strong> You can delete all data by clearing app data or uninstalling</li>
          <li><strong>Game Responses:</strong> Stored locally only for statistics and personalization</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
        <p className="text-gray-700 mb-4">We implement security measures to protect your data:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All data processing is performed locally on your device</li>
          <li>No transmission of personal content to external servers</li>
          <li>Local data encryption using device security features</li>
          <li>Minimal data collection (only what's necessary for functionality)</li>
          <li>No third-party access to your game responses or preferences</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Third-Party Services</h2>
        <p className="text-gray-700 mb-4">The app may use the following third-party services:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>App Store Services:</strong> For app functionality and updates</li>
          <li><strong>Analytics Services:</strong> Anonymous usage statistics (no personal data)</li>
          <li><strong>Ad Networks (if applicable):</strong> For displaying advertisements in free version</li>
        </ul>
        <p className="text-gray-700 mt-4">
          <strong>Important:</strong> These services may collect anonymous device identifiers according 
          to their own privacy policies. However, your game responses and preferences are 
          NEVER shared with any third-party service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Your Rights (GDPR & CCPA)</h2>
        <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Right to Access:</strong> Request information about data processing</li>
          <li><strong>Right to Deletion:</strong> Delete all data by uninstalling the app or clearing app data</li>
          <li><strong>Right to Data Portability:</strong> Export your game statistics from the app</li>
          <li><strong>Right to Object:</strong> Disable analytics through app settings</li>
          <li><strong>Right to Withdraw Consent:</strong> Modify permissions in device settings</li>
        </ul>
        <p className="text-gray-700 mt-4">
          Since we do not store personal data externally, most privacy rights are automatically fulfilled by design.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Children's Privacy</h2>
        <p className="text-gray-700 mb-4">
          This app is not directed at children under 13 years of age. We do not knowingly collect 
          personal information from children under 13. If you are a parent or guardian and believe 
          your child has provided us with personal information, please contact us.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">9. Changes to This Policy</h2>
        <p className="text-gray-700 mb-4">
          We may update this privacy policy from time to time. Any changes will be posted in the app 
          with an updated "Last Updated" date. We encourage you to review this policy periodically. 
          Continued use of the app after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
        <p className="text-gray-700 mb-2">
          If you have questions about this privacy policy or how we handle your data, please contact us:
        </p>
        <ul className="list-none text-gray-700 space-y-1 mt-4">
          <li><strong>Email:</strong> support@robotpdf.com</li>
          <li><strong>Website:</strong> https://robotpdf.com</li>
        </ul>
        <p className="text-gray-700 mt-4">
          We will respond to your inquiry within 30 days.
        </p>
      </section>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-semibold mb-3 text-green-800">🔒 Privacy Guarantee</h3>
        <p className="text-gray-700">
          <strong>Your game responses and preferences never leave your device.</strong> All processing 
          is done locally, and only game statistics are stored - never personal information. 
          No personal data is transmitted to external servers or shared with third parties.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
        <h3 className="text-xl font-semibold mb-3 text-blue-800">📊 Data Summary</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100">
              <th className="border border-blue-300 px-4 py-2 text-left">Data Type</th>
              <th className="border border-blue-300 px-4 py-2 text-left">Purpose</th>
              <th className="border border-blue-300 px-4 py-2 text-left">Shared?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-blue-200 px-4 py-2">Game Responses</td>
              <td className="border border-blue-200 px-4 py-2">Track preferences and statistics</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong> - Local only</td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">Custom Questions</td>
              <td className="border border-blue-200 px-4 py-2">Personalize game experience</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong> - Local only</td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">App Settings</td>
              <td className="border border-blue-200 px-4 py-2">Customize user experience</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong></td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">Anonymous Analytics</td>
              <td className="border border-blue-200 px-4 py-2">App improvement and bug fixes</td>
              <td className="border border-blue-200 px-4 py-2">Anonymous usage only</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WYRPrivacyPolicy;