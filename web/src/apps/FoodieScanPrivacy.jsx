import React from 'react';

const FoodieScanPrivacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for FoodieScan</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p className="text-gray-700 mb-4">
          This Privacy Policy describes how FoodieScan ("we", "our", "us", or "the App")
          handles your information. FoodieScan uses AI to analyze food images and provide
          nutrition details. We are committed to protecting your privacy in compliance with GDPR and CCPA.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Camera & Images</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>Camera Permission:</strong> Used to capture food photos for AI nutrition analysis</li>
          <li><strong>Photo Library:</strong> Used to select existing food images from your device</li>
          <li><strong>Image Processing:</strong> Food images are sent to our AI service solely to identify food items and return nutrition data</li>
          <li><strong>No Image Storage:</strong> We do not permanently store your food images on our servers after analysis is complete</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Nutrition & Usage Data</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>Scan History:</strong> Nutrition results are stored locally on your device for your reference</li>
          <li><strong>App Settings:</strong> Dietary preferences and display settings saved locally</li>
          <li><strong>Anonymous Analytics:</strong> Aggregate usage data to improve AI accuracy and app performance</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Internet Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>Sending food images to our AI service for nutrition analysis</li>
          <li>Displaying advertisements (Google AdMob or similar ad networks)</li>
          <li>Processing in-app purchases via Google Play Billing / App Store</li>
          <li>App updates and anonymous usage analytics</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.4 Information We Do NOT Collect</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>We do not collect personal identification information</li>
          <li>We do not collect location data</li>
          <li>We do not access contacts, SMS, or call logs</li>
          <li>We do not retain food images after analysis is complete</li>
          <li>We do not track your activity outside the app</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Food images are transmitted securely to our AI service to identify food and return nutrition data</li>
          <li>Images are processed transiently and not retained on our servers after analysis</li>
          <li>Nutrition results are stored locally on your device for your scan history</li>
          <li>Anonymous analytics help us improve AI accuracy and fix bugs</li>
          <li>Ad networks may collect anonymous device identifiers for ad personalization</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Retention</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Local Storage:</strong> Scan history and settings are stored locally on your device</li>
          <li><strong>Image Retention:</strong> Food images are not stored on our servers after analysis</li>
          <li><strong>Data Removal:</strong> Delete all local data by clearing app data or uninstalling the app</li>
          <li><strong>Security:</strong> Image transmission uses HTTPS encryption; local data is protected by your device's security</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Third-Party Services</h2>
        <p className="text-gray-700 mb-4">FoodieScan uses the following third-party services:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>AI Nutrition Analysis Service:</strong> Processes food images to identify items and return nutrition data; images are not retained</li>
          <li><strong>Google Play Services / App Store:</strong> For app functionality and updates</li>
          <li><strong>Google Play Billing / In-App Purchases:</strong> For premium features and purchases</li>
          <li><strong>Ad Networks (e.g., Google AdMob):</strong> For displaying advertisements in the free version</li>
          <li><strong>Analytics Services:</strong> Anonymous usage statistics (no personal data or images)</li>
        </ul>
        <p className="text-gray-700 mt-4">
          No personal information or food images are shared with advertisers.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Monetization</h2>
        <p className="text-gray-700 mb-4">FoodieScan is supported by:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Advertisements:</strong> Free version includes ads from third-party networks</li>
          <li><strong>In-App Purchases:</strong> Premium features and ad-free experience available</li>
          <li><strong>Secure Payments:</strong> All purchases processed through official app stores</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Your Rights (GDPR & CCPA)</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Right to Access:</strong> Request information about data processing</li>
          <li><strong>Right to Deletion:</strong> Delete all local data by uninstalling the app or clearing app data</li>
          <li><strong>Right to Object:</strong> Revoke camera or photo library permissions at any time through device settings</li>
          <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
          <li><strong>Do Not Sell:</strong> We do not sell any user data or food images</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Children's Privacy</h2>
        <p className="text-gray-700 mb-4">
          FoodieScan is not directed at children under 13. We do not knowingly collect personal
          information from children under 13. If you are a parent or guardian and believe your
          child has used the app, please contact us.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">9. Changes to This Policy</h2>
        <p className="text-gray-700 mb-4">
          We may update this privacy policy periodically. Changes will be posted with an updated
          "Last Updated" date. Continued use of the app constitutes acceptance of any changes.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
        <p className="text-gray-700 mb-2">Questions about this privacy policy? Contact us:</p>
        <ul className="list-none text-gray-700 space-y-1 mt-4">
          <li><strong>Email:</strong> support@robotpdf.com</li>
          <li><strong>Website:</strong> https://robotpdf.com</li>
        </ul>
        <p className="text-gray-700 mt-4">We respond to inquiries within 30 days.</p>
      </section>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-semibold mb-3 text-green-800">🍎 Privacy-First Nutrition Scanning</h3>
        <p className="text-gray-700">
          <strong>Your food images are never stored.</strong> FoodieScan sends images securely to our AI
          for analysis and discards them immediately after — only the nutrition results are kept, locally on your device.
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
              <td className="border border-blue-200 px-4 py-2">CAMERA</td>
              <td className="border border-blue-200 px-4 py-2">Capture food photos for AI analysis</td>
              <td className="border border-blue-200 px-4 py-2">Image sent for analysis only, not stored</td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">READ_MEDIA_IMAGES</td>
              <td className="border border-blue-200 px-4 py-2">Select existing food photos for analysis</td>
              <td className="border border-blue-200 px-4 py-2">Image sent for analysis only, not stored</td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">INTERNET</td>
              <td className="border border-blue-200 px-4 py-2">AI analysis, ads, updates, purchases, analytics</td>
              <td className="border border-blue-200 px-4 py-2">Anonymous only</td>
            </tr>
            <tr>
              <td className="border border-blue-200 px-4 py-2">ACCESS_NETWORK_STATE</td>
              <td className="border border-blue-200 px-4 py-2">Check internet connectivity</td>
              <td className="border border-blue-200 px-4 py-2"><strong>NO</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FoodieScanPrivacy;
