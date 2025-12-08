import React from 'react';

const MergePrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy - PDF Merge App</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: December 2025</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p className="text-gray-700 mb-4">
          This Privacy Policy describes how PDF Merge App ("we", "our", "us", or "the App") developed by 
          RobotPDF handles your information. We are committed to protecting your privacy and ensuring 
          the security of your personal data in compliance with applicable data protection laws including 
          GDPR and CCPA.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-2 mt-4">2.1 File Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>The app requests permission to access PDF files on your device for merging</li>
          <li>Files are processed entirely on your device (client-side processing)</li>
          <li>No files are uploaded to or stored on our servers</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Storage Permission</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>Required to read multiple PDF files for combining</li>
          <li>Required to save the resulting merged PDF file to your device</li>
          <li>All files remain on your device under your control</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Information We Do NOT Collect</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>We do not collect personal identification information</li>
          <li>We do not collect device identifiers or advertising IDs</li>
          <li>We do not collect location data</li>
          <li>We do not use cookies or tracking technologies</li>
          <li>We do not collect usage analytics or behavioral data</li>
          <li>We do not transmit your documents to any server</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. How We Process Your Files</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All PDF merging is performed locally on your device</li>
          <li>Processing uses client-side JavaScript libraries</li>
          <li>No internet connection is required for the merge operation</li>
          <li>Your files never leave your device</li>
          <li>We have no access to your documents or their contents</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Retention</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All files are stored locally on your device only</li>
          <li>We do not maintain any copies of your documents</li>
          <li>No data is retained on our servers because no data is ever transmitted</li>
          <li>You can delete all app data by clearing browser cache or uninstalling the app</li>
          <li>You have full control over your merged PDF files</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
        <p className="text-gray-700 mb-4">We implement a privacy-by-design approach:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>100% client-side processing ensures your files never leave your device</li>
          <li>No server communication means no data breach risk</li>
          <li>No persistent storage of user documents on any server</li>
          <li>Your files are as secure as your device's security</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Third-Party Services</h2>
        <p className="text-gray-700 mb-4">
          The PDF Merge App does not integrate with any third-party services for file processing. 
          We do not use third-party analytics, advertising networks, or tracking services. 
          All functionality is self-contained within the app.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Your Rights (GDPR & CCPA)</h2>
        <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Right to Access:</strong> Request information about data processing</li>
          <li><strong>Right to Deletion:</strong> Delete your data by clearing app/browser data</li>
          <li><strong>Right to Data Portability:</strong> Your files are already on your device</li>
          <li><strong>Right to Object:</strong> Object to certain data processing activities</li>
          <li><strong>Right to Withdraw Consent:</strong> Revoke storage permissions at any time</li>
          <li><strong>Right to Non-Discrimination:</strong> We do not discriminate against users who exercise their rights</li>
        </ul>
        <p className="text-gray-700 mt-4">
          Since we process files locally and do not collect personal data, most privacy rights are automatically fulfilled by design.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Children's Privacy</h2>
        <p className="text-gray-700 mb-4">
          This app is not directed at children under 13 years of age. We do not knowingly collect 
          personal information from children under 13. Since we do not collect any personal data, 
          children's privacy is protected by design.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">9. California Privacy Rights</h2>
        <p className="text-gray-700 mb-4">
          California residents have additional rights under the California Consumer Privacy Act (CCPA):
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Right to know what personal information is collected (we collect none)</li>
          <li>Right to know whether personal information is sold or disclosed (we do not sell data)</li>
          <li>Right to opt-out of the sale of personal information (not applicable)</li>
          <li>Right to equal service and price</li>
        </ul>
        <p className="text-gray-700 mt-4">
          <strong>Do Not Sell My Personal Information:</strong> We do not sell, rent, or trade any personal information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">10. Changes to This Policy</h2>
        <p className="text-gray-700 mb-4">
          We may update this privacy policy from time to time. Any changes will be posted in the app 
          and on our website. We encourage you to review this policy periodically. Continued use of 
          the app after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
        <p className="text-gray-700 mb-2">
          If you have any questions, concerns, or requests regarding this privacy policy, please contact us:
        </p>
        <ul className="list-none text-gray-700 space-y-1 mt-4">
          <li><strong>Email:</strong> support@robotpdf.com</li>
          <li><strong>Website:</strong> https://robotpdf.com</li>
          <li><strong>App Store:</strong> Through the app store listing</li>
        </ul>
        <p className="text-gray-700 mt-4">
          We will respond to your inquiry within 30 days.
        </p>
      </section>
    </div>
  );
};

export default MergePrivacyPolicy;
