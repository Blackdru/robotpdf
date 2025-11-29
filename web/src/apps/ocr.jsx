import React from 'react';

const OCRPrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for Text Extractor - Image &amp; PDF</h1>
      <p className="text-sm text-gray-600 mb-8">Last Updated: December 2025</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
        <p className="text-gray-700 mb-4">
          This Privacy Policy describes how Text Extractor - Image & PDF ("we", "our", or "the app") handles your information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mb-2 mt-4">Camera and Photo Library Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>The app requests camera permission to take photos of documents</li>
          <li>The app requests photo library access to select existing images</li>
          <li>Photos are processed locally on your device and sent to our OCR API for text extraction</li>
          <li>We do not store your photos on our servers after processing</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">File Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>The app requests permission to access PDF files on your device</li>
          <li>Files are processed for text extraction only</li>
          <li>We do not store your files after processing</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2 mt-4">Internet Access</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>The app requires internet connection to send images/PDFs to our OCR API</li>
          <li>API endpoint: RobotPDF.com</li>
          <li>Data is transmitted securely over HTTPS</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Images and PDFs are sent to our OCR service for text extraction</li>
          <li>Extracted text is returned to your device</li>
          <li>No personal information is collected or stored</li>
          <li>No analytics or tracking is performed</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Storage</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>All extracted text is stored locally on your device only</li>
          <li>We do not maintain copies of your documents or extracted text</li>
          <li>You can delete all data by uninstalling the app</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Third-Party Services</h2>
        <p className="text-gray-700 mb-4">
          OCR processing is performed by RobotPDF.com API. Please refer to RobotPDF.com's privacy policy for their data handling practices.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Children's Privacy</h2>
        <p className="text-gray-700 mb-4">
          This app does not knowingly collect information from children under 13.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Changes to This Policy</h2>
        <p className="text-gray-700 mb-4">
          We may update this privacy policy from time to time. Changes will be posted in the app.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>You can delete all app data by uninstalling the app</li>
          <li>You control which photos and files you share with the app</li>
          <li>You can revoke camera and storage permissions at any time in device settings</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
        <p className="text-gray-700">
          For questions about this privacy policy, please contact us at support@robotpdf.com or through the app store listing.
        </p>
      </section>
    </div>
  );
};

export default OCRPrivacyPolicy;
