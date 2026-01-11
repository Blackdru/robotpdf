import React from 'react';

const ImageToPDFPrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy - Image to PDF Converter</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: December 2025</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p className="text-gray-700 mb-4">
          This Privacy Policy describes how Image to PDF Converter ("we", "our", "us", or "the App") developed by 
          RobotPDF handles your information. We are committed to protecting your privacy and ensuring 
          the security of your personal data in compliance with applicable data protection laws including 
          GDPR and CCPA.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Files and Documents</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>Data Collected:</strong> Image files (JPG, PNG, etc.) you upload for PDF conversion</li>
          <li><strong>Purpose:</strong> To convert your images into PDF format</li>
          <li><strong>Processing:</strong> Files are uploaded to RobotPDF servers (app.robotpdf.com) for conversion processing</li>
          <li><strong>Retention:</strong> Files are deleted immediately after processing completes</li>
          <li><strong>Storage:</strong> No files are stored permanently on our servers</li>
          <li><strong>Required:</strong> Yes - this is core app functionality</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Permissions Used</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li><strong>INTERNET:</strong> Required to upload image files to RobotPDF servers for processing</li>
          <li><strong>READ_EXTERNAL_STORAGE:</strong> Required to read image files from your device</li>
          <li><strong>WRITE_EXTERNAL_STORAGE:</strong> Required to save converted PDF files to your device</li>
          <li><strong>CAMERA (Optional):</strong> If you choose to capture images directly for conversion</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Information We Do NOT Collect</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>We do not collect personal identification information (name, email, phone, address)</li>
          <li>We do not collect device identifiers or advertising IDs</li>
          <li>We do not collect location data</li>
          <li>We do not use analytics or tracking SDKs</li>
          <li>We do not log file contents</li>
          <li>We do not require user accounts</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. How We Process Your Files</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Image files are uploaded to RobotPDF servers (app.robotpdf.com) via HTTPS/TLS encrypted connection</li>
          <li>Files are processed on our servers to convert images to PDF format</li>
          <li>The converted PDF is returned to your device immediately after processing</li>
          <li>All uploaded files are automatically deleted from our servers immediately after processing is complete</li>
          <li>No copies of your files are retained on our servers</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Retention</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Server Retention:</strong> Zero retention - files are deleted immediately after processing</li>
          <li><strong>Processing Duration:</strong> Files exist on server only during conversion processing</li>
          <li><strong>Local Storage:</strong> Converted PDF files are saved to your device under your control</li>
          <li><strong>No Permanent Storage:</strong> We do not maintain any copies of your documents on our servers</li>
          <li><strong>Data Deletion:</strong> Automatic and immediate upon processing completion</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
        <p className="text-gray-700 mb-4">We implement robust security measures:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Encryption in Transit:</strong> All network traffic uses HTTPS/TLS 1.2+ encryption</li>
          <li><strong>Secure Processing:</strong> Files processed in secure, isolated server environments</li>
          <li><strong>Instant Deletion:</strong> Files deleted immediately after processing completes</li>
          <li><strong>No Logging:</strong> File contents are never logged or stored in any logs</li>
          <li><strong>Minimal Data Collection:</strong> No user accounts or personal data required</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Third-Party Services</h2>
        <p className="text-gray-700 mb-4">
          Image to PDF conversion is performed exclusively on RobotPDF servers (app.robotpdf.com). 
          Image file content is processed only for conversion purposes and is not stored.
        </p>
        <p className="text-gray-700 mt-4">
          We do not use third-party analytics, advertising networks, or tracking services.
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
          Since we do not collect or store personal data, most privacy rights are automatically fulfilled by design.
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

export default ImageToPDFPrivacyPolicy;
