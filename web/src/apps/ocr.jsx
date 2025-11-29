import React from 'react';

const OCRPrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy - OCR App</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
        <p className="text-gray-700 mb-4">
          This privacy policy applies to the OCR App ("App") developed by RobotPDF. 
          We respect your privacy and are committed to protecting your personal data.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Collection and Storage</h2>
        <p className="text-gray-700 mb-4">
          The OCR App processes images and documents locally on your device to extract text. 
          We do not store any files from anonymous users. Only logged-in users on the RobotPDF website 
          have the option to save and store their processed files in their account.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Permissions Required</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><strong>Camera:</strong> To capture images and documents for OCR text extraction</li>
          <li><strong>File Picker/Storage:</strong> To select and read files from your device for processing</li>
          <li><strong>Storage:</strong> To save processed documents and extracted text to your device</li>
          <li><strong>Internet:</strong> Required for OCR processing and optional cloud storage for logged-in users</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
        <p className="text-gray-700 mb-4">
          Files from anonymous users are processed and immediately deleted from our servers. 
          Only users who create an account and log in to RobotPDF can choose to store their files. 
          All data transmission is encrypted and secure.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
        <p className="text-gray-700">
          If you have any questions about this privacy policy, please contact us at support@robotpdf.com
        </p>
      </section>
    </div>
  );
};

export default OCRPrivacyPolicy;
