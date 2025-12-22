import React from 'react';

const CompressPrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy - PDF Compress App</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p className="text-gray-700 mb-4">
          This Privacy Policy describes how PDF Compress App ("we", "our", "us", or "the App") developed by 
          RobotPDF handles your information. We are committed to protecting your privacy and ensuring 
          the security of your personal data in compliance with applicable data protection laws including 
          GDPR and CCPA.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Data Types Collected</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>Documents and Files:</strong> PDF files you upload for compression</li>
          <li><strong>Images:</strong> Any images contained within your PDF documents</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.2 File Access and Processing</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>The app requests permission to access PDF files on your device for compression</li>
          <li>Your files are temporarily uploaded to RobotPDF servers for processing</li>
          <li>Files are transmitted securely over HTTPS with TLS 1.2+ encryption</li>
          <li>Processing is performed on our secure servers to ensure optimal compression</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Storage Permission</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>Required to read PDF files for compression</li>
          <li>Required to save the resulting compressed PDF file to your device</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.4 Information We Do NOT Collect</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>We do not collect personal identification information</li>
          <li>We do not collect device identifiers or advertising IDs</li>
          <li>We do not collect location data</li>
          <li>We do not use cookies or tracking technologies</li>
          <li>We do not collect usage analytics or behavioral data</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. How We Process Your Files</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Your PDF files are temporarily uploaded to RobotPDF servers for compression</li>
          <li>All data transmission is encrypted using HTTPS/TLS 1.2+ protocols</li>
          <li>Files are processed in secure, isolated server environments</li>
          <li>The compressed PDF is returned to your device immediately after processing</li>
          <li>An internet connection is required for the compression operation</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Retention</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Temporary Server Storage:</strong> Files are temporarily stored on RobotPDF servers only during compression processing</li>
          <li><strong>Automatic Deletion:</strong> All uploaded files and processed documents are automatically deleted from our servers immediately after processing is complete</li>
          <li><strong>No Long-term Storage:</strong> We do not retain, backup, or store any copies of your documents on our servers</li>
          <li><strong>Local Storage:</strong> The final compressed PDF is saved to your device and remains under your control</li>
          <li><strong>Data Removal:</strong> You can delete all local app data by clearing browser cache or uninstalling the app</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
        <p className="text-gray-700 mb-4">We implement industry-standard security measures to protect your data:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All data transmission is encrypted using HTTPS/TLS 1.2+ protocols</li>
          <li>Files are processed in secure, isolated server environments</li>
          <li>No persistent storage of user documents on our servers</li>
          <li>Automatic deletion of all files immediately after processing</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Access to processing systems is strictly controlled and logged</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Third-Party Services</h2>
        <p className="text-gray-700 mb-4">
          PDF compression is performed exclusively on RobotPDF servers. We do not share your documents 
          with any third-party services. We do not use third-party analytics, advertising networks, or 
          tracking services. Your files are processed solely on our secure servers and are not transmitted 
          to any external parties.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Your Rights (GDPR & CCPA)</h2>
        <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Right to Access:</strong> Request information about data processing</li>
          <li><strong>Right to Deletion:</strong> Request deletion of your data (achieved by uninstalling the app)</li>
          <li><strong>Right to Data Portability:</strong> Your files are already on your device</li>
          <li><strong>Right to Object:</strong> Object to certain data processing activities</li>
          <li><strong>Right to Withdraw Consent:</strong> Revoke storage permissions at any time</li>
          <li><strong>Right to Non-Discrimination:</strong> We do not discriminate against users who exercise their rights</li>
        </ul>
        <p className="text-gray-700 mt-4">
          Since we do not store personal data long-term, most privacy rights are automatically fulfilled by design.
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
        </ul>
        <p className="text-gray-700 mt-4">
          We will respond to your inquiry within 30 days.
        </p>
      </section>
    </div>
  );
};

export default CompressPrivacyPolicy;
