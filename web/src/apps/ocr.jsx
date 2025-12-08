import React from 'react';

const OCRPrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for Text Extractor - Image &amp; PDF (OCR)</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: December 2025</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p className="text-gray-700 mb-4">
          This Privacy Policy describes how Text Extractor - Image & PDF ("we", "our", "us", or "the App") 
          developed by RobotPDF handles your information. We are committed to protecting your privacy and 
          ensuring the security of your personal data in compliance with applicable data protection laws 
          including GDPR and CCPA.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Camera and Photo Library Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>The app requests camera permission to take photos of documents for OCR processing</li>
          <li>The app requests photo library access to select existing images for text extraction</li>
          <li>Photos are processed and sent to our secure OCR API for text extraction</li>
          <li>We do not store your photos on our servers after processing is complete</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.2 File Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>The app requests permission to access PDF files on your device</li>
          <li>Files are processed solely for text extraction purposes</li>
          <li>We do not store or retain your files after processing</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Internet Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>The app requires internet connection to send images/PDFs to our OCR API</li>
          <li>API endpoint: RobotPDF.com</li>
          <li>All data is transmitted securely over HTTPS with TLS 1.2+ encryption</li>
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
        <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Images and PDFs are sent to our OCR service solely for text extraction</li>
          <li>Extracted text is returned to your device immediately after processing</li>
          <li>No personal information is collected, stored, or shared</li>
          <li>No analytics, tracking, or profiling is performed</li>
          <li>We do not use your data for advertising purposes</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Retention</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All extracted text is stored locally on your device only</li>
          <li>We do not maintain copies of your documents or extracted text on our servers</li>
          <li>Files uploaded for OCR processing are automatically deleted within seconds after processing</li>
          <li>No backup copies of your data are retained</li>
          <li>You can delete all local data by clearing app data or uninstalling the app</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
        <p className="text-gray-700 mb-4">We implement industry-standard security measures to protect your data:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All data transmission is encrypted using HTTPS/TLS 1.2+</li>
          <li>Files are processed in isolated, secure environments</li>
          <li>No persistent storage of user documents on our servers</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Access to processing systems is strictly controlled and logged</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Third-Party Services</h2>
        <p className="text-gray-700 mb-4">
          OCR processing is performed by RobotPDF.com API. Our API processes your documents securely 
          and does not share data with any third parties. We do not integrate with any third-party 
          analytics, advertising, or tracking services.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. International Data Transfers</h2>
        <p className="text-gray-700 mb-4">
          Our servers are located in secure data centers. When you use the app, your documents may be 
          temporarily processed on servers that may be located in different jurisdictions. All transfers 
          are conducted securely and in compliance with applicable data protection laws.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Your Rights (GDPR & CCPA)</h2>
        <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Right to Access:</strong> Request information about data processing</li>
          <li><strong>Right to Deletion:</strong> Request deletion of your data (achieved by uninstalling the app)</li>
          <li><strong>Right to Data Portability:</strong> Export your locally stored data</li>
          <li><strong>Right to Object:</strong> Object to certain data processing activities</li>
          <li><strong>Right to Withdraw Consent:</strong> Revoke permissions at any time in device settings</li>
          <li><strong>Right to Non-Discrimination:</strong> We do not discriminate against users who exercise their rights</li>
        </ul>
        <p className="text-gray-700 mt-4">
          Since we do not store personal data, most of these rights are automatically fulfilled by design.
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
        <h2 className="text-2xl font-semibold mb-3">10. Changes to This Policy</h2>
        <p className="text-gray-700 mb-4">
          We may update this privacy policy from time to time. Any changes will be posted in the app 
          and on our website. We encourage you to review this policy periodically. Continued use of 
          the app after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">11. California Privacy Rights</h2>
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
        <h2 className="text-2xl font-semibold mb-3">12. Contact Us</h2>
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

export default OCRPrivacyPolicy;
